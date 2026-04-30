import "dotenv/config";

import http from "node:http";
import { logger } from "./lib/logger.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./db/index.js";
import { initSocket } from "./config/socket.js";
import { client } from "./config/redis.js";
import { initSensorListener } from "./modules/sensors/sensor.listener.js";
import { startSampler } from "./middlewares/requestSampler.js";

async function bootStrap() {
  try {
    await connectDB();

    const app = createApp();

    const server = http.createServer(app);

    initSocket(server);

    initSensorListener();

    startSampler();

    const port = Number(env.PORT) || 5000;

    server.listen(port, () => {
      logger.info(`Server is listening to port: http://localhost:${port}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received: closing server");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received: closing server");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to Start the Server", error);
    process.exit(1);
  }
}

bootStrap();
