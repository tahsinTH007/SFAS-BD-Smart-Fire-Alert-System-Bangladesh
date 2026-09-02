import path from "node:path";
import fs from "node:fs";
import { createLogger, format, transports } from "winston";

const logDir = path.resolve("logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const printer = format.printf(({ timestamp, level, message, stack, ...rest }) => {
  const body =
    typeof message === "object" ? JSON.stringify(message, null, 2) : message;

  const extras = Object.keys(rest).length
    ? ` ${JSON.stringify(rest)}`
    : "";

  return `${timestamp} [${level}] ${stack ?? body}${extras}`;
});

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.uncolorize(),
  printer,
);

const consoleFormat = format.combine(
  format.colorize({ level: true }),
  format.timestamp({ format: "HH:mm:ss" }),
  format.errors({ stack: true }),
  printer,
);

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),

  transports: [
    new transports.Console({ format: consoleFormat }),

    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
      format: fileFormat,
    }),

    new transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
      format: fileFormat,
    }),
  ],

  exitOnError: false,
});

// NOTE: this module used to reassign console.log/error/warn to funnel them into
// winston. That made every console.error invisible in the terminal (it wrote to
// the log file only) and printed every console.log twice. Call `logger` directly
// instead — console is left alone.
