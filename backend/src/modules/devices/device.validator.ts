import { z } from "zod";

const deviceStatusSchema = z.enum([
  "active",
  "inactive",
  "maintenance",
  "compromised",
]);

const dateish = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => !val || !Number.isNaN(Date.parse(val)),
    "Must be a valid date string",
  );

export const deviceSchema = z.object({
  deviceCode: z
    .string()
    .min(1, "Device code is required")
    .max(100, "Device code too long")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Device code may only contain letters, numbers, hyphens and underscores",
    ),

  buildingId: z.string().min(1, "Building ID is required"),
  stationId: z.string().min(1, "Station ID is required"),

  floor: z
    .number()
    .int("Floor must be an integer")
    .min(-10, "Floor too low")
    .max(500, "Floor too high"),

  room: z.string().max(50, "Room name too long").nullable().optional(),
  label: z.string().max(100, "Label too long").nullable().optional(),

  status: deviceStatusSchema.default("active"),

  firmwareVersion: z
    .string()
    .default("1.0.0")
    .refine(
      (val) => /^\d+(\.\d+){0,2}$/.test(val),
      "Firmware version must look like 1.0.0",
    ),

  lastSeenAt: dateish,
  lastHeartbeatAt: dateish,
  installedAt: dateish,

  temperature: z.number().default(0),
  humidity: z.number().min(0).max(100).default(0),
  smokeLevel: z.number().min(0).default(0),
  gasLevel: z.number().min(0).default(0),

  coordinates: z
    .tuple([
      z.number().min(-180).max(180), // longitude
      z.number().min(-90).max(90), // latitude
    ])
    .describe("[longitude, latitude]"),

  ipAddress: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) =>
        !val ||
        /^(?:\d{1,3}\.){3}\d{1,3}$/.test(val) ||
        /^[0-9a-fA-F:]+$/.test(val),
      "Invalid IP address",
    ),
});

export const getAllDevicesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v || "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(200, Math.max(1, parseInt(v || "20", 10) || 20))),
  search: z.string().max(100).optional(),
  stationId: z.string().max(64).optional(),
  status: deviceStatusSchema.optional(),
  buildingId: z.string().optional(),
  floor: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : undefined)),
  sortBy: z
    .enum(["lastSeenAt", "deviceCode", "createdAt", "floor", "status"])
    .optional()
    .default("lastSeenAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const readingsQuerySchema = z.object({
  stationId: z.string().max(64).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) =>
      Math.min(500, Math.max(1, parseInt(v || "60", 10) || 60)),
    ),
});

export const heartbeatSchema = z.object({
  deviceCode: z.string().min(1, "deviceCode is required").max(100),
});

/** Body accepted by POST /sensors/readings (HTTP ingest path). */
export const sensorReadingSchema = z.object({
  deviceCode: z.string().min(1, "deviceCode is required").max(100),
  temp: z.number().min(-100).max(1000).optional(),
  humidity: z.number().min(0).max(100).optional(),
  smoke: z.number().min(0).max(10000).optional(),
  gas: z.number().min(0).max(10000).optional(),
  gasType: z.string().max(50).optional(),
  fire: z.number().int().min(0).max(1).optional(),
  location: z.string().max(300).optional(),
  coordinates: z.string().max(60).optional(),
  building: z.string().max(100).optional(),
  sector: z.string().max(100).optional(),
  floor: z.number().int().optional(),
  room: z.string().max(50).optional(),
});

export const deviceScopeSchema = z.object({
  stationId: z.string().max(64).optional(),
});
