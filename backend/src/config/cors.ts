import cors, { CorsOptions } from "cors";
import { env } from "./env.js";

const allowedOrigins =
  env.NODE_ENV === "production"
    ? env.CORS_ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "http://127.0.0.1:3000"];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
