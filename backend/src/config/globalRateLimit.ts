import { RateLimiterRedis } from "rate-limiter-flexible";
import { client } from "./redis.js";
import { NextFunction, Request, Response } from "express";

export const globalRateLimiter = new RateLimiterRedis({
  storeClient: client,
  points: 500,
  duration: 60,
  blockDuration: 60,
});

export async function applyGlobalRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await globalRateLimiter.consume(req.ip!).catch((rejRes) => {
      if (rejRes instanceof Error) {
        // Some Redis error
        // Never happen if `insuranceLimiter` set up
        // Decide what to do with it in other case
      } else {
        // Can't consume
        // If there is no error, rateLimiterRedis promise rejected with number of ms before next request allowed
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set("Retry-After", String(secs));
        res.status(429).send("Too Many Requests");
      }
    });
    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }
}
