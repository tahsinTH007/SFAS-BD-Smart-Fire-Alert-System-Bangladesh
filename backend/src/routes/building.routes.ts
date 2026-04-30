import { Router } from "express";
import * as BuildingController from "../modules/buildings/building.controller.js";
import {
  checkBuildingCreateRateLimit,
  validateBuilding,
} from "../modules/buildings/building.middlewares.js";

export const buildingsRouter = Router();

buildingsRouter.post(
  "/",
  validateBuilding,
  checkBuildingCreateRateLimit,
  BuildingController.addNewBuilding,
);
