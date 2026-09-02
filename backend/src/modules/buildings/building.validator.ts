import { z } from "zod";

export const BuildingSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).trim(),

  address: z.string().min(1, "Address is required").max(300).trim(),

  sector: z.string().max(100).trim().optional(),

  stationId: z.string().min(1, "Station ID is required"),

  structureType: z.string().max(100).trim().optional(),

  floors: z.number().int().min(1, "Floors must be at least 1").max(200).default(1),

  estimatedPeople: z
    .number()
    .int()
    .min(0, "Estimated people cannot be negative")
    .max(1_000_000)
    .default(0),

  yearBuilt: z
    .number()
    .int()
    .min(1800, "Invalid year")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),

  occupancyType: z.enum(["residential", "commercial"]).default("residential"),

  ownerName: z.string().max(150).trim().optional(),

  ownerContact: z.string().max(50).trim().optional(),

  coordinates: z
    .tuple([
      z.number().min(-180).max(180), // longitude
      z.number().min(-90).max(90), // latitude
    ])
    .describe("[longitude, latitude]"),
});

export const listBuildingsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v || "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(200, Math.max(1, parseInt(v || "50", 10) || 50))),
  search: z.string().max(200).optional(),
  sector: z.string().max(100).optional(),
  occupancyType: z.enum(["residential", "commercial"]).optional(),
  stationId: z.string().optional(),
  sortBy: z
    .enum(["name", "createdAt", "floors", "estimatedPeople"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
