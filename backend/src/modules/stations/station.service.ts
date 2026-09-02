import { Types } from "mongoose";
import { z } from "zod";
import { Station } from "../../db/models/station.model.js";
import { Building } from "../../db/models/building.model.js";
import { Device } from "../../db/models/device.model.js";
import { ConflictError, NotFoundError, BadRequestError } from "../../lib/error.js";
import type { listStationsQuerySchema, stationSchema } from "./station.validator.js";

type StationInput = z.infer<typeof stationSchema>;
type StationQuery = z.infer<typeof listStationsQuerySchema>;

export const isValidId = (id: string) => Types.ObjectId.isValid(id);

export async function createStation(input: StationInput) {
  const existing = await Station.findOne({
    stationCode: input.stationCode.toUpperCase(),
  }).lean();

  if (existing) {
    throw new ConflictError(`Station code "${input.stationCode}" already exists`);
  }

  const doc = await Station.create({
    ...input,
    location: { type: "Point", coordinates: input.coordinates },
  });

  return doc.toObject();
}

export async function getStations(q: StationQuery) {
  const filter: Record<string, unknown> = {};

  if (q.search) {
    const rx = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { stationCode: rx }, { district: rx }];
  }
  if (q.division) filter.division = q.division;
  if (q.status) filter.status = q.status;

  const [stations, total] = await Promise.all([
    Station.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    Station.countDocuments(filter),
  ]);

  const ids = stations.map((s) => s._id);
  const [buildingCounts, deviceCounts] = await Promise.all([
    Building.aggregate([
      { $match: { stationId: { $in: ids } } },
      { $group: { _id: "$stationId", count: { $sum: 1 } } },
    ]),
    Device.aggregate([
      { $match: { stationId: { $in: ids } } },
      { $group: { _id: "$stationId", count: { $sum: 1 } } },
    ]),
  ]);

  const bMap = new Map(buildingCounts.map((c) => [String(c._id), c.count]));
  const dMap = new Map(deviceCounts.map((c) => [String(c._id), c.count]));

  return {
    stations: stations.map((s) => ({
      ...s,
      buildingCount: bMap.get(String(s._id)) ?? 0,
      deviceCount: dMap.get(String(s._id)) ?? 0,
    })),
    total,
    page: q.page,
    limit: q.limit,
    pages: Math.ceil(total / q.limit) || 1,
  };
}

export async function getStationById(id: string) {
  if (!isValidId(id)) throw new BadRequestError(`Malformed station ID: ${id}`);
  const station = await Station.findById(id).lean();
  if (!station) throw new NotFoundError("Station not found");
  return station;
}

export async function updateStation(id: string, updates: Partial<StationInput>) {
  if (!isValidId(id)) throw new BadRequestError(`Malformed station ID: ${id}`);

  const set: Record<string, unknown> = { ...updates };
  if (updates.coordinates) {
    set.location = { type: "Point", coordinates: updates.coordinates };
    delete set.coordinates;
  }

  const station = await Station.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true },
  ).lean();

  if (!station) throw new NotFoundError("Station not found");
  return station;
}

export async function deleteStation(id: string) {
  if (!isValidId(id)) throw new BadRequestError(`Malformed station ID: ${id}`);

  const buildings = await Building.countDocuments({ stationId: id });
  if (buildings > 0) {
    throw new BadRequestError(
      `Cannot delete: ${buildings} building(s) are assigned to this station.`,
    );
  }

  const deleted = await Station.findByIdAndDelete(id).lean();
  if (!deleted) throw new NotFoundError("Station not found");
  return deleted;
}
