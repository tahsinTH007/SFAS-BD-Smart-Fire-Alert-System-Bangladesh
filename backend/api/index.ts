import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../src/app.js";
import { connectDB } from "../src/db/index.js";
import { logger } from "../src/lib/logger.js";

/**
 * Vercel serverless entry point for the REST API only.
 *
 * Socket.IO and the device simulator need one long-lived process and cannot
 * run here — a serverless function is spun up per request with no persistent
 * timers or open WebSockets. Use this only for REST access to Atlas; keep the
 * Render deployment (see /render.yaml and DEPLOYMENT.md) for the full
 * real-time dashboard experience.
 */

const app = createApp();
let dbReady: Promise<unknown> | null = null;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    dbReady ??= connectDB();
    await dbReady;
  } catch (error) {
    dbReady = null;
    logger.error("MongoDB connection failed in serverless handler", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "error", message: "Database unavailable" }));
    return;
  }

  app(req, res);
}
