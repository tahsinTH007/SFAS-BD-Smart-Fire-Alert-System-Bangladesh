import { Types } from "mongoose";
import { Building } from "../../db/models/building.model.js";
import { Device } from "../../db/models/device.model.js";
import type { BuildingInput, BuildingQuery } from "./building.types.js";

export const isValidId = (id: string) => Types.ObjectId.isValid(id);

export async function repoFindDuplicate(input: BuildingInput) {
  return Building.findOne({
    stationId: input.stationId,
    name: input.name,
    address: input.address,
  }).lean();
}

export async function repoCreateBuilding(input: BuildingInput) {
  const doc = await Building.create({
    name: input.name,
    address: input.address,
    sector: input.sector,
    stationId: new Types.ObjectId(input.stationId),
    structureType: input.structureType,
    floors: input.floors,
    estimatedPeople: input.estimatedPeople,
    yearBuilt: input.yearBuilt,
    occupancyType: input.occupancyType,
    ownerName: input.ownerName,
    ownerContact: input.ownerContact,
    location: {
      type: "Point",
      coordinates: input.coordinates, // [lng, lat]
    },
  });
  return doc.toObject();
}

export async function repoGetBuildings(q: BuildingQuery) {
  const filter: Record<string, unknown> = {};

  if (q.search) {
    const rx = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { address: rx }, { sector: rx }];
  }
  if (q.sector) filter.sector = q.sector;
  if (q.occupancyType) filter.occupancyType = q.occupancyType;
  if (q.stationId && isValidId(q.stationId)) {
    filter.stationId = new Types.ObjectId(q.stationId);
  }

  const [buildings, total] = await Promise.all([
    Building.find(filter)
      .sort({ [q.sortBy]: q.sortOrder === "asc" ? 1 : -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Building.countDocuments(filter),
  ]);

  // Attach a device count per building without an N+1 query.
  const ids = buildings.map((b) => b._id);
  const counts = await Device.aggregate([
    { $match: { buildingId: { $in: ids } } },
    { $group: { _id: "$buildingId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return {
    buildings: buildings.map((b) => ({
      ...b,
      deviceCount: countMap.get(String(b._id)) ?? 0,
    })),
    total,
  };
}

export async function repoGetBuildingById(id: string) {
  if (!isValidId(id)) return null;
  return Building.findById(id).populate("devices").lean();
}

export async function repoUpdateBuilding(
  id: string,
  updates: Partial<BuildingInput>,
) {
  if (!isValidId(id)) return null;

  const set: Record<string, unknown> = { ...updates };
  if (updates.coordinates) {
    set.location = { type: "Point", coordinates: updates.coordinates };
    delete set.coordinates;
  }
  if (updates.stationId) set.stationId = new Types.ObjectId(updates.stationId);

  return Building.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
}

export async function repoDeleteBuilding(id: string) {
  if (!isValidId(id)) return null;
  return Building.findByIdAndDelete(id).lean();
}

export async function repoCountDevicesIn(buildingId: string) {
  if (!isValidId(buildingId)) return 0;
  return Device.countDocuments({ buildingId: new Types.ObjectId(buildingId) });
}

export async function repoBuildingStats() {
  const rows = await Building.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalPeople: { $sum: "$estimatedPeople" },
        avgFloors: { $avg: "$floors" },
      },
    },
  ]);

  const byOccupancy = await Building.aggregate([
    { $group: { _id: "$occupancyType", count: { $sum: 1 } } },
  ]);

  const t = rows[0] ?? {};
  return {
    total: t.total ?? 0,
    totalPeople: t.totalPeople ?? 0,
    avgFloors: Math.round(t.avgFloors ?? 0),
    byOccupancy: Object.fromEntries(
      byOccupancy.map((r) => [r._id ?? "unknown", r.count]),
    ),
  };
}
