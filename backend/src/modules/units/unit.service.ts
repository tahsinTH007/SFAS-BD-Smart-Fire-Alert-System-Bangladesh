import { Types } from "mongoose";
import { z } from "zod";
import { Unit } from "../../db/models/unit.model.js";
import { Dispatch } from "../../db/models/dispatch.model.js";
import { Alert } from "../../db/models/alert.models.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../lib/error.js";
import { computeRoute, rankByEta, type LatLng } from "../../lib/routing.js";
import { emitToAll, emitToRoom } from "../../config/socket.js";
import type { unitSchema, crewSchema } from "./unit.validator.js";

type UnitInput = z.infer<typeof unitSchema>;
type CrewInput = z.infer<typeof crewSchema>;

export const isValidId = (id: string) => Types.ObjectId.isValid(id);

function scope(stationId?: string) {
  return stationId && isValidId(stationId)
    ? { stationId: new Types.ObjectId(stationId) }
    : {};
}

/** Units that may be assigned right now. */
const ASSIGNABLE = ["available"];

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createUnit(input: UnitInput) {
  const existing = await Unit.findOne({
    unitCode: input.unitCode.toUpperCase(),
  }).lean();
  if (existing) {
    throw new ConflictError(`Unit code "${input.unitCode}" already exists`);
  }

  const doc = await Unit.create({
    ...input,
    unitCode: input.unitCode.toUpperCase(),
    stationId: new Types.ObjectId(input.stationId),
    location: { type: "Point", coordinates: input.coordinates },
  });

  return doc.toObject();
}

export async function getUnits(params: {
  stationId?: string;
  status?: string;
  type?: string;
  search?: string;
}) {
  const filter: Record<string, unknown> = { ...scope(params.stationId) };
  if (params.status) filter.status = params.status;
  if (params.type) filter.type = params.type;
  if (params.search) {
    const rx = new RegExp(
      params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [{ unitCode: rx }, { name: rx }, { "crew.name": rx }];
  }

  const units = await Unit.find(filter)
    .populate("currentAlertId", "title priority location incident status")
    .sort({ status: 1, unitCode: 1 })
    .lean({ virtuals: true });

  return units;
}

export async function getUnitById(id: string) {
  if (!isValidId(id)) throw new BadRequestError(`Malformed unit ID: ${id}`);
  const unit = await Unit.findById(id)
    .populate("currentAlertId", "title priority location incident status")
    .lean({ virtuals: true });
  if (!unit) throw new NotFoundError("Unit not found");
  return unit;
}

export async function updateUnit(id: string, updates: Partial<UnitInput>) {
  if (!isValidId(id)) throw new BadRequestError(`Malformed unit ID: ${id}`);

  const set: Record<string, unknown> = { ...updates };
  if (updates.coordinates) {
    set.location = { type: "Point", coordinates: updates.coordinates };
    delete set.coordinates;
  }
  if (updates.stationId) set.stationId = new Types.ObjectId(updates.stationId);

  const unit = await Unit.findByIdAndUpdate(id, { $set: set }, { new: true })
    .lean({ virtuals: true });
  if (!unit) throw new NotFoundError("Unit not found");

  emitToAll("unit:update", unit);
  return unit;
}

export async function deleteUnit(id: string) {
  if (!isValidId(id)) throw new BadRequestError(`Malformed unit ID: ${id}`);

  const live = await Dispatch.countDocuments({
    unitId: id,
    status: { $in: ["assigned", "en_route", "on_scene"] },
  });
  if (live > 0) {
    throw new BadRequestError(
      "Cannot delete a unit that is currently dispatched. Clear it first.",
    );
  }

  const deleted = await Unit.findByIdAndDelete(id).lean();
  if (!deleted) throw new NotFoundError("Unit not found");
  return deleted;
}

/** Manual status change — going off duty, into maintenance, back available. */
export async function setUnitStatus(id: string, status: string, note?: string) {
  if (!isValidId(id)) throw new BadRequestError(`Malformed unit ID: ${id}`);

  const unit = await Unit.findById(id);
  if (!unit) throw new NotFoundError("Unit not found");

  if (
    ["maintenance", "off_duty"].includes(status) &&
    unit.currentAlertId != null
  ) {
    throw new BadRequestError(
      "Unit is assigned to an incident. Clear the dispatch before taking it out of service.",
    );
  }

  unit.status = status as typeof unit.status;
  if (note !== undefined) unit.note = note;
  if (status === "available") {
    unit.currentAlertId = null;
    unit.dispatchedAt = null;
  }
  await unit.save();

  const plain = unit.toObject({ virtuals: true });
  emitToAll("unit:update", plain);
  return plain;
}

// ─── Crew ─────────────────────────────────────────────────────────────────────

export async function addCrew(unitId: string, member: CrewInput) {
  if (!isValidId(unitId)) throw new BadRequestError("Malformed unit ID");
  const unit = await Unit.findByIdAndUpdate(
    unitId,
    { $push: { crew: member } },
    { new: true },
  ).lean({ virtuals: true });
  if (!unit) throw new NotFoundError("Unit not found");
  emitToAll("unit:update", unit);
  return unit;
}

export async function updateCrew(
  unitId: string,
  crewId: string,
  updates: Partial<CrewInput>,
) {
  if (!isValidId(unitId) || !isValidId(crewId)) {
    throw new BadRequestError("Malformed ID");
  }

  const set = Object.fromEntries(
    Object.entries(updates).map(([k, v]) => [`crew.$.${k}`, v]),
  );

  const unit = await Unit.findOneAndUpdate(
    { _id: unitId, "crew._id": crewId },
    { $set: set },
    { new: true },
  ).lean({ virtuals: true });

  if (!unit) throw new NotFoundError("Unit or crew member not found");
  emitToAll("unit:update", unit);
  return unit;
}

export async function removeCrew(unitId: string, crewId: string) {
  if (!isValidId(unitId) || !isValidId(crewId)) {
    throw new BadRequestError("Malformed ID");
  }
  const unit = await Unit.findByIdAndUpdate(
    unitId,
    { $pull: { crew: { _id: new Types.ObjectId(crewId) } } },
    { new: true },
  ).lean({ virtuals: true });
  if (!unit) throw new NotFoundError("Unit not found");
  emitToAll("unit:update", unit);
  return unit;
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

/** Mongoose types nested paths as possibly-null, so accept that shape. */
function alertCoords(alert: {
  coordinates?: { lat?: number | null; lng?: number | null } | null;
}): LatLng | null {
  const lat = alert.coordinates?.lat;
  const lng = alert.coordinates?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

/**
 * Which units could go, ranked by how fast they'd get there.
 * Used to populate the officer's "recommended" list on the dispatch panel.
 */
export async function recommendUnits(alertId: string, stationId?: string) {
  if (!isValidId(alertId)) throw new BadRequestError("Malformed alert ID");

  const alert = await Alert.findById(alertId).lean();
  if (!alert) throw new NotFoundError("Alert not found");

  const destination = alertCoords(alert);

  const filter: Record<string, unknown> = {
    status: { $in: ASSIGNABLE },
    ...scope(stationId ?? String(alert.stationId ?? "")),
  };

  const units = (await Unit.find(filter).lean({ virtuals: true })) as unknown as (Record<string, unknown> & {
    type: string;
    location?: { coordinates: number[] } | null;
  })[];
  if (!destination) {
    return units.map((u) => ({ ...u, route: null, recommended: false }));
  }

  const ranked = await rankByEta(units, destination);

  /**
   * Recommend a sensible first alarm for the incident type: something that
   * puts water on it, something for people, and a ladder for height.
   */
  const wanted = new Set<string>(["engine"]);
  if (alert.priority === "critical") {
    wanted.add("medic");
    wanted.add("rescue");
  }
  if (Number(alert.floor ?? 0) >= 4) wanted.add("ladder");
  if (alert.type === "gas") wanted.add("foam");

  const picked = new Set<string>();
  return ranked.map((u) => {
    const key = u.type as string;
    const recommend = wanted.has(key) && !picked.has(key);
    if (recommend) picked.add(key);
    return { ...u, recommended: recommend };
  });
}

export async function dispatchUnits(
  alertId: string,
  unitIds: string[],
  operator: string,
) {
  if (!isValidId(alertId)) throw new BadRequestError("Malformed alert ID");

  const alert = await Alert.findById(alertId);
  if (!alert) throw new NotFoundError("Alert not found");
  if (alert.status === "resolved") {
    throw new BadRequestError("Cannot dispatch to a resolved incident");
  }

  const valid = unitIds.filter(isValidId);
  if (!valid.length) throw new BadRequestError("No valid unit IDs supplied");

  const units = await Unit.find({ _id: { $in: valid } });
  if (units.length !== valid.length) {
    throw new NotFoundError("One or more units were not found");
  }

  const busy = units.filter((u) => !ASSIGNABLE.includes(u.status));
  if (busy.length) {
    throw new ConflictError(
      `Not available: ${busy.map((u) => u.unitCode).join(", ")}`,
    );
  }

  const destination = alertCoords(alert);
  const created = [];

  for (const unit of units) {
    const coords = unit.location?.coordinates;
    const route =
      destination && coords?.length === 2
        ? await computeRoute(
            { lng: coords[0], lat: coords[1] },
            destination,
          )
        : null;

    const dispatch = await Dispatch.create({
      alertId: alert._id,
      unitId: unit._id,
      stationId: unit.stationId,
      status: "assigned",
      dispatchedBy: operator,
      distanceKm: route?.distanceKm ?? null,
      etaMinutes: route?.etaMinutes ?? null,
      routeSource: route?.source ?? "estimate",
      routeGeometry: route?.geometry ?? [],
    });

    unit.status = "dispatched";
    unit.currentAlertId = alert._id;
    unit.dispatchedAt = new Date();
    await unit.save();

    created.push(dispatch.toObject());
    emitToAll("unit:update", unit.toObject({ virtuals: true }));
  }

  // Dispatching is itself an acknowledgement of the incident.
  if (!alert.acknowledged) {
    alert.acknowledged = true;
    alert.read = true;
    alert.status = "acknowledged";
    alert.acknowledgedBy = operator;
    alert.acknowledgedAt = new Date();
    await alert.save();
  }

  const payload = { alertId: String(alert._id), dispatches: created };
  emitToAll("dispatch:new", payload);
  if (alert.stationId) {
    emitToRoom(`station:${alert.stationId}`, "dispatch:new", payload);
  }

  return created;
}

const NEXT_UNIT_STATUS: Record<string, string> = {
  en_route: "dispatched",
  on_scene: "on_scene",
  cleared: "available",
  cancelled: "available",
};

export async function updateDispatchStatus(
  dispatchId: string,
  status: string,
  note?: string,
) {
  if (!isValidId(dispatchId)) throw new BadRequestError("Malformed dispatch ID");

  const dispatch = await Dispatch.findById(dispatchId);
  if (!dispatch) throw new NotFoundError("Dispatch not found");

  dispatch.status = status as typeof dispatch.status;
  if (note !== undefined) dispatch.note = note;

  const now = new Date();
  if (status === "en_route" && !dispatch.enRouteAt) dispatch.enRouteAt = now;
  if (status === "on_scene" && !dispatch.arrivedAt) dispatch.arrivedAt = now;
  if (["cleared", "cancelled"].includes(status)) dispatch.clearedAt = now;

  await dispatch.save();

  const unitStatus = NEXT_UNIT_STATUS[status];
  if (unitStatus) {
    const unit = await Unit.findById(dispatch.unitId);
    if (unit) {
      unit.status = unitStatus as typeof unit.status;
      if (["cleared", "cancelled"].includes(status)) {
        unit.currentAlertId = null;
        unit.dispatchedAt = null;
      }
      await unit.save();
      emitToAll("unit:update", unit.toObject({ virtuals: true }));
    }
  }

  const plain = dispatch.toObject();
  emitToAll("dispatch:update", plain);
  return plain;
}

export async function getDispatchesForAlert(alertId: string) {
  if (!isValidId(alertId)) throw new BadRequestError("Malformed alert ID");
  return Dispatch.find({ alertId })
    .populate("unitId", "unitCode name type status crew location")
    .sort({ assignedAt: 1 })
    .lean();
}

export async function getActiveDispatches(stationId?: string) {
  return Dispatch.find({
    ...scope(stationId),
    status: { $in: ["assigned", "en_route", "on_scene"] },
  })
    .populate("unitId", "unitCode name type status")
    .populate("alertId", "title priority location incident coordinates")
    .sort({ assignedAt: -1 })
    .lean();
}

// ─── Readiness summary ────────────────────────────────────────────────────────

export async function getUnitStats(stationId?: string) {
  const match = scope(stationId);
  const pre = Object.keys(match).length ? [{ $match: match }] : [];

  const [byStatus, byType, crewTotals] = await Promise.all([
    Unit.aggregate([...pre, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Unit.aggregate([...pre, { $group: { _id: "$type", count: { $sum: 1 } } }]),
    Unit.aggregate([
      ...pre,
      { $unwind: { path: "$crew", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          total: { $sum: { $cond: [{ $ifNull: ["$crew._id", false] }, 1, 0] } },
          onDuty: {
            $sum: { $cond: [{ $eq: ["$crew.onDuty", true] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const pick = (rows: { _id: string; count: number }[], key: string) =>
    rows.find((r) => r._id === key)?.count ?? 0;

  const total = byStatus.reduce((n, r) => n + r.count, 0);
  const crew = crewTotals[0] ?? { total: 0, onDuty: 0 };

  return {
    total,
    available: pick(byStatus, "available"),
    dispatched: pick(byStatus, "dispatched"),
    onScene: pick(byStatus, "on_scene"),
    returning: pick(byStatus, "returning"),
    maintenance: pick(byStatus, "maintenance"),
    offDuty: pick(byStatus, "off_duty"),
    byType: Object.fromEntries(byType.map((r) => [r._id, r.count])),
    crew: { total: crew.total, onDuty: crew.onDuty },
  };
}
