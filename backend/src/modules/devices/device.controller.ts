import type { Request } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validate, validatePartial } from "../../lib/validation.js";
import { BadRequestError } from "../../lib/error.js";
import { isValidId } from "./device.repository.js";
import * as DeviceService from "./device.service.js";
import {
  deviceSchema,
  getAllDevicesQuerySchema,
  heartbeatSchema,
  readingsQuerySchema,
} from "./device.validator.js";
import type { DeviceInput } from "./device.types.js";

function requireId(id: string | undefined): string {
  if (!id) throw new BadRequestError("Device ID is required");
  if (!isValidId(id)) throw new BadRequestError(`Malformed device ID: ${id}`);
  return id;
}

export const addNewDevice = asyncHandler(async (req, res) => {
  const { validatedBody } = req as Request & { validatedBody: DeviceInput };

  const { device, apiKey } = await DeviceService.addNewDevice(validatedBody);

  res.status(201).json({
    success: true,
    data: device,
    // Shown once; only the bcrypt hash is persisted.
    apiKey,
    notice: "Store this API key now — it cannot be retrieved again.",
  });
});

export const getAllDevices = asyncHandler(async (req, res) => {
  const query = validate(getAllDevicesQuerySchema, req.query);

  const { devices, total, page, limit } =
    await DeviceService.getAllDevices(query);

  res.json({
    success: true,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
    data: devices,
  });
});

export const getDeviceStats = asyncHandler(async (_req, res) => {
  const stats = await DeviceService.getDeviceStats();
  res.json({ success: true, data: stats });
});

export const getLiveTelemetry = asyncHandler(async (_req, res) => {
  const telemetry = await DeviceService.getLiveTelemetry();
  res.json({ success: true, data: telemetry });
});

export const getSingleDevice = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const device = await DeviceService.getDeviceById(id);
  res.json({ success: true, data: device });
});

export const getDeviceReadings = asyncHandler(async (req, res) => {
  const { deviceCode } = req.params;
  if (!deviceCode) throw new BadRequestError("deviceCode is required");
  const { limit } = validate(readingsQuerySchema, req.query);
  const readings = await DeviceService.getDeviceReadings(deviceCode, limit);
  res.json({ success: true, data: readings });
});

export const updateDevice = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const updates = validatePartial(deviceSchema, req.body ?? {});
  const device = await DeviceService.updateDevice(id, updates);
  res.json({ success: true, data: device });
});

export const deleteDevice = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  await DeviceService.deleteDevice(id);
  res.json({ success: true, message: "Device deleted" });
});

export const heartbeat = asyncHandler(async (req, res) => {
  const { deviceCode } = validate(heartbeatSchema, req.body ?? {});
  const result = await DeviceService.heartbeat(deviceCode, req.ip);
  res.json({ success: true, data: result });
});
