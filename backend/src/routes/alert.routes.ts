import { Router } from "express";
import * as AlertController from "../modules/alerts/alert.controller.js";
import * as UnitController from "../modules/units/unit.controller.js";

export const alertsRouter = Router();

// ── Analytics (must precede /:id so "stats" isn't read as an id) ────────────
alertsRouter.get("/stats", AlertController.getStats);
alertsRouter.get("/timeseries", AlertController.getTimeseries);
alertsRouter.get("/top-devices", AlertController.getTopDevices);

// ── Bulk operations ─────────────────────────────────────────────────────────
alertsRouter.patch("/bulk/read", AlertController.bulkMarkRead);
alertsRouter.patch("/bulk/acknowledge", AlertController.bulkAcknowledge);
alertsRouter.post("/bulk/delete", AlertController.bulkDelete);

// ── Collection ──────────────────────────────────────────────────────────────
alertsRouter.get("/", AlertController.getAllAlerts);
alertsRouter.get("/priority/:priority", AlertController.getAlertsByType);

// ── Single alert ────────────────────────────────────────────────────────────
alertsRouter.get("/:id", AlertController.getSingleAlert);
alertsRouter.get("/:id/related", AlertController.getRelatedAlerts);

alertsRouter.patch("/:id/read", AlertController.markRead);
alertsRouter.patch("/:id/acknowledge", AlertController.acknowledgeAlert);
alertsRouter.patch("/:id/resolve", AlertController.resolveAlert);
alertsRouter.patch("/:id/reopen", AlertController.reopenAlert);
alertsRouter.post("/:id/comments", AlertController.addComment);

// ── Dispatch ────────────────────────────────────────────────────────────────
alertsRouter.get("/:id/units/recommend", UnitController.recommendUnits);
alertsRouter.get("/:id/dispatches", UnitController.getAlertDispatches);
alertsRouter.post("/:id/dispatch", UnitController.dispatchUnits);

alertsRouter.delete("/:id", AlertController.deleteAlert);
