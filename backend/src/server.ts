import "dotenv/config";

import http from "node:http";
import { logger } from "./lib/logger.js";
import { createApp } from "./app.js";
import { env, numeric } from "./config/env.js";
import { connectDB, disconnectDB } from "./db/index.js";
import { initSocket } from "./config/socket.js";
import { client as redis } from "./config/redis.js";
import { closeSerial } from "./config/serial.js";
import { initSensorListener } from "./modules/sensors/sensor.listener.js";

async function bootStrap() {
  try {
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    initSocket(server);
    initSensorListener();

    const port = numeric.port || 5000;

    server.listen(port, () => {
      logger.info(`${env.APP_NAME} listening on http://localhost:${port}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    // ── Graceful shutdown ───────────────────────────────────────────────────
    let shuttingDown = false;

    const shutdown = async (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;

      logger.info(`${signal} received — shutting down`);

      const force = setTimeout(() => {
        logger.error("Shutdown timed out after 10s — forcing exit");
        process.exit(1);
      }, 10_000);
      force.unref();

      server.close(async () => {
        try {
          closeSerial();
          await disconnectDB();
          redis.disconnect();
        } catch (err) {
          logger.error("Error during shutdown", err);
        }
        logger.info("Shutdown complete");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled promise rejection", reason);
    });

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught exception", err);
      void shutdown("uncaughtException");
    });
  } catch (error) {
    logger.error("Failed to start the server", error);
    process.exit(1);
  }
}

void bootStrap();
