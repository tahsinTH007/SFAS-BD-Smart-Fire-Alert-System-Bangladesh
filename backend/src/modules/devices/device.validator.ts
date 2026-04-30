import { z } from "zod";

const deviceStatusSchema = z.enum([
  "active",
  "inactive",
  "maintenance",
  "compromised",
]);

export const deviceSchema = z.object({
  deviceCode: z
    .string()
    .min(1, "Device code is required")
    .max(100, "Device code too long"),

  buildingId: z.string().min(1, "Building ID is required"),

  stationId: z.string().min(1, "Station ID is required"),

  floor: z
    .number()
    .int("Floor must be an integer")
    .min(-10, "Floor too low")
    .max(500, "Floor too high"),

  room: z.string().max(50, "Room name too long").nullable().optional(),

  status: deviceStatusSchema.default("active"),

  firmwareVersion: z
    .string()
    .default("1.0.0")
    .refine(
      (val) => /^(\d+\.)?(\d+\.)?(\*|\d+)$/.test(val),
      "Firmware version must be in the format x.x.x",
    ),

  lastSeenAt: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "lastSeenAt must be a valid date string",
    ),

  lastHeartbeatAt: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "lastHeartbeatAt must be a valid date string",
    ),

  temperature: z.number().default(0),
  smokeLevel: z.number().default(0),
  gasLevel: z.number().default(0),

  coordinates: z
    .array(z.number())
    .length(2, "Coordinates must be [longitude, latitude]"),

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

  installedAt: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      "installedAt must be a valid date string",
    ),
});

export const getAllDevicesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "10")),
  search: z.string().optional(),
  status: z
    .enum(["active", "inactive", "maintenance", "compromised"])
    .optional(),
  buildingId: z.string().optional(),
  floor: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  sortBy: z.string().optional().default("lastSeenAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
