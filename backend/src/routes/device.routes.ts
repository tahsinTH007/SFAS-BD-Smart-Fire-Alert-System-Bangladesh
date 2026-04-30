import { Router } from "express";
import * as DeviceController from "../modules/devices/device.controller.js";
import {
  checkDeviceCreateRateLimit,
  validateDevice,
} from "../modules/devices/device.middlewares.js";

export const devicesRouter = Router();

devicesRouter.post(
  "/",
  validateDevice,
  checkDeviceCreateRateLimit,
  DeviceController.addNewDevice,
);

devicesRouter.get("/", DeviceController.getAllDevices);
