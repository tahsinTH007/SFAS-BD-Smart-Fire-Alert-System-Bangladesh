import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

// Register every model once so refs (`Station`, `Building`, `Device`, `Alert`)
// resolve no matter which module is imported first.
import "./models/station.model.js";
import "./models/building.model.js";
import "./models/device.model.js";
import "./models/alert.models.js";
import "./models/reading.model.js";
import "./models/unit.model.js";
import "./models/dispatch.model.js";

mongoose.set("strictQuery", true);

let connecting: Promise<typeof mongoose> | null = null;

/**
 * Connects to MongoDB using MONGO_URI / DB_NAME from the environment.
 * Safe to call more than once — the same in-flight promise is reused.
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;

  connecting = mongoose
    .connect(env.MONGO_URI, {
      dbName: env.DB_NAME,
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 20,
    })
    .then((m) => {
      logger.info(
        `MongoDB connected → ${m.connection.host}/${m.connection.name}`,
      );
      return m;
    })
    .catch((error) => {
      connecting = null;
      throw error;
    });

  return connecting;
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  connecting = null;
  logger.info("MongoDB disconnected");
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected — driver will retry");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error", err);
});
