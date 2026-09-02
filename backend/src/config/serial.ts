import { EventEmitter } from "node:events";
import { ReadlineParser, SerialPort } from "serialport";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

/**
 * Serial link to the OGNIBORMO Arduino unit.
 *
 * The board is optional: a dev machine with no unit plugged in should still run
 * the full API. So instead of exporting a live SerialPort (which threw on
 * import when COM4 was absent), this exports a stable emitter that reconnects
 * in the background and emits `line` for each newline-delimited frame.
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

let port: SerialPort | null = null;
let retryTimer: NodeJS.Timeout | null = null;
let stopped = false;

function scheduleReconnect() {
  if (stopped || retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    open();
  }, retryInterval);
}

function open() {
  if (stopped) return;

  const serial = new SerialPort(
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

    const parser = serial.pipe(new ReadlineParser({ delimiter: "\n" }));

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

    serial.on("error", (e) => {
      status.lastError = e.message;
      logger.error(`Serial error on ${status.path}: ${e.message}`);
    });
  });
}

export function initSerial(): void {
  stopped = false;
  open();
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
  try {
    const ports = await SerialPort.list();
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
