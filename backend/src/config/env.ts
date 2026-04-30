import { z } from "zod";
import { logger } from "../lib/logger.js";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("8080"),
  APP_NAME: z.string().default("SFAS-BD"),
  BASE_URL: z.string().url(),

  // Database
  MONGO_URI: z.string(),
  DB_NAME: z.string(),

  // Clerk
  CLERK_API_KEY: z.string(),
  CLERK_API_VERSION: z.string().default("latest"),
  CLERK_FRONTEND_API: z.string().url(),
  CLERK_JWT_KEY: z.string(),

  // SerialPort
  SERIAL_PORT: z.string(),
  SERIAL_BAUD_RATE: z.string().default("9600"),
  SERIAL_RETRY_INTERVAL: z.string().default("5000"),
  SERIAL_DATA_FORMAT: z.enum(["json", "csv", "raw"]).default("json"),

  // Socket.IO
  SOCKET_PATH: z.string().default("/socket.io"),
  SOCKET_CORS_ORIGIN: z.string().url(),
  SOCKET_PING_INTERVAL: z.string().default("25000"),
  SOCKET_PING_TIMEOUT: z.string().default("60000"),

  // CORS
  CORS_ALLOWED_ORIGINS: z.string(),
  CORS_METHODS: z.string().default("GET,POST,PUT,DELETE"),
  CORS_HEADERS: z.string().default("Content-Type,Authorization"),

  // Notifications
  NOTIF_EMAIL_PROVIDER: z.string().optional(),
  NOTIF_EMAIL_API_KEY: z.string().optional(),
  NOTIF_SMS_PROVIDER: z.string().optional(),
  NOTIF_SMS_SID: z.string().optional(),
  NOTIF_SMS_AUTH_TOKEN: z.string().optional(),
  NOTIF_PUSH_PROVIDER: z.string().optional(),
  NOTIF_PUSH_KEY_PATH: z.string().optional(),

  // Other
  EVENT_BUS_RETRY: z.string().default("3"),
  MAX_ALERT_HISTORY: z.string().default("1000"),

  //Redis
  REDIS_USERNAME: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error(parsed.error);
  process.exit(1);
}

export const env = parsed.data;
