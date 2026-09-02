import type { NextFunction, Request, Response } from "express";
import { validate } from "../../lib/validation.js";
import { createRateLimit } from "../../config/globalRateLimit.js";
import { deviceSchema } from "./device.validator.js";
import type { DeviceInput } from "./device.types.js";

export function validateDevice(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const validated = validate(deviceSchema, req.body);
  (req as Request & { validatedBody: DeviceInput }).validatedBody = validated;
  next();
}

export const checkDeviceCreateRateLimit = createRateLimit({
  keyPrefix: "rl:device:create",
  points: 5,
  duration: 60,
  keyFn: (req) => {
    const body = (req as Request & { validatedBody?: DeviceInput })
      .validatedBody;
    return `device:${body?.deviceCode ?? req.ip ?? "unknown"}`;
  },
});

/** Devices push readings far more often than operators create them. */
export const checkIngestRateLimit = createRateLimit({
  keyPrefix: "rl:sensor:ingest",
  points: 120,
  duration: 60,
  keyFn: (req) => `ingest:${req.body?.deviceCode ?? req.ip ?? "unknown"}`,
});

export const checkHeartbeatRateLimit = createRateLimit({
  keyPrefix: "rl:device:heartbeat",
  points: 60,
  duration: 60,
  keyFn: (req) => `hb:${req.body?.deviceCode ?? req.ip ?? "unknown"}`,
});
