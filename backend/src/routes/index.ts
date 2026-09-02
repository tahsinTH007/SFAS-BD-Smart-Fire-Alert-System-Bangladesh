import { Router } from "express";
import { alertsRouter } from "./alert.routes.js";
import { devicesRouter } from "./device.routes.js";
import { buildingsRouter } from "./building.routes.js";
import { stationsRouter } from "./station.routes.js";
import { sensorsRouter } from "./sensor.routes.js";
import { unitsRouter } from "./unit.routes.js";
import { analyticsRouter } from "./analytics.routes.js";
import { healthRouter } from "./health.route.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/alerts", alertsRouter);
apiRouter.use("/devices", devicesRouter);
apiRouter.use("/buildings", buildingsRouter);
apiRouter.use("/stations", stationsRouter);
apiRouter.use("/sensors", sensorsRouter);
apiRouter.use("/units", unitsRouter);
apiRouter.use("/analytics", analyticsRouter);
