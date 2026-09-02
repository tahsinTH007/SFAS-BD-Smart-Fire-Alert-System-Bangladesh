import { z } from "zod";

const boolish = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === "true"));

export const listAlertsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v || "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(200, Math.max(1, parseInt(v || "50", 10) || 50))),

  priority: z.enum(["critical", "important", "info", "all"]).optional(),
  status: z.enum(["active", "acknowledged", "resolved", "all"]).optional(),
  type: z.string().max(50).optional(),
  deviceId: z.string().max(100).optional(),
  building: z.string().max(100).optional(),
  sector: z.string().max(100).optional(),

  read: boolish,
  acknowledged: boolish,

  search: z.string().max(200).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),

  sortBy: z
    .enum(["createdAt", "timestamp", "priority", "riskScore"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const operatorSchema = z.object({
  operator: z.string().min(1).max(100).optional().default("Operator"),
});

export const resolveSchema = z.object({
  operator: z.string().min(1).max(100).optional().default("Operator"),
  note: z.string().max(2000).optional(),
});

export const commentSchema = z.object({
  author: z.string().min(1).max(100).optional().default("Operator"),
  body: z.string().min(1, "Comment cannot be empty").max(2000),
});

export const bulkIdsSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, "At least one id is required")
    .max(500, "Too many ids in one request"),
  operator: z.string().max(100).optional().default("Operator"),
  read: z.boolean().optional(),
});

export const timeseriesQuerySchema = z.object({
  hours: z
    .string()
    .optional()
    .transform((v) => Math.min(720, Math.max(1, parseInt(v || "24", 10) || 24))),
});

export const topDevicesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(50, Math.max(1, parseInt(v || "5", 10) || 5))),
});
