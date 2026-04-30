import type { NextFunction, Request, Response } from "express";

import { deviceCreateLimiter } from "./device.rateLimit.js";
import { deviceSchema } from "./device.validator.js";
import { validate } from "../../lib/validation.js";
import { DeviceInput } from "./device.types.js";

export function validateDevice(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validated = validate(deviceSchema, req.body);

    (req as Request & { validatedBody: DeviceInput }).validatedBody = validated;
    next();
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body",
      error: err.errors,
    });
  }
}

export async function checkDeviceCreateRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { validatedBody } = req as Request & {
    validatedBody: DeviceInput;
  };

  // const operatorId = user.id;
  const deviceCode = validatedBody.deviceCode;

  try {
    // Operator-wide limit
    // await deviceCreateLimiter.consume(`device:create:operator:${operatorId}`);

    // Device-specific limit to prevent duplicate spam
    await deviceCreateLimiter.consume(`device:create:device:${deviceCode}`);

    next();
  } catch (rejRes: any) {
    if (rejRes instanceof Error) {
      return next(rejRes);
    }

    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set("Retry-After", String(secs));
    return res.status(429).json({
      message: "Too Many Requests",
      retryAfter: secs,
    });
  }
}
