import { Router } from "express";
import * as UnitController from "../modules/units/unit.controller.js";

export const unitsRouter = Router();

unitsRouter.get("/stats", UnitController.getUnitStats);
unitsRouter.get("/dispatches/active", UnitController.getActiveDispatches);
unitsRouter.patch(
  "/dispatches/:dispatchId/status",
  UnitController.updateDispatchStatus,
);

unitsRouter.get("/", UnitController.listUnits);
unitsRouter.post("/", UnitController.createUnit);

unitsRouter.get("/:id", UnitController.getSingleUnit);
unitsRouter.patch("/:id", UnitController.updateUnit);
unitsRouter.delete("/:id", UnitController.deleteUnit);
unitsRouter.patch("/:id/status", UnitController.setUnitStatus);

unitsRouter.post("/:id/crew", UnitController.addCrew);
unitsRouter.patch("/:id/crew/:crewId", UnitController.updateCrew);
unitsRouter.delete("/:id/crew/:crewId", UnitController.removeCrew);
