import path from "node:path";
import fs from "node:fs";
import { createLogger, format, transports } from "winston";

const logDir = path.resolve("logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const fileFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack }) => {
    const msg =
      typeof message === "object" ? JSON.stringify(message, null, 2) : message;

    return `${timestamp} [${level.toUpperCase()}] ${stack || msg}`;
  }),
);

const consoleFormat = format.combine(
  format.colorize({ level: true }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack }) => {
    const msg =
      typeof message === "object" ? JSON.stringify(message, null, 2) : message;

    return `${timestamp} [${level}] ${stack || msg}`;
  }),
);

export const logger = createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",

  transports: [
    new transports.Console({
      format: consoleFormat,
    }),

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


const originalConsoleLog = console.log.bind(console);

console.log = (...args) => {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");

  logger.info(message);
  originalConsoleLog(...args);
};

console.error = (...args) => {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");

  logger.error(message);
};

console.warn = (...args) => {
  const message = args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
    .join(" ");

  logger.warn(message);
};
