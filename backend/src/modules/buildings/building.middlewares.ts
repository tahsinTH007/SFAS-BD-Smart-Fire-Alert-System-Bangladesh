import type { NextFunction, Request, Response } from "express";
import { validate } from "../../lib/validation.js";
import { createRateLimit } from "../../config/globalRateLimit.js";
import { BuildingSchema } from "./building.validator.js";
import type { BuildingInput } from "./building.types.js";

export function validateBuilding(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // `validate` throws a ValidationError, which the global error handler renders
  // as a 422 with per-field details. The old hand-rolled catch returned
  // `err.errors` (always undefined on a ZodError) as the body.
  const validated = validate(BuildingSchema, req.body);
  (req as Request & { validatedBody: BuildingInput }).validatedBody = validated;
  next();
}

export const checkBuildingCreateRateLimit = createRateLimit({
  keyPrefix: "rl:building:create",
  points: 5,
  duration: 60,
  keyFn: (req) => {
    const body = (req as Request & { validatedBody?: BuildingInput })
      .validatedBody;
    return `building:${body?.name ?? req.ip ?? "unknown"}`;
  },
});
