import { Types } from "mongoose";
import { Alert } from "../../db/models/alert.models.js";
import { Dispatch } from "../../db/models/dispatch.model.js";

/**
 * Station-level reporting: where incidents cluster, what kind they are, what
 * is driving them, and how fast the station is responding.
 *
 * Everything here is scoped to one station, because that is the only view a
 * station officer needs — and the only one they are entitled to.
 */

function scope(stationId?: string) {
  return stationId && Types.ObjectId.isValid(stationId)
    ? { stationId: new Types.ObjectId(stationId) }
    : {};
}

function since(days: number) {
  return new Date(Date.now() - days * 24 * 3600_000);
}

/** Human explanation for each risk factor, used in the "causes" breakdown. */
const CAUSE_LABELS: Record<string, string> = {
  flame: "Open flame detected",
  smoke: "Smoke above threshold",
  gas: "Combustible gas leak",
  temperature: "Abnormal heat build-up",
  "temperature-humidity": "Hot, dry conditions",
};

export async function getAreaBreakdown(stationId?: string, days = 30) {
  const match = { ...scope(stationId), timestamp: { $gte: since(days) } };

  const rows = await Alert.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ["$sector", "Unrecorded"] },
        total: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
        important: {
          $sum: { $cond: [{ $eq: ["$priority", "important"] }, 1, 0] },
        },
        avgRisk: { $avg: "$riskScore" },
        buildings: { $addToSet: "$building" },
        lastAt: { $max: "$timestamp" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 20 },
    {
      $project: {
        _id: 0,
        area: "$_id",
        total: 1,
        critical: 1,
        important: 1,
        avgRisk: { $round: ["$avgRisk", 0] },
        buildingCount: { $size: "$buildings" },
        lastAt: 1,
      },
    },
  ]);

  return rows;
}

export async function getBuildingBreakdown(stationId?: string, days = 30) {
  return Alert.aggregate([
    { $match: { ...scope(stationId), timestamp: { $gte: since(days) } } },
    {
      $group: {
        _id: { $ifNull: ["$building", "Unrecorded"] },
        total: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
        avgRisk: { $avg: "$riskScore" },
        sector: { $first: "$sector" },
        lastAt: { $max: "$timestamp" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        building: "$_id",
        sector: 1,
        total: 1,
        critical: 1,
        avgRisk: { $round: ["$avgRisk", 0] },
        lastAt: 1,
      },
    },
  ]);
}

export async function getTypeBreakdown(stationId?: string, days = 30) {
  const rows = await Alert.aggregate([
    { $match: { ...scope(stationId), timestamp: { $gte: since(days) } } },
    {
      $group: {
        _id: "$type",
        total: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
        avgRisk: { $avg: "$riskScore" },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        type: "$_id",
        total: 1,
        critical: 1,
        avgRisk: { $round: ["$avgRisk", 0] },
      },
    },
  ]);

  return rows;
}

/**
 * What actually triggered the alerts — derived from the sensors that
 * contributed to each fused risk score.
 */
export async function getCauseBreakdown(stationId?: string, days = 30) {
  const rows = await Alert.aggregate([
    { $match: { ...scope(stationId), timestamp: { $gte: since(days) } } },
    { $unwind: "$riskFactors" },
    {
      $group: {
        _id: "$riskFactors",
        total: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return rows.map((r) => ({
    factor: r._id as string,
    label: CAUSE_LABELS[r._id as string] ?? (r._id as string),
    total: r.total as number,
    critical: r.critical as number,
  }));
}

/** Alerts by hour of day — shows when this station is busiest. */
export async function getHourlyPattern(stationId?: string, days = 30) {
  const rows = await Alert.aggregate([
    { $match: { ...scope(stationId), timestamp: { $gte: since(days) } } },
    {
      $group: {
        _id: { $hour: "$timestamp" },
        total: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
      },
    },
  ]);

  const byHour = new Map(rows.map((r) => [r._id as number, r]));

  // Always return all 24 buckets so the chart has a stable x-axis.
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    total: byHour.get(hour)?.total ?? 0,
    critical: byHour.get(hour)?.critical ?? 0,
  }));
}

/** Which units raise the most alerts, and how reliable they look. */
export async function getDeviceBreakdown(stationId?: string, days = 30) {
  return Alert.aggregate([
    {
      $match: {
        ...scope(stationId),
        timestamp: { $gte: since(days) },
        deviceId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$deviceId",
        total: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ["$priority", "critical"] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
        },
        avgRisk: { $avg: "$riskScore" },
        building: { $first: "$building" },
        lastAt: { $max: "$timestamp" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        deviceCode: "$_id",
        building: 1,
        total: 1,
        critical: 1,
        resolved: 1,
        avgRisk: { $round: ["$avgRisk", 0] },
        lastAt: 1,
      },
    },
  ]);
}

/**
 * Response performance: how long from alert to acknowledgement, to a unit
 * rolling, to arrival on scene, to the incident being closed.
 */
export async function getResponseMetrics(stationId?: string, days = 30) {
  const match = { ...scope(stationId), timestamp: { $gte: since(days) } };

  const [alertSide, dispatchSide] = await Promise.all([
    Alert.aggregate([
      { $match: { ...match, acknowledgedAt: { $ne: null } } },
      {
        $project: {
          ackMs: { $subtract: ["$acknowledgedAt", "$timestamp"] },
          resolveMs: {
            $cond: [
              { $ne: ["$resolvedAt", null] },
              { $subtract: ["$resolvedAt", "$timestamp"] },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgAckMs: { $avg: "$ackMs" },
          maxAckMs: { $max: "$ackMs" },
          avgResolveMs: { $avg: "$resolveMs" },
          resolvedCount: {
            $sum: { $cond: [{ $ne: ["$resolveMs", null] }, 1, 0] },
          },
        },
      },
    ]),

    Dispatch.aggregate([
      {
        $match: {
          ...scope(stationId),
          assignedAt: { $gte: since(days) },
          arrivedAt: { $ne: null },
        },
      },
      {
        $project: {
          travelMs: { $subtract: ["$arrivedAt", "$assignedAt"] },
          etaMinutes: 1,
          distanceKm: 1,
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avgTravelMs: { $avg: "$travelMs" },
          avgEtaMinutes: { $avg: "$etaMinutes" },
          avgDistanceKm: { $avg: "$distanceKm" },
        },
      },
    ]),
  ]);

  const a = alertSide[0];
  const d = dispatchSide[0];
  const toMin = (ms?: number | null) =>
    ms == null ? null : +(ms / 60_000).toFixed(1);

  return {
    acknowledged: a?.count ?? 0,
    avgAckMinutes: toMin(a?.avgAckMs),
    slowestAckMinutes: toMin(a?.maxAckMs),
    resolvedCount: a?.resolvedCount ?? 0,
    avgResolveMinutes: toMin(a?.avgResolveMs),

    dispatchesArrived: d?.count ?? 0,
    avgActualTravelMinutes: toMin(d?.avgTravelMs),
    avgEstimatedEtaMinutes: d?.avgEtaMinutes
      ? +d.avgEtaMinutes.toFixed(1)
      : null,
    avgDistanceKm: d?.avgDistanceKm ? +d.avgDistanceKm.toFixed(2) : null,
  };
}

/** Everything the summary tab needs, in one round trip. */
export async function getSummary(stationId?: string, days = 30) {
  const [areas, buildings, types, causes, hourly, devices, response] =
    await Promise.all([
      getAreaBreakdown(stationId, days),
      getBuildingBreakdown(stationId, days),
      getTypeBreakdown(stationId, days),
      getCauseBreakdown(stationId, days),
      getHourlyPattern(stationId, days),
      getDeviceBreakdown(stationId, days),
      getResponseMetrics(stationId, days),
    ]);

  return { days, areas, buildings, types, causes, hourly, devices, response };
}
