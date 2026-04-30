import { NextFunction, Request, RequestHandler, Response } from "express";
import { InternalServerError } from "./error.js";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error instanceof Error) {
        return next(error);
      }

      return next(
        new InternalServerError("Unexpected internal server error", error),
      );
    }
  };
}
