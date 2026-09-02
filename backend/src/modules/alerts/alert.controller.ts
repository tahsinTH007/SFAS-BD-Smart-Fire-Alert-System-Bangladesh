import { asyncHandler } from "../../lib/asyncHandler.js";
import { validate } from "../../lib/validation.js";
import { BadRequestError } from "../../lib/error.js";
import { isValidId } from "./alert.repository.js";
import * as AlertService from "./alert.service.js";
import {
  bulkIdsSchema,
  commentSchema,
  listAlertsQuerySchema,
  operatorSchema,
  resolveSchema,
  scopeQuerySchema,
  timeseriesQuerySchema,
  topDevicesQuerySchema,
} from "./alert.validator.js";

function requireId(id: string | undefined): string {
  if (!id) throw new BadRequestError("Alert ID is required");
  if (!isValidId(id)) throw new BadRequestError(`Malformed alert ID: ${id}`);
  return id;
}

export const getAllAlerts = asyncHandler(async (req, res) => {
  const query = validate(listAlertsQuerySchema, req.query);

  // Only a station scope (or nothing) → return the flat list the map and
  // notification views expect.
  const keys = Object.keys(req.query);
  const isPlainRequest =
    keys.length === 0 || (keys.length === 1 && keys[0] === "stationId");

  if (isPlainRequest) {
    const alerts = await AlertService.getAllAlerts(query.stationId);
    res.json({ success: true, data: alerts });
    return;
  }

  const result = await AlertService.getAlerts(query);
  res.json({
    success: true,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    },
    data: result.alerts,
  });
});

export const getSingleAlert = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const alert = await AlertService.getSingleAlert(id);
  res.json({ success: true, data: alert });
});

export const getAlertsByType = asyncHandler(async (req, res) => {
  const { priority } = req.params;
  if (!priority) throw new BadRequestError("priority is required");
  const { stationId } = validate(scopeQuerySchema, req.query);
  const alerts = await AlertService.getAlertsByType(priority, stationId);
  res.json({ success: true, data: alerts });
});

export const getRelatedAlerts = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const alerts = await AlertService.getRelatedAlerts(id);
  res.json({ success: true, data: alerts });
});

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getStats = asyncHandler(async (req, res) => {
  const { stationId } = validate(scopeQuerySchema, req.query);
  const stats = await AlertService.getStats(stationId);
  res.json({ success: true, data: stats });
});

export const getTimeseries = asyncHandler(async (req, res) => {
  const { hours, stationId } = validate(timeseriesQuerySchema, req.query);
  const series = await AlertService.getTimeseries(hours, stationId);
  res.json({ success: true, data: series });
});

export const getTopDevices = asyncHandler(async (req, res) => {
  const { limit, stationId } = validate(topDevicesQuerySchema, req.query);
  const devices = await AlertService.getTopDevices(limit, stationId);
  res.json({ success: true, data: devices });
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const markRead = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const read = req.body?.read !== false;
  const alert = await AlertService.markRead(id, read);
  res.json({ success: true, data: alert });
});

export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const { operator } = validate(operatorSchema, req.body ?? {});
  const alert = await AlertService.acknowledgeAlert(id, operator);
  res.json({ success: true, data: alert });
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const { operator, note } = validate(resolveSchema, req.body ?? {});
  const alert = await AlertService.resolveAlert(id, operator, note);
  res.json({ success: true, data: alert });
});

export const reopenAlert = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const alert = await AlertService.reopenAlert(id);
  res.json({ success: true, data: alert });
});

export const addComment = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  const { author, body } = validate(commentSchema, req.body ?? {});
  const alert = await AlertService.addComment(id, author, body);
  res.status(201).json({ success: true, data: alert });
});

export const deleteAlert = asyncHandler(async (req, res) => {
  const id = requireId(req.params.id);
  await AlertService.deleteAlert(id);
  res.json({ success: true, message: "Alert deleted" });
});

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export const bulkMarkRead = asyncHandler(async (req, res) => {
  const { ids, read } = validate(bulkIdsSchema, req.body ?? {});
  const modified = await AlertService.bulkMarkRead(ids, read ?? true);
  res.json({ success: true, modified });
});

export const bulkAcknowledge = asyncHandler(async (req, res) => {
  const { ids, operator } = validate(bulkIdsSchema, req.body ?? {});
  const modified = await AlertService.bulkAcknowledge(ids, operator);
  res.json({ success: true, modified });
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = validate(bulkIdsSchema, req.body ?? {});
  const deleted = await AlertService.bulkDelete(ids);
  res.json({ success: true, deleted });
});
