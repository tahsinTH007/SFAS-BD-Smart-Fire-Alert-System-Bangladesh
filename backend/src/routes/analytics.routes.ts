import { Router } from "express";
import * as AnalyticsController from "../modules/analytics/analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.get("/summary", AnalyticsController.getSummary);
analyticsRouter.get("/areas", AnalyticsController.getAreas);
analyticsRouter.get("/causes", AnalyticsController.getCauses);
analyticsRouter.get("/response", AnalyticsController.getResponse);
