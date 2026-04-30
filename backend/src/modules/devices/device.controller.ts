import type { Request } from "express";

import { asyncHandler } from "../../lib/asyncHandler.js";
import { validate } from "../../lib/validation.js";
import { getAllDevicesQuerySchema } from "./device.validator.js";
import * as DeviceService from "./device.service.js";
import { DeviceInput } from "./device.types.js";

export const addNewDevice = asyncHandler(async (req, res) => {
  const { validatedBody } = req as Request & {
    validatedBody: DeviceInput;
  };

  const newDevice = await DeviceService.addNewDevice(validatedBody);

  res.status(201).json({
    success: true,
    data: newDevice,
  });
});

export const getAllDevices = asyncHandler(async (req, res) => {
  const validateData = validate(getAllDevicesQuerySchema, req.query);

  const { devices, total, page, limit } =
    await DeviceService.getAllDevices(validateData);

  res.status(200).json({
    success: true,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
    data: devices,
  });
});
