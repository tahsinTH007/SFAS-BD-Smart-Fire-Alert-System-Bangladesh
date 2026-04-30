import { ErrorRequestHandler } from "express";
import { HttpError } from "../lib/error.js";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let status = 500;
  let message = "Internal server error";
  let details: unknown = undefined;

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Invalid request data";
    details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof Error) {
    details = process.env.NODE_ENV === "development" ? err.stack : undefined;
  }

  logger.error({
    message: `${req.method} ${req.originalUrl} --> ${status} - ${message}`,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    body: req.body,
    query: req.query,
    headers: req.headers,
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(status).json({
    error: {
      message,
      status,
      details:
        process.env.NODE_ENV === "production" && status === 500
          ? undefined
          : details,
    },
  });
};
