import { Router } from "express";
import { alertsRouter } from "./alert.routes.js";
import { devicesRouter } from "./device.routes.js";
import { buildingsRouter } from "./building.routes.js";
import { healthRouter } from "./health.route.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter); 
apiRouter.use("/alerts", alertsRouter);
apiRouter.use("/devices", devicesRouter);
apiRouter.use("/buildings", buildingsRouter);
