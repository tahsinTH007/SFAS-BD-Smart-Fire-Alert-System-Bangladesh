import { numeric } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { Reading } from "../../db/models/reading.model.js";
import { Device } from "../../db/models/device.model.js";
import { emitToAll } from "../../config/socket.js";
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

/**
 * Single entry point for a sensor frame, whatever its transport.
 * Serial (Arduino today) and HTTP (ESP32 later) both land here.
 */
export async function ingestReading(
  data: ISensorData,
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

  // ── Persist the reading (every frame, alarm or not) ──────────────────────
  const reading = await Reading.create({
    deviceCode,
    temperature: Number(data.temp ?? 0),
    humidity: Number(data.humidity ?? 0),
    smoke: Number(data.smoke ?? 0),
    gas: Number(data.gas ?? 0),
    gasType: data.gasType ?? null,
    flame: Number(data.fire ?? 0),
    riskScore: assessment.score,
    riskFactors: assessment.factors,
    recordedAt: new Date(),
  });

  // ── Keep the device's live snapshot current ──────────────────────────────
  await Device.updateOne(
    { deviceCode },
    {
      $set: {
        lastSeenAt: new Date(),
        lastHeartbeatAt: new Date(),
        "lastSensorData.temperature": Number(data.temp ?? 0),
        "lastSensorData.humidity": Number(data.humidity ?? 0),
        "lastSensorData.smokeLevel": Number(data.smoke ?? 0),
        "lastSensorData.gasLevel": Number(data.gas ?? 0),
        "lastSensorData.flame": Number(data.fire ?? 0),
        "lastSensorData.riskScore": assessment.score,
        "lastSensorData.readAt": new Date(),
      },
    },
  );

  // ── Push live telemetry to every dashboard ───────────────────────────────
  emitToAll("telemetry:reading", {
    deviceCode,
    temperature: Number(data.temp ?? 0),
    humidity: Number(data.humidity ?? 0),
    smoke: Number(data.smoke ?? 0),
    gas: Number(data.gas ?? 0),
    flame: Number(data.fire ?? 0),
    riskScore: assessment.score,
    riskFactors: assessment.factors,
    priority: assessment.priority,
    kind: assessment.kind,
    summary: assessment.summary,
    recordedAt: reading.recordedAt,
  });

  // ── Decide whether this warrants an alert ────────────────────────────────
  const state = deviceState.get(deviceCode) ?? {
    lastAlertAt: 0,
    lastKind: null,
    inAlarm: false,
  };

  const now = Date.now();
  const alarmWorthy = shouldAlert(assessment);

  // Rising edge, or the same alarm persisting past the dedupe window.
  const isRisingEdge = alarmWorthy && !state.inAlarm;
  const kindChanged = alarmWorthy && state.lastKind !== assessment.kind;
  const windowElapsed = now - state.lastAlertAt >= numeric.dedupeWindowMs;

  const createNew =
    alarmWorthy && (isRisingEdge || kindChanged || windowElapsed);

  deviceState.set(deviceCode, {
    lastAlertAt: createNew ? now : state.lastAlertAt,
    lastKind: alarmWorthy ? assessment.kind : null,
    inAlarm: alarmWorthy,
  });

  if (!createNew) {
    return {
      accepted: true,
      riskScore: assessment.score,
      factors: assessment.factors,
      alertCreated: false,
      reason: alarmWorthy ? "suppressed (duplicate)" : "below alert threshold",
    };
  }

  const alert = await createAlert({
    ...(data as ISensorData),
    deviceCode,
    assessment,
  });

  await Reading.updateOne(
    { _id: reading._id },
    { $set: { alertId: alert.id } },
  );

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
