import { asyncHandler } from "../../lib/asyncHandler.js";
import { validate, validatePartial } from "../../lib/validation.js";
import { BadRequestError } from "../../lib/error.js";
import * as UnitService from "./unit.service.js";
import {
  crewSchema,
  dispatchSchema,
  dispatchStatusSchema,
  listUnitsQuerySchema,
  scopeSchema,
  unitSchema,
  unitStatusSchema,
} from "./unit.validator.js";

function requireParam(value: string | undefined, name: string): string {
  if (!value) throw new BadRequestError(`${name} is required`);
  return value;
}

// ─── Units ────────────────────────────────────────────────────────────────────

export const listUnits = asyncHandler(async (req, res) => {
  const query = validate(listUnitsQuerySchema, req.query);
  const units = await UnitService.getUnits(query);
  res.json({ success: true, data: units });
});

export const getUnitStats = asyncHandler(async (req, res) => {
  const { stationId } = validate(scopeSchema, req.query);
  const stats = await UnitService.getUnitStats(stationId);
  res.json({ success: true, data: stats });
});

export const getSingleUnit = asyncHandler(async (req, res) => {
  const unit = await UnitService.getUnitById(requireParam(req.params.id, "Unit ID"));
  res.json({ success: true, data: unit });
});

export const createUnit = asyncHandler(async (req, res) => {
  const input = validate(unitSchema, req.body);
  const unit = await UnitService.createUnit(input);
  res.status(201).json({ success: true, data: unit });
});

export const updateUnit = asyncHandler(async (req, res) => {
  const updates = validatePartial(unitSchema, req.body ?? {});
  const unit = await UnitService.updateUnit(
    requireParam(req.params.id, "Unit ID"),
    updates,
  );
  res.json({ success: true, data: unit });
});

export const deleteUnit = asyncHandler(async (req, res) => {
  await UnitService.deleteUnit(requireParam(req.params.id, "Unit ID"));
  res.json({ success: true, message: "Unit removed" });
});

export const setUnitStatus = asyncHandler(async (req, res) => {
  const { status, note } = validate(unitStatusSchema, req.body ?? {});
  const unit = await UnitService.setUnitStatus(
    requireParam(req.params.id, "Unit ID"),
    status,
    note,
  );
  res.json({ success: true, data: unit });
});

// ─── Crew ─────────────────────────────────────────────────────────────────────

export const addCrew = asyncHandler(async (req, res) => {
  const member = validate(crewSchema, req.body);
  const unit = await UnitService.addCrew(
    requireParam(req.params.id, "Unit ID"),
    member,
  );
  res.status(201).json({ success: true, data: unit });
});

export const updateCrew = asyncHandler(async (req, res) => {
  const updates = validatePartial(crewSchema, req.body ?? {});
  const unit = await UnitService.updateCrew(
    requireParam(req.params.id, "Unit ID"),
    requireParam(req.params.crewId, "Crew ID"),
    updates,
  );
  res.json({ success: true, data: unit });
});

export const removeCrew = asyncHandler(async (req, res) => {
  const unit = await UnitService.removeCrew(
    requireParam(req.params.id, "Unit ID"),
    requireParam(req.params.crewId, "Crew ID"),
  );
  res.json({ success: true, data: unit });
});

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export const recommendUnits = asyncHandler(async (req, res) => {
  const { stationId } = validate(scopeSchema, req.query);
  const units = await UnitService.recommendUnits(
    requireParam(req.params.id, "Alert ID"),
    stationId,
  );
  res.json({ success: true, data: units });
});

export const dispatchUnits = asyncHandler(async (req, res) => {
  const { unitIds, operator } = validate(dispatchSchema, req.body ?? {});
  const dispatches = await UnitService.dispatchUnits(
    requireParam(req.params.id, "Alert ID"),
    unitIds,
    operator,
  );
  res.status(201).json({ success: true, data: dispatches });
});

export const getAlertDispatches = asyncHandler(async (req, res) => {
  const dispatches = await UnitService.getDispatchesForAlert(
    requireParam(req.params.id, "Alert ID"),
  );
  res.json({ success: true, data: dispatches });
});

export const getActiveDispatches = asyncHandler(async (req, res) => {
  const { stationId } = validate(scopeSchema, req.query);
  const dispatches = await UnitService.getActiveDispatches(stationId);
  res.json({ success: true, data: dispatches });
});

export const updateDispatchStatus = asyncHandler(async (req, res) => {
  const { status, note } = validate(dispatchStatusSchema, req.body ?? {});
  const dispatch = await UnitService.updateDispatchStatus(
    requireParam(req.params.dispatchId, "Dispatch ID"),
    status,
    note,
  );
  res.json({ success: true, data: dispatch });
});
