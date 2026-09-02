import { cacheGet, cacheSet, cacheInvalidate } from "../../config/redis.js";
import { ConflictError, NotFoundError } from "../../lib/error.js";
import { createCacheKey } from "../../utils/cache-key.js";
import {
  repoAddNewDevice,
  repoDeleteDevice,
  repoDeviceStats,
  repoFindByDeviceCode,
  repoFindById,
  repoGetAllDevices,
  repoGetDeviceReadings,
  repoLatestReadings,
  repoRecentReadingsByDevice,
  repoUpdateDevice,
} from "./device.repository.js";
import type {
  DeviceDocument,
  DeviceInput,
  GetAllDevicesQuery,
} from "./device.types.js";
import { prepareDeviceForDb } from "./device.util.js";

export async function addNewDevice(params: DeviceInput): Promise<{
  device: DeviceDocument;
  apiKey: string;
}> {
  const existing = await repoFindByDeviceCode(params.deviceCode);
  if (existing) {
    throw new ConflictError(`Device code "${params.deviceCode}" already exists`);
  }

  const { device, apiKey } = await prepareDeviceForDb(params);
  const created = await repoAddNewDevice(device);

  await cacheInvalidate("devices:*");

  // The plaintext key is returned exactly once, at creation. Only the bcrypt
  // hash is stored, so it can never be shown again.
  return { device: created, apiKey };
}

export async function getAllDevices(params: GetAllDevicesQuery) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    buildingId,
    floor,
    sortBy = "lastSeenAt",
    sortOrder = "desc",
  } = params;

  const cacheKey = createCacheKey("devices", {
    page,
    limit,
    search,
    status,
    buildingId,
    floor,
    sortBy,
    sortOrder,
  });

  const cached = await cacheGet(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      /* fall through to a fresh read */
    }
  }

  const query: Record<string, unknown> = {};
  if (search) query.deviceCode = { $regex: search, $options: "i" };
  if (status) query.status = status;
  if (buildingId) query.buildingId = buildingId;
  if (params.stationId) query.stationId = params.stationId;
  if (floor !== undefined) query.floor = Number(floor);

  const { devices, total } = await repoGetAllDevices({
    query,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const result = { devices, total, page, limit };

  // Short TTL: device liveness changes fast.
  await cacheSet(cacheKey, JSON.stringify(result), 15);

  return result;
}

export async function getDeviceById(id: string) {
  const device = await repoFindById(id);
  if (!device) throw new NotFoundError("Device not found");
  return device;
}

export async function updateDevice(
  id: string,
  updates: Partial<DeviceInput>,
) {
  const set: Record<string, unknown> = { ...updates };

  if (updates.coordinates) {
    set.location = { type: "Point", coordinates: updates.coordinates };
    delete set.coordinates;
  }

  const device = await repoUpdateDevice(id, set);
  if (!device) throw new NotFoundError("Device not found");

  await cacheInvalidate("devices:*");
  return device;
}

export async function deleteDevice(id: string) {
  const deleted = await repoDeleteDevice(id);
  if (!deleted) throw new NotFoundError("Device not found");
  await cacheInvalidate("devices:*");
  return deleted;
}

export async function getDeviceStats(stationId?: string) {
  return repoDeviceStats(stationId);
}

export async function getDeviceReadings(deviceCode: string, limit: number) {
  return repoGetDeviceReadings(deviceCode, limit);
}

export async function getLiveTelemetry(stationId?: string) {
  const devices = await repoLatestReadings(stationId);
  const staleAfter = 5 * 60_000;
  const now = Date.now();

  return devices.map((d: any) => {
    const lastSeen = d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : 0;
    return {
      id: String(d._id),
      deviceCode: d.deviceCode,
      label: d.label ?? null,
      building: d.buildingId?.name ?? null,
      sector: d.buildingId?.sector ?? null,
      floor: d.floor,
      room: d.room,
      status: d.status,
      online: lastSeen > 0 && now - lastSeen < staleAfter,
      lastSeenAt: d.lastSeenAt ?? null,
      readings: {
        temperature: d.lastSensorData?.temperature ?? 0,
        humidity: d.lastSensorData?.humidity ?? 0,
        smoke: d.lastSensorData?.smokeLevel ?? 0,
        gas: d.lastSensorData?.gasLevel ?? 0,
        flame: d.lastSensorData?.flame ?? 0,
        riskScore: d.lastSensorData?.riskScore ?? 0,
        readAt: d.lastSensorData?.readAt ?? null,
      },
    };
  });
}

/** Called by a device to say "I'm alive" without sending a full reading. */
export async function heartbeat(deviceCode: string, ipAddress?: string) {
  const device = await repoFindByDeviceCode(deviceCode);
  if (!device) throw new NotFoundError(`Unknown device: ${deviceCode}`);

  device.lastHeartbeatAt = new Date();
  device.lastSeenAt = new Date();
  if (ipAddress) device.ipAddress = ipAddress;
  await device.save();

  await cacheInvalidate("devices:*");
  return { deviceCode, acknowledgedAt: new Date().toISOString() };
}

/** Short per-device history so the dashboard can draw sparklines immediately. */
export async function getRecentReadingsByDevice(
  perDevice: number,
  stationId?: string,
) {
  // Only pull history for units this station actually owns.
  const codes = stationId
    ? (await repoLatestReadings(stationId)).map((d: any) => d.deviceCode)
    : undefined;
  const rows = await repoRecentReadingsByDevice(perDevice, codes);
  return Object.fromEntries(rows.map((r) => [r.deviceCode, r.readings]));
}
