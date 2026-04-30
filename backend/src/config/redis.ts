import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

export const client = new Redis({
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
});

client.on("connect", () => logger.info("Redis connected"));
client.on("error", (err: any) => logger.error("Redis error", err));
