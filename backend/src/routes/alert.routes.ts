import { Router } from "express";
import * as AlertController from "../modules/alerts/alert.controller.js";

export const alertsRouter = Router();

// GET    /api/v1/alerts
alertsRouter.get("/", AlertController.getAllAlerts);

// GET    /api/v1/alerts/:alertId
alertsRouter.get("/:id", AlertController.getSingleAlert);

// GET    /api/v1/alerts/priority/:priority
alertsRouter.get("/priority/:priority", AlertController.getAlertsByType);
