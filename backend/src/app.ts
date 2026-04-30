import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { corsMiddleware } from "./config/cors.js";
import { apiRouter } from "./routes/index.js";
import { applyGlobalRateLimit } from "./config/globalRateLimit.js";
import { healthRouter } from "./routes/health.route.js";
import { circuitGuard } from "./middlewares/requestSampler.js";

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(corsMiddleware);

  // Global rate limit
  app.use(applyGlobalRateLimit);

  // Parse JSON & URL-encoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/v1/health", healthRouter);

  app.use("/api/v1", circuitGuard, apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (last middleware)
  app.use(errorHandler);

  return app;
}
