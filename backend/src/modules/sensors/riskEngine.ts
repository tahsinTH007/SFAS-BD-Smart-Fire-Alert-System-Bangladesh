import { numeric } from "../../config/env.js";
import type { ISensorData } from "./sensor.types.js";

/**
 * Multi-sensor fusion — the core OGNIBORMO idea.
 *
 * A single elevated reading is not a fire. High temperature on its own could be
 * a hot afternoon; smoke alone could be a cooking pan. Confidence comes from
 * several independent sensors agreeing at once, so each contributing sensor adds
 * weight and co-occurrence adds a bonus on top.
 *
 * Output is a 0-100 score plus the list of factors that produced it, so the
 * dashboard can explain *why* an alert fired rather than just showing a number.
 */

export type RiskFactor =
  | "flame"
  | "smoke"
  | "gas"
  | "temperature"
  | "temperature-humidity";

export interface RiskAssessment {
  score: number;
  factors: RiskFactor[];
  priority: "critical" | "important" | "info";
  /** Dominant signal, used to label the alert. */
  kind: "fire" | "smoke" | "gas" | "heat" | "normal";
  summary: string;
}

/** Maps a reading onto 0..1 across a soft threshold band. */
function ramp(value: number, start: number, full: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= start) return 0;
  if (value >= full) return 1;
  return (value - start) / (full - start);
}

export function assessRisk(data: Partial<ISensorData>): RiskAssessment {
  const temp = Number(data.temp ?? 0);
  const humidity = Number(data.humidity ?? 0);
  const smoke = Number(data.smoke ?? 0);
  const gas = Number(data.gas ?? 0);
  const flame = Number(data.fire ?? 0);

  const factors: RiskFactor[] = [];
  let score = 0;

  // ── Flame: the strongest single indicator ────────────────────────────────
  if (flame === 1) {
    score += 55;
    factors.push("flame");
  }

  // ── Smoke ────────────────────────────────────────────────────────────────
  const smokeWeight = ramp(smoke, numeric.smokeThreshold, numeric.smokeThreshold * 2.5);
  if (smokeWeight > 0) {
    score += 30 * smokeWeight;
    factors.push("smoke");
  }

  // ── Combustible gas ──────────────────────────────────────────────────────
  const gasWeight = ramp(gas, numeric.gasThreshold, numeric.gasThreshold * 2);
  if (gasWeight > 0) {
    score += 25 * gasWeight;
    factors.push("gas");
  }

  // ── Temperature ──────────────────────────────────────────────────────────
  const tempWeight = ramp(temp, numeric.tempThreshold, numeric.tempThreshold + 40);
  if (tempWeight > 0) {
    score += 20 * tempWeight;
    factors.push("temperature");
  }

  // Hot *and* unusually dry is the classic pre-ignition environment. Only
  // meaningful once temperature is already elevated, so it is a modifier.
  if (tempWeight > 0 && humidity > 0 && humidity < 25) {
    score += 8;
    factors.push("temperature-humidity");
  }

  // ── Corroboration bonus ──────────────────────────────────────────────────
  // Independent sensors agreeing is worth more than the sum of their parts.
  const independent = factors.filter((f) => f !== "temperature-humidity").length;
  if (independent >= 3) score += 15;
  else if (independent === 2) score += 8;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── Classification ───────────────────────────────────────────────────────
  let kind: RiskAssessment["kind"] = "normal";
  if (flame === 1) kind = "fire";
  else if (smokeWeight > 0 && smokeWeight >= gasWeight) kind = "smoke";
  else if (gasWeight > 0) kind = "gas";
  else if (tempWeight > 0) kind = "heat";

  let priority: RiskAssessment["priority"] = "info";
  if (score >= 70) priority = "critical";
  else if (score >= 40) priority = "important";

  return {
    score,
    factors,
    priority,
    kind,
    summary: buildSummary(kind, factors, score),
  };
}

function buildSummary(
  kind: RiskAssessment["kind"],
  factors: RiskFactor[],
  score: number,
): string {
  if (kind === "normal") return "All monitored parameters within normal range.";

  const readable: Record<RiskFactor, string> = {
    flame: "flame detected",
    smoke: "smoke above threshold",
    gas: "combustible gas above threshold",
    temperature: "elevated temperature",
    "temperature-humidity": "hot and dry conditions",
  };

  const list = factors.map((f) => readable[f]);
  const joined =
    list.length > 1
      ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`
      : list[0];

  return `Fire risk ${score}/100 — ${joined}.`;
}

/** True when a reading is worth raising an alert for. */
export function shouldAlert(assessment: RiskAssessment): boolean {
  return assessment.score >= 40;
}
