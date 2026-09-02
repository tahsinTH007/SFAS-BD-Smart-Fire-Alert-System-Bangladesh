import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import type { NextFunction, Request, Response } from "express";
import { client } from "./redis.js";
import { logger } from "../lib/logger.js";

/**
 * Redis-backed limiter with an in-memory insurance limiter, so a Redis outage
 * degrades to per-instance limiting rather than either hanging the request or
 * removing the limit entirely.
 */
const memoryFallback = new RateLimiterMemory({
  points: 500,
  duration: 60,
});

export const globalRateLimiter = new RateLimiterRedis({
  storeClient: client,
  keyPrefix: "rl:global",
  points: 500,
  duration: 60,
  blockDuration: 60,
  insuranceLimiter: memoryFallback,
});

function rejectionToSeconds(rejRes: { msBeforeNext?: number }): number {
  return Math.max(1, Math.round((rejRes.msBeforeNext ?? 1000) / 1000));
}

export async function applyGlobalRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await globalRateLimiter.consume(req.ip ?? "unknown");
    next();
  } catch (rejRes: unknown) {
    if (rejRes instanceof Error) {
      // Store failure — fail open rather than locking everyone out.
      logger.warn(`Rate limiter store error, allowing request: ${rejRes.message}`);
      next();
      return;
    }

    const secs = rejectionToSeconds(rejRes as { msBeforeNext?: number });
    res.set("Retry-After", String(secs));
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
      retryAfter: secs,
    });
    // NOTE: no next() here. The previous version sent 429 and then called
    // next(), so the request continued down the stack and Express threw
    // ERR_HTTP_HEADERS_SENT on the second write.
  }
}

/**
 * Builds a route-scoped limiter middleware.
 * `keyFn` derives the bucket key from the request (device code, building name…).
 */
export function createRateLimit(opts: {
  keyPrefix: string;
  points: number;
  duration: number;
  blockDuration?: number;
  keyFn: (req: Request) => string;
}) {
  const limiter = new RateLimiterRedis({
    storeClient: client,
    keyPrefix: opts.keyPrefix,
    points: opts.points,
    duration: opts.duration,
    blockDuration: opts.blockDuration ?? opts.duration,
    insuranceLimiter: new RateLimiterMemory({
      points: opts.points,
      duration: opts.duration,
    }),
  });

  return async function rateLimit(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await limiter.consume(opts.keyFn(req));
      next();
    } catch (rejRes: unknown) {
      if (rejRes instanceof Error) {
        next();
        return;
      }
      const secs = rejectionToSeconds(rejRes as { msBeforeNext?: number });
      res.set("Retry-After", String(secs));
      res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter: secs,
      });
    }
  };
}
