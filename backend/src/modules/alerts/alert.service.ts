import { emitToAll, emitToRoom } from "../../config/socket.js";
import { NotFoundError, BadRequestError } from "../../lib/error.js";
import { Device } from "../../db/models/device.model.js";
import { Building } from "../../db/models/building.model.js";
import type { RiskAssessment } from "../sensors/riskEngine.js";
import type { ISensorData } from "../sensors/sensor.types.js";
import {
  repoAddComment,
  repoBulkDelete,
  repoBulkUpdate,
  repoCreateAlert,
  repoDeleteAlert,
  repoGetAlertById,
  repoGetAlerts,
  repoGetAlertsByType,
  repoGetAllAlerts,
  repoGetRelated,
  repoGetStats,
  repoGetTimeseries,
  repoGetTopDevices,
  repoUpdateAlert,
} from "./alert.repository.js";
import type { AlertQuery, AlertResponse } from "./alert.types.js";

const TITLES: Record<string, string> = {
  fire: "🔥 Fire Detected",
  smoke: "💨 Smoke Detected",
  gas: "🛢️ Gas Leak Detected",
  heat: "🌡️ Abnormal Heat Detected",
  normal: "⚠️ Sensor Alert",
};

function makeIncidentId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `INC-${y}-${m}${d}-${seq}`;
}

/**
 * Resolves where a device physically is, so alerts carry real coordinates
 * instead of the random Uttara points the previous version generated.
 */
async function resolveDeviceContext(deviceCode: string) {
  const device = await Device.findOne({ deviceCode })
    .populate("buildingId")
    .lean();

  if (!device) return null;

  const building = device.buildingId as any;
  const coords = device.location?.coordinates ?? building?.location?.coordinates;

  return {
    // GeoJSON stores [lng, lat]; alerts store lat/lng.
    coordinates: coords ? `${coords[1]},${coords[0]}` : undefined,
    location: building
      ? `${building.name}${building.address ? `, ${building.address}` : ""}`
      : undefined,
    building: building?.name,
    sector: building?.sector,
    floor: device.floor,
    room: device.room ?? undefined,
    estimatedPeople: building?.estimatedPeople,
  };
}

export interface CreateAlertParams extends Partial<ISensorData> {
  deviceCode: string;
  assessment?: RiskAssessment;
}

export async function createAlert(
  params: CreateAlertParams,
): Promise<AlertResponse> {
  const a = params.assessment;

  const priority = a?.priority ?? "info";
  const kind = a?.kind ?? "normal";

  const context = await resolveDeviceContext(params.deviceCode);

  const readings = [
    `Temperature: ${params.temp ?? "—"}°C`,
    `Humidity: ${params.humidity ?? "—"}%`,
    `Smoke: ${params.smoke ?? "—"}`,
    `Gas: ${params.gas ?? "—"}`,
    `Flame: ${params.fire === 1 ? "DETECTED" : "none"}`,
  ].join("\n");

  const message = `${a?.summary ?? "Sensor threshold crossed."}\n\nDevice ${params.deviceCode} reported:\n${readings}`;

  const payload = {
    type: kind,
    priority,
    title: TITLES[kind] ?? TITLES.normal,
    message,

    location: params.location ?? context?.location ?? "Unknown location",
    coordinates: params.coordinates ?? context?.coordinates ?? "0,0",

    reportedBy: params.reportedBy ?? `OGNIBORMO unit ${params.deviceCode}`,
    contactNumber: params.contactNumber ?? null,
    affectedArea: params.affectedArea ?? context?.building ?? null,
    estimatedPeople: params.estimatedPeople ?? context?.estimatedPeople,

    incident: makeIncidentId(),

    temperature: params.temp,
    humidity: params.humidity ?? null,
    smokeLevel: params.smoke ?? 0,
    gas: params.gas ?? 0,
    gasType: params.gasType ?? null,
    flame: params.fire ?? 0,

    riskScore: a?.score ?? 0,
    riskFactors: a?.factors ?? [],

    deviceId: params.deviceCode,
    building: params.building ?? context?.building ?? null,
    sector: params.sector ?? context?.sector ?? null,
    floor: params.floor ?? context?.floor ?? null,
    room: params.room ?? context?.room ?? null,

    status: "active" as const,
    timestamp: new Date(),
  };

  const alert = await repoCreateAlert(payload);

  emitToAll("alert:new", alert);
  if (alert.building) {
    emitToRoom(`building:${alert.building}`, "alert:new", alert);
  }
  if (alert.deviceId) {
    emitToRoom(`device:${alert.deviceId}`, "alert:new", alert);
  }

  return alert;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAlerts(query: AlertQuery) {
  const { alerts, total } = await repoGetAlerts(query);
  return {
    alerts,
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.ceil(total / query.limit) || 1,
  };
}

export async function getAllAlerts(): Promise<AlertResponse[]> {
  return repoGetAllAlerts();
}

export async function getSingleAlert(id: string): Promise<AlertResponse> {
  const alert = await repoGetAlertById(id);
  if (!alert) throw new NotFoundError("Alert not found");
  return alert;
}

export async function getAlertsByType(
  priority: string,
): Promise<AlertResponse[]> {
  return repoGetAlertsByType(priority);
}

export async function getRelatedAlerts(id: string) {
  return repoGetRelated(id);
}

export async function getStats() {
  return repoGetStats();
}

export async function getTimeseries(hours: number) {
  return repoGetTimeseries(hours);
}

export async function getTopDevices(limit: number) {
  return repoGetTopDevices(limit);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

async function updateAndBroadcast(
  id: string,
  update: Record<string, unknown>,
): Promise<AlertResponse> {
  const alert = await repoUpdateAlert(id, update);
  if (!alert) throw new NotFoundError("Alert not found");
  emitToAll("alert:update", alert);
  return alert;
}

export async function markRead(id: string, read = true) {
  return updateAndBroadcast(id, { read });
}

export async function acknowledgeAlert(id: string, operator: string) {
  const existing = await repoGetAlertById(id);
  if (!existing) throw new NotFoundError("Alert not found");
  if (existing.status === "resolved") {
    throw new BadRequestError("Cannot acknowledge an already resolved alert");
  }

  return updateAndBroadcast(id, {
    acknowledged: true,
    read: true,
    status: "acknowledged",
    acknowledgedBy: operator,
    acknowledgedAt: new Date(),
  });
}

export async function resolveAlert(
  id: string,
  operator: string,
  note?: string,
) {
  const existing = await repoGetAlertById(id);
  if (!existing) throw new NotFoundError("Alert not found");

  return updateAndBroadcast(id, {
    acknowledged: true,
    read: true,
    status: "resolved",
    resolvedBy: operator,
    resolvedAt: new Date(),
    resolutionNote: note ?? null,
    ...(existing.acknowledgedAt
      ? {}
      : { acknowledgedBy: operator, acknowledgedAt: new Date() }),
  });
}

export async function reopenAlert(id: string) {
  return updateAndBroadcast(id, {
    status: "active",
    resolvedBy: null,
    resolvedAt: null,
    resolutionNote: null,
  });
}

export async function addComment(id: string, author: string, body: string) {
  const alert = await repoAddComment(id, author, body);
  if (!alert) throw new NotFoundError("Alert not found");
  emitToAll("alert:update", alert);
  return alert;
}

export async function deleteAlert(id: string): Promise<void> {
  const ok = await repoDeleteAlert(id);
  if (!ok) throw new NotFoundError("Alert not found");
  emitToAll("alert:delete", { id });
}

export async function bulkMarkRead(ids: string[], read = true) {
  const modified = await repoBulkUpdate(ids, { read });
  emitToAll("alert:bulk", { ids, action: read ? "read" : "unread" });
  return modified;
}

export async function bulkAcknowledge(ids: string[], operator: string) {
  const modified = await repoBulkUpdate(ids, {
    acknowledged: true,
    read: true,
    status: "acknowledged",
    acknowledgedBy: operator,
    acknowledgedAt: new Date(),
  });
  emitToAll("alert:bulk", { ids, action: "acknowledge" });
  return modified;
}

export async function bulkDelete(ids: string[]) {
  const deleted = await repoBulkDelete(ids);
  emitToAll("alert:bulk", { ids, action: "delete" });
  return deleted;
}
