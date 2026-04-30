import { NextFunction, Request, Response } from "express";
import { validate } from "../../lib/validation.js";
import { BuildingSchema } from "./building.validator.js";
import { BuildingInput } from "./building.types.js";
import { buildingCreateLimiter } from "./building.rateLimit.js";

export function validateBuilding(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validated = validate(BuildingSchema, req.body);

    (req as Request & { validatedBody: BuildingInput }).validatedBody =
      validated;

    next();
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: "Invalid Request Body",
      error: err.errors,
    });
  }
}

export async function checkBuildingCreateRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { validatedBody } = req as Request & { validatedBody: BuildingInput };

  const buildingName = validatedBody.name;

  try {
    await buildingCreateLimiter.consume(
      `building:create:building:${buildingName}`,
    );

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
