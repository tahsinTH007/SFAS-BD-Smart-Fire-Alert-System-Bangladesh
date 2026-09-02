import { Router } from "express";
import * as StationController from "../modules/stations/station.controller.js";

export const stationsRouter = Router();

stationsRouter.get("/", StationController.getAllStations);
stationsRouter.post("/", StationController.createStation);
stationsRouter.get("/:id", StationController.getSingleStation);
stationsRouter.patch("/:id", StationController.updateStation);
stationsRouter.delete("/:id", StationController.deleteStation);
