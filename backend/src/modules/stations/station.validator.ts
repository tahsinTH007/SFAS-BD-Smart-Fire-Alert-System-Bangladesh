import { z } from "zod";

export const stationSchema = z.object({
  stationCode: z
    .string()
    .min(1, "Station code is required")
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, hyphens and underscores only"),

  name: z.string().min(1, "Name is required").max(150).trim(),

  district: z.string().max(100).trim().optional(),

  division: z
    .enum([
      "Dhaka",
      "Chattogram",
      "Rajshahi",
      "Khulna",
      "Barishal",
      "Sylhet",
      "Rangpur",
      "Mymensingh",
    ])
    .optional(),

  address: z.string().max(300).trim().optional(),
  contactNumber: z.string().max(50).trim().optional(),
  email: z.string().email("Invalid email").max(150).optional(),
  commanderName: z.string().max(150).trim().optional(),

  status: z.enum(["operational", "limited", "offline"]).default("operational"),

  coordinates: z
    .tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
    .describe("[longitude, latitude]"),
});

export const listStationsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v || "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(200, Math.max(1, parseInt(v || "50", 10) || 50))),
  search: z.string().max(150).optional(),
  division: z.string().max(50).optional(),
  status: z.enum(["operational", "limited", "offline"]).optional(),
});
