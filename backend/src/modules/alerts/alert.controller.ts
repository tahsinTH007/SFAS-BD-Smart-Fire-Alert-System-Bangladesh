import type { Request, Response } from "express";
import * as AlertService from "./alert.service.js";

export async function getAllAlerts(req: Request, res: Response) {
  try {
    const results = await AlertService.getAllAlerts();
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("❌ getAllAlerts error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

export async function getSingleAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: "Alert ID is required" });
      return;
    }

    const alert = await AlertService.getSingleAlert(id);

    if (!alert) {
      res.status(404).json({ success: false, error: "Alert not found" });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error("❌ getSingleAlert error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

export async function getAlertsByType(req: Request, res: Response) {
  try {
    const { priority } = req.params;

    if (!priority) {
      res.status(400).json({ success: false, error: "priority is required" });
      return;
    }

    const results = await AlertService.getAlertsByType(priority);

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("❌ getAlertsByPriority error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
