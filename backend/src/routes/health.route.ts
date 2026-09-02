import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { metricSnapshot } from "../middlewares/requestMetrics.js";
import { isRedisReady } from "../config/redis.js";
import { getSerialStatus } from "../config/serial.js";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/live", (_req: Request, res: Response) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

/**
 * Readiness reflects the dependencies the API actually needs to serve traffic.
 * Mongo is required; Redis and the serial link are reported but do not fail the
 * check, because the API degrades gracefully without either.
 */
healthRouter.get("/ready", (_req: Request, res: Response) => {
  const mongoUp = mongoose.connection.readyState === 1;
  const serial = getSerialStatus();

  res.status(mongoUp ? 200 : 503).json({
    status: mongoUp ? "ready" : "degraded",
    ts: new Date().toISOString(),
    app: env.APP_NAME,
    env: env.NODE_ENV,
    dependencies: {
      mongodb: { required: true, up: mongoUp },
      redis: { required: false, up: isRedisReady() },
      serial: {
        required: false,
        up: serial.connected,
        port: serial.path,
        lastLineAt: serial.lastLineAt,
      },
    },
  });
});

healthRouter.get("/metrics", (_req: Request, res: Response) => {
  res.json(metricSnapshot());
});
