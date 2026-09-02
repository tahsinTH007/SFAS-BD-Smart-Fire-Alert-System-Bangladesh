import type { Request } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validate, validatePartial } from "../../lib/validation.js";
import { BadRequestError } from "../../lib/error.js";
import * as BuildingService from "./building.service.js";
import { isValidId } from "./building.repository.js";
import {
  BuildingSchema,
  listBuildingsQuerySchema,
} from "./building.validator.js";
import type { BuildingInput } from "./building.types.js";

function requireId(id: string | undefined): string {
  if (!id) throw new BadRequestError("Building ID is required");
  if (!isValidId(id)) throw new BadRequestError(`Malformed building ID: ${id}`);
  return id;
}

export const addNewBuilding = asyncHandler(async (req, res) => {
  const { validatedBody } = req as Request & { validatedBody: BuildingInput };

  const building = await BuildingService.addNewBuilding(validatedBody);

  res.status(201).json({ success: true, data: building });
});

export const getAllBuildings = asyncHandler(async (req, res) => {
  const query = validate(listBuildingsQuerySchema, req.query);
  const result = await BuildingService.getBuildings(query);

  res.json({
    success: true,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    },
    data: result.buildings,
  });
});

export const getBuildingStats = asyncHandler(async (req, res) => {
  const stationId =
    typeof req.query.stationId === "string" ? req.query.stationId : undefined;
  const stats = await BuildingService.getBuildingStats(stationId);
  res.json({ success: true, data: stats });
});

export const getSingleBuilding = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const building = await BuildingService.getBuildingById(id);
  res.json({ success: true, data: building });
});

export const updateBuilding = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const updates = validatePartial(BuildingSchema, req.body ?? {});
  const building = await BuildingService.updateBuilding(id, updates);
  res.json({ success: true, data: building });
});

export const deleteBuilding = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  await BuildingService.deleteBuilding(id);
  res.json({ success: true, message: "Building deleted" });
});
