import { Request } from "express";
import * as BuildingService from "./building.service.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { BuildingInput } from "./building.types.js";

export const addNewBuilding = asyncHandler(async (req, res) => {
  const { validatedBody } = req as Request & {
    validatedBody: BuildingInput;
  };

  const newBuilding = await BuildingService.addNewBuilding(validatedBody);
});
