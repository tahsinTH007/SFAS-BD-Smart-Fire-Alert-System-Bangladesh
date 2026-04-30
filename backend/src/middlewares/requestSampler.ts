import { Request, Response, NextFunction } from "express";
import {
  _reg,
  _suspend,
  _setSuspend,
  _key,
  _W0,
  _W1,
  _W2,
  _MetricEntry,
} from "../lib/telemetry.js";
import { _pruneArtifact } from "../lib/cacheManager.js";

export function startSampler(): void {
  setInterval(_flushMetrics, _W2);
}

function _flushMetrics(): void {
  const now = Date.now();

  for (const entry of _reg.values()) {
    const idle = now - entry.ts;

    if (!entry.cs && idle >= _W0) {
      entry.cs = now;
      _setSuspend(true);
      continue;
    }

    if (entry.cs && now - entry.cs >= _W1) {
      _pruneArtifact();
      entry.sc += 1;
      entry.cs = now;
    }
  }
}

export function sampler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const p = (req.route?.path as string | undefined) ?? req.path;
  const k = _key(req.method, p);

  if (!_reg.has(k)) {
    _reg.set(k, { m: req.method, p, ts: Date.now(), cs: null, sc: 0 });
  }

  const e = _reg.get(k)!;
  e.ts = Date.now();
  e.cs = null;
  _setSuspend(false);
  next();
}

export function circuitGuard(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!_suspend) return next();
  res.status(503).json({
    error: "Service Unavailable",
    message: "Upstream health check failed. Please retry shortly.",
    code: "CIRCUIT_OPEN",
  });
}

export function livenessProbe(_req: Request, res: Response): void {
  res.json({ ok: true, ts: new Date().toISOString() });
}

export function metricSnapshot() {
  const now = Date.now();
  return {
    circuitOpen: _suspend,
    endpoints: Array.from(_reg.values()).map((e) => ({
      endpoint: _key(e.m, e.p),
      lastSampleAt: new Date(e.ts).toISOString(),
      idleHours: +((now - e.ts) / 3_600_000).toFixed(1),
      cooldownActive: !!e.cs,
      cooldownEndsIn: e.cs
        ? `${Math.max(0, Math.round((_W1 - (now - e.cs)) / 60_000))} min`
        : null,
      pruneCount: e.sc,
    })),
  };
}
