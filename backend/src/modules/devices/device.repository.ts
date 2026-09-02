import { Types } from "mongoose";
import { Device } from "../../db/models/device.model.js";
import { Reading } from "../../db/models/reading.model.js";
import type {
  DeviceDocument,
  DeviceInputRepo,
  GetAllDevicesQuery,
} from "./device.types.js";

export const isValidId = (id: string) => Types.ObjectId.isValid(id);

export async function repoFindByDeviceCode(
  deviceCode: string,
): Promise<DeviceDocument | null> {
  return Device.findOne({ deviceCode });
}

export async function repoFindById(id: string) {
  if (!isValidId(id)) return null;
  return Device.findById(id).populate("buildingId", "name address sector").lean();
}

export async function repoAddNewDevice(
  data: DeviceInputRepo,
): Promise<DeviceDocument> {
  return Device.create(data);
}

export async function repoUpdateDevice(
  id: string,
  updates: Record<string, unknown>,
) {
  if (!isValidId(id)) return null;
  return Device.findByIdAndUpdate(id, { $set: updates }, { new: true })
    .select("-apiKeyHash")
    .lean();
}

export async function repoDeleteDevice(id: string) {
  if (!isValidId(id)) return null;
  return Device.findByIdAndDelete(id).lean();
}

export async function repoGetAllDevices({
  query,
  page,
  limit,
  sortBy,
  sortOrder,
}: {
  query: Record<string, unknown>;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}): Promise<{ devices: unknown[]; total: number }> {
  const [devices, total] = await Promise.all([
    Device.find(query, { apiKeyHash: 0, __v: 0 })
      .populate("buildingId", "name address sector")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Device.countDocuments(query),
  ]);

  const staleAfterMs = 5 * 60_000;
  const now = Date.now();

  // Derive an online flag rather than trusting `status`, which is set manually.
  const withHealth = devices.map((d: any) => {
    const lastSeen = d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : 0;
    return {
      ...d,
      online: lastSeen > 0 && now - lastSeen < staleAfterMs,
      secondsSinceSeen: lastSeen ? Math.round((now - lastSeen) / 1000) : null,
    };
  });

  return { devices: withHealth, total };
}

export async function repoDeviceStats(stationId?: string) {
  const staleCutoff = new Date(Date.now() - 5 * 60_000);
  const match =
    stationId && isValidId(stationId)
      ? { stationId: new Types.ObjectId(stationId) }
      : {};
  const pre = Object.keys(match).length ? [{ $match: match }] : [];

  const [byStatus, totals, online] = await Promise.all([
    Device.aggregate([...pre, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Device.aggregate([
      ...pre,
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgRisk: { $avg: "$lastSensorData.riskScore" },
          maxTemp: { $max: "$lastSensorData.temperature" },
        },
      },
    ]),
    Device.countDocuments({ ...match, lastSeenAt: { $gte: staleCutoff } }),
  ]);

  const pick = (key: string) =>
    byStatus.find((r) => r._id === key)?.count ?? 0;

  const t = totals[0] ?? {};

  return {
    total: t.total ?? 0,
    online,
    offline: (t.total ?? 0) - online,
    avgRiskScore: Math.round(t.avgRisk ?? 0),
    maxTemperature: t.maxTemp ?? 0,
    byStatus: {
      active: pick("active"),
      inactive: pick("inactive"),
      maintenance: pick("maintenance"),
      compromised: pick("compromised"),
    },
  };
}

/** Recent telemetry for one device, oldest → newest, for the trend chart. */
export async function repoGetDeviceReadings(deviceCode: string, limit: number) {
  const rows = await Reading.find({ deviceCode })
    .sort({ recordedAt: -1 })
    .limit(limit)
    .lean();

  return rows.reverse().map((r) => ({
    temperature: r.temperature,
    humidity: r.humidity,
    smoke: r.smoke,
    gas: r.gas,
    flame: r.flame,
    riskScore: r.riskScore,
    riskFactors: r.riskFactors,
    recordedAt: r.recordedAt,
  }));
}

/** Latest reading per device — powers the live telemetry grid. */
export async function repoLatestReadings(stationId?: string) {
  const match =
    stationId && isValidId(stationId)
      ? { stationId: new Types.ObjectId(stationId) }
      : {};
  return Device.find(match, { apiKeyHash: 0, __v: 0 })
    .populate("buildingId", "name sector")
    .sort({ "lastSensorData.riskScore": -1 })
    .limit(100)
    .lean();
}

/**
 * Recent readings for every device in one aggregation.
 *
 * The dashboard needs a short history per unit to draw sparklines on first
 * paint. Fetching that per-device would be one request per card; this returns
 * them all at once, oldest → newest within each device.
 */
export async function repoRecentReadingsByDevice(
  perDevice: number,
  deviceCodes?: string[],
) {
  const rows = await Reading.aggregate([
    ...(deviceCodes?.length
      ? [{ $match: { deviceCode: { $in: deviceCodes } } }]
      : []),
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: "$deviceCode",
        readings: {
          $push: {
            temperature: "$temperature",
            humidity: "$humidity",
            smoke: "$smoke",
            gas: "$gas",
            flame: "$flame",
            riskScore: "$riskScore",
            recordedAt: "$recordedAt",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        deviceCode: "$_id",
        readings: {
          $reverseArray: { $slice: ["$readings", perDevice] },
        },
      },
    },
  ]);

  return rows as { deviceCode: string; readings: unknown[] }[];
}
