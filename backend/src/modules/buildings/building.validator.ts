import z from "zod";

export const BuildingSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),

  address: z.string().min(1, "Address is required").trim(),

  sector: z.string().trim().optional(),

  stationId: z.string().min(1, "Station ID is required"),

  structureType: z.string().trim().optional(),

  floors: z.number().int().min(1, "Floors must be at least 1").default(1),

  estimatedPeople: z
    .number()
    .int()
    .min(0, "Estimated people cannot be negative")
    .default(0),

  yearBuilt: z
    .number()
    .int()
    .min(1800, "Invalid year")
    .max(new Date().getFullYear(), "Year cannot be in future")
    .optional(),

  occupancyType: z.enum(["residential", "commercial"]).default("residential"),

  ownerName: z.string().trim().optional(),

  ownerContact: z.string().trim().optional(),

  coordinates: z
    .array(z.number())
    .length(2, "Coordinates must be [longitude, latitude]"),
});
