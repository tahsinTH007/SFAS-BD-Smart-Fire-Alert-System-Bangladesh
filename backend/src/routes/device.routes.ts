import { Router } from "express";
import * as DeviceController from "../modules/devices/device.controller.js";
import {
  checkDeviceCreateRateLimit,
  checkHeartbeatRateLimit,
  validateDevice,
} from "../modules/devices/device.middlewares.js";

export const devicesRouter = Router();

devicesRouter.get("/stats", DeviceController.getDeviceStats);
devicesRouter.get("/telemetry", DeviceController.getLiveTelemetry);
devicesRouter.get("/readings", DeviceController.getRecentReadings);

devicesRouter.post("/heartbeat", checkHeartbeatRateLimit, DeviceController.heartbeat);

devicesRouter.get("/", DeviceController.getAllDevices);

devicesRouter.post(
  "/",
  validateDevice,
  checkDeviceCreateRateLimit,
  DeviceController.addNewDevice,
);

devicesRouter.get("/:deviceCode/readings", DeviceController.getDeviceReadings);

devicesRouter.get("/:id", DeviceController.getSingleDevice);
devicesRouter.patch("/:id", DeviceController.updateDevice);
devicesRouter.delete("/:id", DeviceController.deleteDevice);
