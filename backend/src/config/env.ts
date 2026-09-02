import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("8080"),
  APP_NAME: z.string().default("SFAS-BD"),
  BASE_URL: z.string().url().default("http://localhost:8080"),
  LOG_LEVEL: z.string().optional(),

  // Database
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  DB_NAME: z.string().default("smartFireAlertSystem"),

  // Clerk — not wired up yet; optional so the server boots without it.
  CLERK_API_KEY: z.string().optional(),
  CLERK_API_VERSION: z.string().default("latest"),
  CLERK_FRONTEND_API: z.string().url().optional(),
  CLERK_JWT_KEY: z.string().optional(),

  // SerialPort (Arduino / OGNIBORMO unit)
  SERIAL_PORT: z.string().default("COM4"),
  SERIAL_BAUD_RATE: z.string().default("9600"),
  SERIAL_RETRY_INTERVAL: z.string().default("5000"),
  SERIAL_DATA_FORMAT: z.enum(["json", "csv", "raw"]).default("json"),
  SERIAL_ENABLED: z.string().default("true"),

  // Socket.IO
  SOCKET_PATH: z.string().default("/socket.io"),
  SOCKET_CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SOCKET_PING_INTERVAL: z.string().default("25000"),
  SOCKET_PING_TIMEOUT: z.string().default("60000"),

  // CORS — comma-separated list, honoured in every NODE_ENV
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000"),
  CORS_METHODS: z.string().default("GET,POST,PUT,PATCH,DELETE,OPTIONS"),
  CORS_HEADERS: z.string().default("Content-Type,Authorization,Accept"),

  // Notifications (all optional integrations)
  NOTIF_EMAIL_PROVIDER: z.string().optional(),
  NOTIF_EMAIL_API_KEY: z.string().optional(),
  NOTIF_SMS_PROVIDER: z.string().optional(),
  NOTIF_SMS_SID: z.string().optional(),
  NOTIF_SMS_AUTH_TOKEN: z.string().optional(),
  NOTIF_PUSH_PROVIDER: z.string().optional(),
  NOTIF_PUSH_KEY_PATH: z.string().optional(),

  // Alerting behaviour
  EVENT_BUS_RETRY: z.string().default("3"),
  MAX_ALERT_HISTORY: z.string().default("1000"),
  SMOKE_THRESHOLD: z.string().default("80"),
  GAS_THRESHOLD: z.string().default("300"),
  TEMP_THRESHOLD: z.string().default("50"),
  ALERT_DEDUPE_WINDOW_MS: z.string().default("60000"),

  // Redis
  REDIS_USERNAME: z.string().optional().default(""),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.string().default("6379"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // logger imports env, so a plain console write avoids a circular import here.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";

export const numeric = {
  port: Number(env.PORT),
  smokeThreshold: Number(env.SMOKE_THRESHOLD),
  gasThreshold: Number(env.GAS_THRESHOLD),
  tempThreshold: Number(env.TEMP_THRESHOLD),
  dedupeWindowMs: Number(env.ALERT_DEDUPE_WINDOW_MS),
  maxAlertHistory: Number(env.MAX_ALERT_HISTORY),
};
