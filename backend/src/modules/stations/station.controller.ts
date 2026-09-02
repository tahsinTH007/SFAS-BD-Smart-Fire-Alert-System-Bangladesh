import { asyncHandler } from "../../lib/asyncHandler.js";
import { validate, validatePartial } from "../../lib/validation.js";
import { BadRequestError } from "../../lib/error.js";
import * as StationService from "./station.service.js";
import {
  listStationsQuerySchema,
  stationSchema,
} from "./station.validator.js";

export const createStation = asyncHandler(async (req, res) => {
  const input = validate(stationSchema, req.body);
  const station = await StationService.createStation(input);
  res.status(201).json({ success: true, data: station });
});

export const getAllStations = asyncHandler(async (req, res) => {
  const query = validate(listStationsQuerySchema, req.query);
  const result = await StationService.getStations(query);

  res.json({
    success: true,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    },
    data: result.stations,
  });
});

export const getSingleStation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new BadRequestError("Station ID is required");
  const station = await StationService.getStationById(id);
  res.json({ success: true, data: station });
});

export const updateStation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new BadRequestError("Station ID is required");
  const updates = validatePartial(stationSchema, req.body ?? {});
  const station = await StationService.updateStation(id, updates);
  res.json({ success: true, data: station });
});

export const deleteStation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new BadRequestError("Station ID is required");
  await StationService.deleteStation(id);
  res.json({ success: true, message: "Station deleted" });
});
