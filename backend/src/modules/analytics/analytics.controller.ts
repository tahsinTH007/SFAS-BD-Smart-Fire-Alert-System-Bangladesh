import { z } from "zod";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validate } from "../../lib/validation.js";
import * as Analytics from "./analytics.service.js";

const querySchema = z.object({
  stationId: z.string().max(64).optional(),
  days: z
    .string()
    .optional()
    .transform((v) => Math.min(365, Math.max(1, parseInt(v || "30", 10) || 30))),
});

export const getSummary = asyncHandler(async (req, res) => {
  const { stationId, days } = validate(querySchema, req.query);
  res.json({ success: true, data: await Analytics.getSummary(stationId, days) });
});

export const getAreas = asyncHandler(async (req, res) => {
  const { stationId, days } = validate(querySchema, req.query);
  res.json({
    success: true,
    data: await Analytics.getAreaBreakdown(stationId, days),
  });
});

export const getCauses = asyncHandler(async (req, res) => {
  const { stationId, days } = validate(querySchema, req.query);
  res.json({
    success: true,
    data: await Analytics.getCauseBreakdown(stationId, days),
  });
});

export const getResponse = asyncHandler(async (req, res) => {
  const { stationId, days } = validate(querySchema, req.query);
  res.json({
    success: true,
    data: await Analytics.getResponseMetrics(stationId, days),
  });
});
