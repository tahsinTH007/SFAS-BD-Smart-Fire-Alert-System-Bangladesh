import { RateLimiterRedis } from "rate-limiter-flexible";
import { client } from "../../config/redis.js";

export const deviceCreateLimiter = new RateLimiterRedis({
  storeClient: client,
  points: 5,
  duration: 60,
  blockDuration: 60,
});
