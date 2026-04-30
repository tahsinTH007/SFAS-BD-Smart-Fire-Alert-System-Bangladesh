import { z } from "zod";
import { Types } from "mongoose";

// Custom validator for MongoDB ObjectId
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid MongoDB ObjectId format",
});

// Priority enum with description
const alertPrioritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "important",
  "info",
]);

// Status enum
const alertStatusSchema = z.enum(["active", "acknowledged", "resolved"]);

// Temperature validator (optional but if present must be reasonable)
const temperatureSchema = z
  .number()
  .min(-100, "Temperature too low")
  .max(200, "Temperature too high")
  .optional();

// Smoke level validator (0-100% or ppm)
const smokeLevelSchema = z
  .number()
  .min(0, "Smoke level cannot be negative")
  .max(10000, "Smoke level too high")
  .optional();

// Phone number validator (optional)
const phoneNumberSchema = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
    "Invalid phone number format",
  )
  .optional();

// Enhanced Alert Schema
export const alertSchema = z
  .object({
    type: z
      .string()
      .min(1, "Type is required")
      .max(100, "Type too long (max 100 characters)"),

    priority: alertPrioritySchema,

    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title too long (max 200 characters)"),

    message: z
      .string()
      .min(1, "Message is required")
      .max(2000, "Message too long (max 2000 characters)"),

    deviceId: z.string().max(100, "Device ID too long").optional(),

    sector: z.string().max(100, "Sector name too long").optional(),

    building: z.string().max(100, "Building name too long").optional(),

    floor: z
      .number()
      .int("Floor must be an integer")
      .min(-10, "Invalid floor number")
      .max(200, "Invalid floor number")
      .optional(),

    room: z.string().max(50, "Room identifier too long").optional(),

    location: z.string().max(500, "Location description too long").optional(),

    temperature: temperatureSchema,

    smokeLevel: smokeLevelSchema,

    reportedBy: z.string().max(100, "Reporter name too long").optional(),

    contactNumber: phoneNumberSchema,

    status: alertStatusSchema.default("active"),

    acknowledgedBy: objectIdSchema.optional(),

    acknowledgedAt: z
      .date()
      .max(new Date(), "Acknowledgment date cannot be in the future")
      .optional(),

    resolvedBy: objectIdSchema.optional(),

    resolvedAt: z
      .date()
      .max(new Date(), "Resolution date cannot be in the future")
      .optional(),

    read: z.boolean().default(false),

    acknowledged: z.boolean().default(false),

    incident: objectIdSchema.optional(),

    timestamp: z
      .date()
      .max(new Date(), "Timestamp cannot be in the future")
      .default(() => new Date()),
  })
  .refine(
    (data) => {
      // If acknowledged is true, acknowledgedBy and acknowledgedAt should be present
      if (data.acknowledged && (!data.acknowledgedBy || !data.acknowledgedAt)) {
        return false;
      }
      return true;
    },
    {
      message:
        "Acknowledged alerts must have acknowledgedBy and acknowledgedAt",
      path: ["acknowledged"],
    },
  )
  .refine(
    (data) => {
      // If status is resolved, resolvedBy and resolvedAt should be present
      if (
        data.status === "resolved" &&
        (!data.resolvedBy || !data.resolvedAt)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Resolved alerts must have resolvedBy and resolvedAt",
      path: ["status"],
    },
  );

export function validateAlert(data: unknown) {
  try {
    return alertSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
    }
    throw error;
  }
}

export function validatePartialAlert(data: unknown) {
  try {
    return alertSchema.partial().parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`);
    }
    throw error;
  }
}
