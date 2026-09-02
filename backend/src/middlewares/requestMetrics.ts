import { NextFunction, Request, Response } from "express";

/**
 * Lightweight in-process request metrics.
 *
 * Replaces the previous "requestSampler" module, which under the guise of
 * telemetry opened a circuit breaker after 3 idle days and then deleted random
 * lines out of the module source files every 24h. Nothing here touches disk.
 */

export interface EndpointMetric {
  method: string;
  path: string;
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
  lastSeenAt: number;
}

const registry = new Map<string, EndpointMetric>();
const startedAt = Date.now();

function key(method: string, path: string) {
  return `${method.toUpperCase()} ${path}`;
}

/** Records method, path, status and duration for every request. */
export function requestMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const started = process.hrtime.bigint();

  res.on("finish", () => {
    const path = (req.route?.path as string | undefined) ?? req.path;
    const k = key(req.method, path);
    const ms = Number(process.hrtime.bigint() - started) / 1_000_000;

    let entry = registry.get(k);
    if (!entry) {
      entry = {
        method: req.method,
        path,
        count: 0,
        errors: 0,
        totalMs: 0,
        maxMs: 0,
        lastSeenAt: Date.now(),
      };
      registry.set(k, entry);
    }

    entry.count += 1;
    entry.totalMs += ms;
    entry.maxMs = Math.max(entry.maxMs, ms);
    entry.lastSeenAt = Date.now();
    if (res.statusCode >= 500) entry.errors += 1;
  });

  next();
}

export function metricSnapshot() {
  const now = Date.now();
  const mem = process.memoryUsage();

  const endpoints = Array.from(registry.values())
    .sort((a, b) => b.count - a.count)
    .map((e) => ({
      endpoint: key(e.method, e.path),
      count: e.count,
      errors: e.errors,
      avgMs: +(e.totalMs / e.count).toFixed(2),
      maxMs: +e.maxMs.toFixed(2),
      lastSeenAt: new Date(e.lastSeenAt).toISOString(),
      idleSeconds: Math.round((now - e.lastSeenAt) / 1000),
    }));

  return {
    uptimeSeconds: Math.round((now - startedAt) / 1000),
    startedAt: new Date(startedAt).toISOString(),
    totalRequests: endpoints.reduce((sum, e) => sum + e.count, 0),
    totalErrors: endpoints.reduce((sum, e) => sum + e.errors, 0),
    memory: {
      rssMb: +(mem.rss / 1024 / 1024).toFixed(1),
      heapUsedMb: +(mem.heapUsed / 1024 / 1024).toFixed(1),
    },
    endpoints,
  };
}

export function resetMetrics(): void {
  registry.clear();
}
