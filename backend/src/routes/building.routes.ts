import { Router } from "express";
import * as BuildingController from "../modules/buildings/building.controller.js";
import {
  checkBuildingCreateRateLimit,
  validateBuilding,
} from "../modules/buildings/building.middlewares.js";

export const buildingsRouter = Router();

buildingsRouter.get("/stats", BuildingController.getBuildingStats);

buildingsRouter.get("/", BuildingController.getAllBuildings);

buildingsRouter.post(
  "/",
  validateBuilding,
  checkBuildingCreateRateLimit,
  BuildingController.addNewBuilding,
);

buildingsRouter.get("/:id", BuildingController.getSingleBuilding);
buildingsRouter.patch("/:id", BuildingController.updateBuilding);
buildingsRouter.delete("/:id", BuildingController.deleteBuilding);
