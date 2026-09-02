import { Types } from "mongoose";
import { Alert as AlertModel } from "../../db/models/alert.models.js";
import type { Alert as AlertDomain, AlertQuery } from "./alert.types.js";

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatTimestamp(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours === 1) return "1 hour ago";

  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (d.toDateString() === now.toDateString()) return `Today, ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${time}`;
  }

  const day = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  return `${day} — ${time}`;
}

function parseCoordinates(raw: unknown): [number, number] {
  if (!raw) return [0, 0];

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as { lat?: unknown; lng?: unknown };
    if (o.lat !== undefined) return [Number(o.lat) || 0, Number(o.lng) || 0];
  }

  if (typeof raw === "string") {
    const parts = raw.split(",").map(Number);
    if (parts.length === 2 && parts.every((n) => !Number.isNaN(n))) {
      return [parts[0], parts[1]];
    }
    return [0, 0];
  }

  if (Array.isArray(raw) && raw.length === 2) {
    return [Number(raw[0]) || 0, Number(raw[1]) || 0];
  }

  return [0, 0];
}

export function hydrateAlert(doc: any): AlertDomain {
  return {
    id: doc._id.toString(),
    type: doc.type,
    priority: doc.priority,
    title: doc.title,
    message: doc.message,
    location: doc.location ?? null,
    reportedBy: doc.reportedBy ?? null,
    contactNumber: doc.contactNumber ?? null,
    coordinates: parseCoordinates(doc.coordinates),
    timestamp: doc.timestamp ? formatTimestamp(doc.timestamp) : null,
    timestampISO: doc.timestamp ? new Date(doc.timestamp).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    read: Boolean(doc.read),
    acknowledged: Boolean(doc.acknowledged),
    smokeLevel: doc.smokeLevel ?? 0,
    gas: doc.gas ?? 0,
    gasType: doc.gasType ?? null,
    humidity: doc.humidity ?? null,
    flame: doc.flame ?? 0,
    riskScore: doc.riskScore ?? 0,
    riskFactors: doc.riskFactors ?? [],
    status: doc.status ?? "active",
    deviceId: doc.deviceId ?? null,
    sector: doc.sector ?? null,
    building: doc.building ?? null,
    floor: doc.floor ?? null,
    room: doc.room ?? null,
    incident: doc.incident ?? null,
    temperature: doc.temperature ?? null,
    affectedArea: doc.affectedArea ?? null,
    estimatedPeople: doc.estimatedPeople ?? null,
    acknowledgedBy: doc.acknowledgedBy ?? null,
    acknowledgedAt: doc.acknowledgedAt
      ? new Date(doc.acknowledgedAt).toISOString()
      : null,
    resolvedBy: doc.resolvedBy ?? null,
    resolvedAt: doc.resolvedAt ? new Date(doc.resolvedAt).toISOString() : null,
    resolutionNote: doc.resolutionNote ?? null,
    comments: (doc.comments ?? []).map((c: any) => ({
      author: c.author,
      body: c.body,
      createdAt: new Date(c.createdAt).toISOString(),
    })),
  };
}

function parseCoordStringToObject(raw: unknown): { lat: number; lng: number } {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const o = raw as { lat?: unknown; lng?: unknown };
    return { lat: Number(o.lat) || 0, lng: Number(o.lng) || 0 };
  }
  if (typeof raw === "string") {
    const parts = raw.split(",").map(Number);
    if (parts.length === 2 && parts.every((n) => !Number.isNaN(n))) {
      return { lat: parts[0], lng: parts[1] };
    }
  }
  return { lat: 0, lng: 0 };
}

export const isValidId = (id: string) => Types.ObjectId.isValid(id);

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function repoCreateAlert(params: any): Promise<AlertDomain> {
  const doc = await AlertModel.create({
    ...params,
    coordinates: parseCoordStringToObject(params.coordinates),
    floor: params.floor?.toString() ?? undefined,
    temperature: params.temperature?.toString() ?? undefined,
    estimatedPeople: params.estimatedPeople?.toString() ?? undefined,
    read: false,
    acknowledged: false,
    status: params.status ?? "active",
    timestamp: params.timestamp ?? new Date(),
  });

  return hydrateAlert(doc.toObject());
}

export async function repoUpdateAlert(
  id: string,
  update: Record<string, unknown>,
): Promise<AlertDomain | null> {
  const doc = await AlertModel.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true },
  ).lean();
  return doc ? hydrateAlert(doc) : null;
}

export async function repoAddComment(
  id: string,
  author: string,
  body: string,
): Promise<AlertDomain | null> {
  const doc = await AlertModel.findByIdAndUpdate(
    id,
    { $push: { comments: { author, body, createdAt: new Date() } } },
    { new: true },
  ).lean();
  return doc ? hydrateAlert(doc) : null;
}

export async function repoDeleteAlert(id: string): Promise<boolean> {
  const res = await AlertModel.findByIdAndDelete(id);
  return res !== null;
}

export async function repoBulkUpdate(
  ids: string[],
  update: Record<string, unknown>,
): Promise<number> {
  const valid = ids.filter(isValidId);
  if (!valid.length) return 0;
  const res = await AlertModel.updateMany(
    { _id: { $in: valid } },
    { $set: update },
  );
  return res.modifiedCount;
}

export async function repoBulkDelete(ids: string[]): Promise<number> {
  const valid = ids.filter(isValidId);
  if (!valid.length) return 0;
  const res = await AlertModel.deleteMany({ _id: { $in: valid } });
  return res.deletedCount ?? 0;
}

// ─── Reads ────────────────────────────────────────────────────────────────────

function buildFilter(q: AlertQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (q.priority && q.priority !== "all") filter.priority = q.priority;
  if (q.status && q.status !== "all") filter.status = q.status;
  if (q.type) filter.type = q.type;
  if (q.deviceId) filter.deviceId = q.deviceId;
  if (q.building) filter.building = q.building;
  if (q.sector) filter.sector = q.sector;
  if (typeof q.read === "boolean") filter.read = q.read;
  if (typeof q.acknowledged === "boolean") filter.acknowledged = q.acknowledged;

  if (q.from || q.to) {
    const range: Record<string, Date> = {};
    if (q.from) range.$gte = new Date(q.from);
    if (q.to) range.$lte = new Date(q.to);
    filter.timestamp = range;
  }

  if (q.search) {
    const rx = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { title: rx },
      { message: rx },
      { location: rx },
      { deviceId: rx },
      { incident: rx },
      { building: rx },
    ];
  }

  return filter;
}

export async function repoGetAlerts(q: AlertQuery): Promise<{
  alerts: AlertDomain[];
  total: number;
}> {
  const filter = buildFilter(q);
  const sortField = q.sortBy ?? "createdAt";
  const sortDir = q.sortOrder === "asc" ? 1 : -1;

  const [docs, total] = await Promise.all([
    AlertModel.find(filter)
      .sort({ [sortField]: sortDir })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    AlertModel.countDocuments(filter),
  ]);

  return { alerts: docs.map(hydrateAlert), total };
}

export async function repoGetAllAlerts(): Promise<AlertDomain[]> {
  const results = await AlertModel.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  return results.map(hydrateAlert);
}

export async function repoGetAlertById(
  id: string,
): Promise<AlertDomain | null> {
  if (!isValidId(id)) return null;
  const doc = await AlertModel.findById(id).lean();
  return doc ? hydrateAlert(doc) : null;
}

export async function repoGetAlertsByType(
  priority: string,
): Promise<AlertDomain[]> {
  const results = await AlertModel.find({ priority })
    .sort({ createdAt: -1 })
    .lean();
  return results.map(hydrateAlert);
}

/** Alerts near an alert, used for the "related incidents" panel. */
export async function repoGetRelated(
  id: string,
  limit = 5,
): Promise<AlertDomain[]> {
  if (!isValidId(id)) return [];
  const base = await AlertModel.findById(id).lean();
  if (!base) return [];

  const docs = await AlertModel.find({
    _id: { $ne: base._id },
    $or: [
      { building: base.building },
      { sector: base.sector },
      { deviceId: base.deviceId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.map(hydrateAlert);
}

// ─── Aggregations ─────────────────────────────────────────────────────────────

export async function repoGetStats() {
  const [byPriority, byStatus, totals, last24h] = await Promise.all([
    AlertModel.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
    AlertModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    AlertModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] } },
          unacknowledged: {
            $sum: { $cond: [{ $eq: ["$acknowledged", false] }, 1, 0] },
          },
          avgRisk: { $avg: "$riskScore" },
          maxRisk: { $max: "$riskScore" },
        },
      },
    ]),
    AlertModel.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 3600_000) },
    }),
  ]);

  const pick = (rows: { _id: string; count: number }[], key: string) =>
    rows.find((r) => r._id === key)?.count ?? 0;

  const t = totals[0] ?? {};

  return {
    total: t.total ?? 0,
    unread: t.unread ?? 0,
    unacknowledged: t.unacknowledged ?? 0,
    last24h,
    avgRiskScore: Math.round(t.avgRisk ?? 0),
    maxRiskScore: t.maxRisk ?? 0,
    byPriority: {
      critical: pick(byPriority, "critical"),
      important: pick(byPriority, "important"),
      info: pick(byPriority, "info"),
    },
    byStatus: {
      active: pick(byStatus, "active"),
      acknowledged: pick(byStatus, "acknowledged"),
      resolved: pick(byStatus, "resolved"),
    },
  };
}

/** Hourly or daily alert counts for the dashboard trend chart. */
export async function repoGetTimeseries(hours: number) {
  const since = new Date(Date.now() - hours * 3600_000);
  const bucketByDay = hours > 72;

  const rows = await AlertModel.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: {
          bucket: {
            $dateToString: {
              format: bucketByDay ? "%Y-%m-%d" : "%Y-%m-%dT%H:00",
              date: "$timestamp",
            },
          },
          priority: "$priority",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.bucket": 1 } },
  ]);

  const buckets = new Map<
    string,
    { bucket: string; critical: number; important: number; info: number }
  >();

  for (const r of rows) {
    const key = r._id.bucket as string;
    if (!buckets.has(key)) {
      buckets.set(key, { bucket: key, critical: 0, important: 0, info: 0 });
    }
    const entry = buckets.get(key)!;
    const p = r._id.priority as "critical" | "important" | "info";
    if (p in entry) entry[p] += r.count;
  }

  return Array.from(buckets.values());
}

/** Devices ranked by how many alerts they have produced. */
export async function repoGetTopDevices(limit = 5) {
  return AlertModel.aggregate([
    { $match: { deviceId: { $ne: null } } },
    {
      $group: {
        _id: "$deviceId",
        alerts: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
        avgRisk: { $avg: "$riskScore" },
        lastAt: { $max: "$timestamp" },
      },
    },
    { $sort: { alerts: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        deviceCode: "$_id",
        alerts: 1,
        critical: 1,
        avgRisk: { $round: ["$avgRisk", 0] },
        lastAt: 1,
      },
    },
  ]);
}
