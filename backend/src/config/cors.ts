import cors, { CorsOptions } from "cors";
import { env, isDev } from "./env.js";

/**
 * Allowed origins come from CORS_ALLOWED_ORIGINS in every environment.
 * The previous version ignored that variable outside production and hardcoded
 * port 3000, so running the frontend on any other port broke every request.
 * In development the localhost check is relaxed to any port.
 */
const configured = env.CORS_ALLOWED_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const LOCALHOST = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * RFC1918 ranges — the console is routinely opened from a phone or a second
 * laptop on the same router as the host PC, which arrives as
 * `http://192.168.x.x:3000` rather than localhost. That address changes with
 * every venue, so it cannot be pinned in CORS_ALLOWED_ORIGINS; the whole
 * private range is accepted instead, and only in development.
 */
const PRIVATE_LAN =
  /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

export function isOriginAllowed(origin: string): boolean {
  if (configured.includes(origin)) return true;
  if (isDev && (LOCALHOST.test(origin) || PRIVATE_LAN.test(origin))) return true;
  return false;
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Same-origin, curl, mobile clients and server-to-server have no Origin.
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  // The API exposes PATCH (acknowledge/resolve/read) and DELETE routes, and the
  // browser always preflights with OPTIONS. A CORS_METHODS value that omits any
  // of them silently breaks those routes in the browser while curl keeps
  // working, so the required set is unioned in rather than trusted from config.
  methods: Array.from(
    new Set([
      ...env.CORS_METHODS.split(",").map((m) => m.trim().toUpperCase()),
      "GET",
      "POST",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ]),
  ).filter(Boolean),
  allowedHeaders: Array.from(
    new Set([
      ...env.CORS_HEADERS.split(",").map((h) => h.trim()),
      "Content-Type",
      "Authorization",
      "Accept",
    ]),
  ).filter(Boolean),
  exposedHeaders: ["Retry-After"],
  credentials: true,
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
