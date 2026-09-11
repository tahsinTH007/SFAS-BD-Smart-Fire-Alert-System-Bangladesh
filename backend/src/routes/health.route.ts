import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { metricSnapshot } from "../middlewares/requestMetrics.js";
import { isRedisReady, redisEnabled } from "../config/redis.js";
import { getSerialStatus } from "../config/serial.js";
import { getSimulatorStatus } from "../modules/sensors/simulator.js";
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
  const simulator = getSimulatorStatus();

  res.status(mongoUp ? 200 : 503).json({
    status: mongoUp ? "ready" : "degraded",
    ts: new Date().toISOString(),
    app: env.APP_NAME,
    env: env.NODE_ENV,
    dependencies: {
      mongodb: { required: true, up: mongoUp },
      redis: { required: false, up: isRedisReady(), enabled: redisEnabled },
      serial: {
        required: false,
        up: serial.connected,
        enabled: env.SERIAL_ENABLED === "true",
        port: serial.path,
        lastLineAt: serial.lastLineAt,
      },
      // Where the sensor frames are coming from when no board is attached.
      simulator: {
        required: false,
        up: simulator.running,
        enabled: simulator.enabled,
        intervalMs: simulator.intervalMs,
        lastFrameAt: simulator.lastFrameAt,
        units: simulator.units,
      },
    },
  });
});

healthRouter.get("/metrics", (_req: Request, res: Response) => {
  res.json(metricSnapshot());
});
