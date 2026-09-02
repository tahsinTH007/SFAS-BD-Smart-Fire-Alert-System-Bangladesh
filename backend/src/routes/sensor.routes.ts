import { Router } from "express";
import * as SensorController from "../modules/sensors/sensor.controller.js";
import { checkIngestRateLimit } from "../modules/devices/device.middlewares.js";

export const sensorsRouter = Router();

sensorsRouter.get("/serial-status", SensorController.serialStatus);

sensorsRouter.post("/readings", checkIngestRateLimit, SensorController.postReading);

sensorsRouter.post("/evaluate", SensorController.evaluateReading);
