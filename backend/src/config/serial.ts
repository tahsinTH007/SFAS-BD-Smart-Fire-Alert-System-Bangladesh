import { EventEmitter } from "node:events";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

/**
 * Serial link to the OGNIBORMO Arduino unit.
 *
 * The board is optional: a dev machine with no unit plugged in should still run
 * the full API. So instead of exporting a live SerialPort (which threw on
 * import when COM4 was absent), this exports a stable emitter that reconnects
 * in the background and emits `line` for each newline-delimited frame.
 *
 * `serialport` is a native module and an optional dependency. It is loaded
 * lazily, only when the link is actually opened, so a hosted deployment with
 * SERIAL_ENABLED=false never touches it — and a failed native build on the
 * host degrades to "serial unavailable" instead of crashing on import.
 */
export const serialEvents = new EventEmitter();

export type SerialStatus = {
  connected: boolean;
  path: string;
  baudRate: number;
  lastLineAt: string | null;
  lastError: string | null;
  reconnectAttempts: number;
};

const status: SerialStatus = {
  connected: false,
  path: env.SERIAL_PORT,
  baudRate: Number(env.SERIAL_BAUD_RATE),
  lastLineAt: null,
  lastError: null,
  reconnectAttempts: 0,
};

export const getSerialStatus = (): SerialStatus => ({ ...status });

const retryInterval = Number(env.SERIAL_RETRY_INTERVAL) || 5000;

// Minimal shape of what this module uses from `serialport`, so the compiled
// output carries no static reference to the package.
interface PortLike extends NodeJS.EventEmitter {
  isOpen: boolean;
  open(cb: (err: Error | null) => void): void;
  close(): void;
  pipe<T extends NodeJS.EventEmitter>(dest: T): T;
}

interface SerialModule {
  SerialPort: {
    new (
      opts: { path: string; baudRate: number; autoOpen: boolean },
      cb?: () => void,
    ): PortLike;
    list(): Promise<
      {
        path: string;
        manufacturer?: string;
        serialNumber?: string;
        productId?: string;
      }[]
    >;
  };
  ReadlineParser: new (opts: { delimiter: string }) => NodeJS.EventEmitter;
}

let modulePromise: Promise<SerialModule | null> | null = null;

// Non-literal specifier on purpose: tsc then does not need serialport's type
// declarations, so the build still passes on a host where the optional
// native package was not installed.
const SERIALPORT_MODULE = "serialport";

function loadSerialModule(): Promise<SerialModule | null> {
  if (!modulePromise) {
    modulePromise = (import(SERIALPORT_MODULE) as Promise<unknown>)
      .then((m) => m as SerialModule)
      .catch((err: Error) => {
        status.lastError = `serialport module unavailable: ${err.message}`;
        logger.warn(status.lastError);
        return null;
      });
  }
  return modulePromise;
}

let port: PortLike | null = null;
let retryTimer: NodeJS.Timeout | null = null;
let stopped = false;

function scheduleReconnect() {
  if (stopped || retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void open();
  }, retryInterval);
}

async function open() {
  if (stopped) return;

  const mod = await loadSerialModule();
  if (!mod || stopped) return;

  const serial = new mod.SerialPort(
    {
      path: status.path,
      baudRate: status.baudRate,
      autoOpen: false,
    },
    // Errors surface on the 'error' handler below; this callback keeps the
    // constructor from throwing synchronously.
    () => undefined,
  );

  serial.open((err) => {
    if (err) {
      status.connected = false;
      status.lastError = err.message;
      status.reconnectAttempts += 1;

      if (status.reconnectAttempts === 1) {
        logger.warn(
          `Serial port ${status.path} unavailable (${err.message}) — retrying every ${retryInterval}ms. Sensor ingest is offline; the REST API is unaffected.`,
        );
      }
      scheduleReconnect();
      return;
    }

    port = serial;
    status.connected = true;
    status.lastError = null;
    status.reconnectAttempts = 0;
    logger.info(`Serial port connected → ${status.path} @ ${status.baudRate}`);

    const parser = serial.pipe(new mod.ReadlineParser({ delimiter: "\n" }));

    parser.on("data", (line: string) => {
      status.lastLineAt = new Date().toISOString();
      serialEvents.emit("line", line);
    });

    serial.on("close", () => {
      status.connected = false;
      port = null;
      logger.warn(`Serial port ${status.path} closed — reconnecting`);
      scheduleReconnect();
    });

    serial.on("error", (e: Error) => {
      status.lastError = e.message;
      logger.error(`Serial error on ${status.path}: ${e.message}`);
    });
  });
}

export function initSerial(): void {
  stopped = false;
  void open();
}

export function closeSerial(): void {
  stopped = true;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (port?.isOpen) port.close();
  port = null;
  status.connected = false;
}

/** Lists serial ports available on this machine (for the dashboard's setup UI). */
export async function listSerialPorts() {
  // Never load the native module just to answer a status request when the
  // link is disabled — a cloud host has no serial ports to list anyway.
  if (env.SERIAL_ENABLED !== "true") return [];

  try {
    const mod = await loadSerialModule();
    if (!mod) return [];
    const ports = await mod.SerialPort.list();
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer ?? null,
      serialNumber: p.serialNumber ?? null,
      productId: p.productId ?? null,
    }));
  } catch {
    return [];
  }
}
