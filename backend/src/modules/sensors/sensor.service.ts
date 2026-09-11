import { numeric } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { Reading } from "../../db/models/reading.model.js";
import { Device } from "../../db/models/device.model.js";
import { emitToAll, emitToRoom } from "../../config/socket.js";
import { createAlert } from "../alerts/alert.service.js";
import { assessRisk, shouldAlert } from "./riskEngine.js";
import type { ISensorData } from "./sensor.types.js";

/**
 * Per-device state used for edge detection and de-duplication, so a unit sitting
 * in an alarm condition produces one alert rather than one per serial frame.
 */
interface DeviceState {
  lastAlertAt: number;
  lastKind: string | null;
  inAlarm: boolean;
  /** Cached so the hot path does not re-query the device on every frame. */
  stationId: string | null;
}

const deviceState = new Map<string, DeviceState>();

export interface IngestResult {
  accepted: boolean;
  riskScore: number;
  factors: string[];
  alertCreated: boolean;
  alertId?: string;
  reason?: string;
}

export interface IngestOptions {
  /**
   * Whether to append this frame to the reading history. Defaults to true.
   * The built-in simulator streams frames every few seconds but only keeps
   * one in a few, so a hosted demo does not fill a free database tier with
   * synthetic history. A frame that raises an alert is always stored, so the
   * alert detail can show the readings at trigger time.
   */
  persist?: boolean;
}

/**
 * Single entry point for a sensor frame, whatever its transport.
 * Serial (Arduino today) and HTTP (ESP32 later) both land here.
 *
 * Ordering matters: this is a life-safety path, so the risk score is computed
 * and the alert is raised and broadcast *before* the bookkeeping writes
 * (reading history, device snapshot) are awaited. Those are fired concurrently
 * and awaited at the end, which removes two round-trips to Mongo from the time
 * between a flame appearing and the console showing it.
 */
export async function ingestReading(
  data: ISensorData,
  opts: IngestOptions = {},
): Promise<IngestResult> {
  const deviceCode = String(data.deviceCode ?? "").trim();

  if (!deviceCode) {
    return {
      accepted: false,
      riskScore: 0,
      factors: [],
      alertCreated: false,
      reason: "deviceCode is required",
    };
  }

  const assessment = assessRisk(data);
  const recordedAt = new Date();

  const temperature = Number(data.temp ?? 0);
  const humidity = Number(data.humidity ?? 0);
  const smoke = Number(data.smoke ?? 0);
  const gas = Number(data.gas ?? 0);
  const flame = Number(data.fire ?? 0);

  const state = deviceState.get(deviceCode) ?? {
    lastAlertAt: 0,
    lastKind: null,
    inAlarm: false,
    stationId: null,
  };

  // ── Live telemetry goes out immediately, before any DB write ─────────────
  const telemetry = {
    deviceCode,
    temperature,
    humidity,
    smoke,
    gas,
    flame,
    riskScore: assessment.score,
    riskFactors: assessment.factors,
    priority: assessment.priority,
    kind: assessment.kind,
    summary: assessment.summary,
    recordedAt,
  };

  if (state.stationId) {
    emitToRoom(`station:${state.stationId}`, "telemetry:reading", telemetry);
  } else {
    emitToAll("telemetry:reading", telemetry);
  }

  // ── Alert decision ───────────────────────────────────────────────────────
  // Pure in-memory work, so doing it before the writes start costs nothing on
  // the alert path and lets the reading write be skipped when not wanted.
  const now = Date.now();
  const alarmWorthy = shouldAlert(assessment);

  const isRisingEdge = alarmWorthy && !state.inAlarm;
  const kindChanged = alarmWorthy && state.lastKind !== assessment.kind;
  const windowElapsed = now - state.lastAlertAt >= numeric.dedupeWindowMs;

  const createNew =
    alarmWorthy && (isRisingEdge || kindChanged || windowElapsed);

  deviceState.set(deviceCode, {
    lastAlertAt: createNew ? now : state.lastAlertAt,
    lastKind: alarmWorthy ? assessment.kind : null,
    inAlarm: alarmWorthy,
    stationId: state.stationId,
  });

  // ── Bookkeeping writes, started but not awaited yet ──────────────────────
  const readingWrite =
    (opts.persist ?? true) || createNew
      ? Reading.create({
          deviceCode,
          temperature,
          humidity,
          smoke,
          gas,
          gasType: data.gasType ?? null,
          flame,
          riskScore: assessment.score,
          riskFactors: assessment.factors,
          recordedAt,
        })
      : null;

  const deviceWrite = Device.updateOne(
    { deviceCode },
    {
      $set: {
        lastSeenAt: recordedAt,
        lastHeartbeatAt: recordedAt,
        "lastSensorData.temperature": temperature,
        "lastSensorData.humidity": humidity,
        "lastSensorData.smokeLevel": smoke,
        "lastSensorData.gasLevel": gas,
        "lastSensorData.flame": flame,
        "lastSensorData.riskScore": assessment.score,
        "lastSensorData.readAt": recordedAt,
      },
    },
  );

  if (!createNew) {
    await Promise.all([readingWrite, deviceWrite]);
    return {
      accepted: true,
      riskScore: assessment.score,
      factors: assessment.factors,
      alertCreated: false,
      reason: alarmWorthy ? "suppressed (duplicate)" : "below alert threshold",
    };
  }

  // createAlert resolves the device's station/building and broadcasts.
  const alert = await createAlert({
    ...(data as ISensorData),
    deviceCode,
    assessment,
  });

  // Cache the station so subsequent frames emit straight into the right room.
  if (alert.stationId) {
    const current = deviceState.get(deviceCode)!;
    deviceState.set(deviceCode, { ...current, stationId: alert.stationId });
  }

  const [reading] = await Promise.all([readingWrite, deviceWrite]);

  // readingWrite is always started on the alert path (see above), so this is
  // only a type guard.
  if (reading) {
    await Reading.updateOne(
      { _id: reading._id },
      { $set: { alertId: alert.id } },
    );
  }

  logger.warn(
    `ALERT ${assessment.priority.toUpperCase()} from ${deviceCode} — ${assessment.summary}`,
  );

  return {
    accepted: true,
    riskScore: assessment.score,
    factors: assessment.factors,
    alertCreated: true,
    alertId: alert.id,
  };
}

/** Clears in-memory edge state (used by tests and the seed script). */
export function resetDeviceState(): void {
  deviceState.clear();
}
