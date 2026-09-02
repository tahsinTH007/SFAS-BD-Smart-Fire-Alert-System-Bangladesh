import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

/**
 * Redis is a performance dependency here (caching + rate limiting), not a
 * correctness one. If it is unreachable the API must degrade, not hang.
 *
 * `enableOfflineQueue: false` is the important bit: without it, commands issued
 * while the socket is down queue up silently and every HTTP request that awaits
 * one blocks until the connection returns.
 */
export const client = new Redis({
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  username: env.REDIS_USERNAME || undefined,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: false,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 5_000,
  retryStrategy(times) {
    // Back off to at most 30s between attempts, and keep retrying forever so a
    // Redis restart heals on its own.
    return Math.min(times * 500, 30_000);
  },
  reconnectOnError(err) {
    return err.message.includes("READONLY");
  },
});

let ready = false;
let loggedFailure = false;

client.on("ready", () => {
  ready = true;
  loggedFailure = false;
  logger.info(`Redis connected → ${env.REDIS_HOST}:${env.REDIS_PORT}`);
});

client.on("end", () => {
  ready = false;
});

client.on("error", (err: Error) => {
  ready = false;
  // The retry strategy re-fires this on every attempt; log the first one only
  // so a dead host does not flood the log file.
  if (!loggedFailure) {
    loggedFailure = true;
    logger.warn(
      `Redis unavailable (${err.message}) — caching and rate limiting are disabled until it returns`,
    );
  }
});

export const isRedisReady = () => ready;

/** GET that resolves to null instead of throwing when Redis is down. */
export async function cacheGet(key: string): Promise<string | null> {
  if (!ready) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

/** SET that silently no-ops when Redis is down. */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  if (!ready) return;
  try {
    await client.set(key, value, "EX", ttlSeconds);
  } catch {
    /* cache writes are best-effort */
  }
}

/**
 * Deletes every key matching a glob pattern.
 * `DEL "devices:*"` does not glob — it deletes a key literally named
 * `devices:*`. SCAN + UNLINK is the correct way to invalidate a prefix.
 */
export async function cacheInvalidate(pattern: string): Promise<number> {
  if (!ready) return 0;
  try {
    let cursor = "0";
    let removed = 0;
    do {
      const [next, keys] = await client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        200,
      );
      cursor = next;
      if (keys.length) {
        await client.unlink(...keys);
        removed += keys.length;
      }
    } while (cursor !== "0");
    return removed;
  } catch {
    return 0;
  }
}
