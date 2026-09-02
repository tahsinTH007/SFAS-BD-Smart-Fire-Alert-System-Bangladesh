import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { requestMetrics } from "./middlewares/requestMetrics.js";
import { corsMiddleware } from "./config/cors.js";
import { apiRouter } from "./routes/index.js";
import { applyGlobalRateLimit } from "./config/globalRateLimit.js";
import { env } from "./config/env.js";

export function createApp() {
  const app = express();

  // Behind a reverse proxy, req.ip must come from X-Forwarded-For for rate
  // limiting to key on the real client rather than the proxy.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // The API serves JSON to a separate origin; CORP would block those reads.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(corsMiddleware);

  app.use(requestMetrics);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(applyGlobalRateLimit);

  app.get("/", (_req, res) => {
    res.json({
      name: env.APP_NAME,
      description: "OGNIBORMO smart fire detection API",
      version: "1.0.0",
      docs: "/api/v1/health/ready",
    });
  });

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
