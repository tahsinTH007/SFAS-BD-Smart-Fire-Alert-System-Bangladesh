import { z } from "zod";
import { UNIT_STATUSES, UNIT_TYPES } from "../../db/models/unit.model.js";
import { DISPATCH_STATUSES } from "../../db/models/dispatch.model.js";

export const crewSchema = z.object({
  name: z.string().min(1, "Name is required").max(120).trim(),
  rank: z.string().max(80).trim().default("Firefighter"),
  role: z
    .enum(["officer", "driver", "firefighter", "paramedic", "technician", "rescuer"])
    .default("firefighter"),
  phone: z.string().max(40).trim().nullable().optional(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .nullable()
    .optional(),
  certifications: z.array(z.string().max(80)).max(20).default([]),
  yearsOfService: z.number().int().min(0).max(60).default(0),
  onDuty: z.boolean().default(true),
});

export const unitSchema = z.object({
  unitCode: z
    .string()
    .min(1, "Unit code is required")
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, hyphens and underscores only"),

  name: z.string().min(1, "Name is required").max(120).trim(),

  type: z.enum(UNIT_TYPES),

  stationId: z.string().min(1, "Station is required"),

  status: z.enum(UNIT_STATUSES).default("available"),

  crew: z.array(crewSchema).max(20).default([]),

  registration: z.string().max(40).trim().nullable().optional(),
  waterCapacityL: z.number().min(0).max(50000).default(0),
  ladderReachM: z.number().min(0).max(120).default(0),

  note: z.string().max(300).trim().nullable().optional(),

  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .describe("[longitude, latitude]"),
});

export const listUnitsQuerySchema = z.object({
  stationId: z.string().max(64).optional(),
  status: z.enum(UNIT_STATUSES).optional(),
  type: z.enum(UNIT_TYPES).optional(),
  search: z.string().max(120).optional(),
});

export const unitStatusSchema = z.object({
  status: z.enum(UNIT_STATUSES),
  note: z.string().max(300).optional(),
});

export const dispatchSchema = z.object({
  unitIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one unit")
    .max(12, "Too many units in one dispatch"),
  operator: z.string().max(100).optional().default("Operator"),
});

export const dispatchStatusSchema = z.object({
  status: z.enum(DISPATCH_STATUSES),
  note: z.string().max(300).optional(),
});

export const scopeSchema = z.object({
  stationId: z.string().max(64).optional(),
});
