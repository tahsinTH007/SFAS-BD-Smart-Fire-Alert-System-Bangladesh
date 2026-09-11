import { env, numeric } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { Device } from "../../db/models/device.model.js";
import { ingestReading } from "./sensor.service.js";
import type { ISensorData } from "./sensor.types.js";

/**
 * Built-in device simulator.
 *
 * A hosted demo has no Arduino on a serial port, so this runs a handful of
 * synthetic OGNIBORMO units *inside the API process* and pushes their frames
 * through the same `ingestReading` path a real unit uses. Everything
 * downstream — risk fusion, alert de-duplication, socket broadcast, reading
 * history, device online status — is the real pipeline; only the frames are
 * made up.
 *
 * Unlike `scripts/simulate.ts` (which rolls a random scenario per frame), each
 * unit here is a small state machine, so the trend lines look like sensors
 * rather than noise: a kitchen smokes for a minute and settles without ever
 * alarming, a smoulder builds up over tens of seconds and sometimes breaks
 * into flame, a gas leak climbs and is vented, and every incident cools back
 * down to that room's own baseline.
 *
 * Targets are expressed relative to the configured thresholds, so the
 * scenarios classify the same way whatever calibration is in force:
 *
 *   cooking   → ~12/100  no alert   (the false-alarm case the project avoids)
 *   heat      →  ~7/100  no alert   (a hot afternoon)
 *   smoulder  → ~45/100  Important  (smoke + warmth, no flame)
 *   gas-leak  → ~45/100  Important  (single-sensor severity floor)
 *   fire      → 100/100  Critical   (flame corroborated by smoke, gas, heat)
 *
 * Enabled with DEVICE_SIMULATOR=true. See .env.example for the other knobs.
 */

export type SimPhase =
  | "normal"
  | "cooking"
  | "heat"
  | "smoulder"
  | "gas-leak"
  | "fire"
  | "recovery";

type Incident = Exclude<SimPhase, "normal" | "recovery">;

interface Readings {
  temp: number;
  humidity: number;
  smoke: number;
  gas: number;
}

interface SimUnit {
  deviceCode: string;
  label: string | null;
  /** This room's quiet-state readings; drifts slowly over time. */
  base: Readings;
  cur: Readings & { flame: 0 | 1 };
  phase: SimPhase;
  phaseUntil: number;
  frames: number;
  /** How likely each incident is when this unit leaves "normal". */
  weights: Record<Incident, number>;
  /** Scripted first incident, so a fresh boot demonstrates every case once. */
  opening: Incident | null;
}

/**
 * Order of the scripted opening across units: the first unit shows the
 * critical path within the first minute, the second the false alarm the
 * fusion is designed to reject, then the two single-cause warnings.
 */
const OPENING: Incident[] = ["fire", "cooking", "smoulder", "gas-leak"];

export interface SimulatorStatus {
  enabled: boolean;
  running: boolean;
  intervalMs: number;
  frames: number;
  lastFrameAt: string | null;
  units: { deviceCode: string; label: string | null; phase: SimPhase }[];
}

const SEC = 1000;
const MIN = 60 * SEC;

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

/** Triangular noise in [-1, 1], denser around zero than Math.random(). */
const noise = () => Math.random() + Math.random() - 1;

/** Moves `cur` a fraction of the way to `target` — an exponential ramp. */
const approach = (cur: number, target: number, rate: number) =>
  cur + (target - cur) * rate;

const round = (n: number, dp = 1) => Number(n.toFixed(dp));

const DEFAULT_WEIGHTS: Record<Incident, number> = {
  cooking: 0.4,
  heat: 0.1,
  smoulder: 0.2,
  "gas-leak": 0.15,
  fire: 0.15,
};

/**
 * Ambient conditions by what the unit watches. A server room runs cool and
 * dry, a kitchen warm and humid with a little smoke always about, so four
 * units on the Live Sensors tab do not all sit on the same number.
 */
function profileFor(label: string | null): {
  base: Readings;
  weights: Record<Incident, number>;
} {
  const T = numeric.smokeThreshold;
  const G = numeric.gasThreshold;
  const l = (label ?? "").toLowerCase();

  if (/kitchen|food|canteen/.test(l)) {
    return {
      base: { temp: 31, humidity: 62, smoke: 0.4 * T, gas: 0.35 * G },
      weights: { cooking: 0.65, heat: 0.05, smoulder: 0.12, "gas-leak": 0.1, fire: 0.08 },
    };
  }
  if (/server|generator|dye|boiler|electrical/.test(l)) {
    return {
      base: { temp: 33, humidity: 40, smoke: 0.25 * T, gas: 0.3 * G },
      weights: { cooking: 0.05, heat: 0.25, smoulder: 0.3, "gas-leak": 0.1, fire: 0.3 },
    };
  }
  if (/lab|chem|store|storage|warehouse|bay/.test(l)) {
    return {
      base: { temp: 27, humidity: 52, smoke: 0.3 * T, gas: 0.4 * G },
      weights: { cooking: 0.05, heat: 0.1, smoulder: 0.3, "gas-leak": 0.35, fire: 0.2 },
    };
  }
  return {
    base: { temp: 29, humidity: 58, smoke: 0.3 * T, gas: 0.3 * G },
    weights: DEFAULT_WEIGHTS,
  };
}

/** What each phase is pulling the readings towards. */
function targetFor(unit: SimUnit): Readings & { flame: 0 | 1 } {
  const T = numeric.smokeThreshold;
  const G = numeric.gasThreshold;
  const H = numeric.tempThreshold;
  const b = unit.base;

  switch (unit.phase) {
    case "cooking":
      // Smoke well over the threshold band start, but nothing corroborates it.
      return { temp: b.temp + 4, humidity: b.humidity + 6, smoke: 1.35 * T, gas: b.gas + 0.15 * G, flame: 0 };
    case "heat":
      // Hot, dry afternoon — temperature alone stays below the alert line.
      return { temp: H + 8, humidity: Math.max(20, b.humidity - 18), smoke: b.smoke, gas: b.gas, flame: 0 };
    case "smoulder":
      return { temp: H + 5, humidity: 28, smoke: 1.9 * T, gas: 0.75 * G, flame: 0 };
    case "gas-leak":
      return { temp: b.temp + 1, humidity: b.humidity, smoke: b.smoke, gas: 1.75 * G, flame: 0 };
    case "fire":
      // The IR sensor only sees flame once the fire has developed — smoke and
      // heat lead by a few frames, which is also what makes the escalation
      // from an Important smoke alert to a Critical fire alert visible.
      return {
        temp: H + 30,
        humidity: 18,
        smoke: 3 * T,
        gas: 1.4 * G,
        flame: unit.cur.smoke > 1.5 * T ? 1 : 0,
      };
    case "recovery":
      // Cooling down from a fire: the flame stays visible until the smoke has
      // mostly cleared. Dropping it first would flip the alert kind from
      // "fire" to "smoke" while the readings are still above the alert line,
      // and the de-duplication rule would (correctly) raise a fresh alert for
      // what is in fact the same incident winding down.
      return { ...b, flame: unit.cur.flame === 1 && unit.cur.smoke > 1.5 * T ? 1 : 0 };
    case "normal":
    default:
      return { ...b, flame: 0 };
  }
}

function durationFor(phase: SimPhase): number {
  switch (phase) {
    case "normal":
      return rnd(4 * MIN, 15 * MIN);
    case "cooking":
      return rnd(40 * SEC, 90 * SEC);
    case "heat":
      return rnd(60 * SEC, 120 * SEC);
    case "smoulder":
    case "gas-leak":
    case "fire":
      // Kept under the 60s de-duplication window so an incident normally
      // produces one alert (plus its escalation), not a string of repeats.
      return rnd(30 * SEC, 60 * SEC);
    case "recovery":
      return rnd(60 * SEC, 90 * SEC);
  }
}

function pickIncident(weights: Record<Incident, number>): Incident {
  const entries = Object.entries(weights) as [Incident, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [phase, w] of entries) {
    roll -= w;
    if (roll <= 0) return phase;
  }
  return entries[entries.length - 1][0];
}

function nextPhase(unit: SimUnit): SimPhase {
  switch (unit.phase) {
    case "normal": {
      if (unit.opening) {
        const scripted = unit.opening;
        unit.opening = null;
        return scripted;
      }
      return pickIncident(unit.weights);
    }
    case "smoulder":
      // Half the smoulders are caught in time; the rest break into flame.
      return Math.random() < 0.5 ? "fire" : "recovery";
    case "recovery":
      return "normal";
    default:
      return "recovery";
  }
}

function enterPhase(unit: SimUnit, phase: SimPhase, now: number, duration = durationFor(phase)) {
  const from = unit.phase;
  unit.phase = phase;
  unit.phaseUntil = now + duration;
  if (from !== phase && !(from === "recovery" && phase === "normal")) {
    logger.info(
      `Simulator ${unit.deviceCode}${unit.label ? ` (${unit.label})` : ""}: ${from} → ${phase} for ${Math.round(duration / SEC)}s`,
    );
  }
}

/** Advances one unit by one tick and returns the frame it "transmitted". */
function step(unit: SimUnit, now: number): ISensorData {
  if (now >= unit.phaseUntil) enterPhase(unit, nextPhase(unit), now);

  // Slow drift of the room's own baseline, so "normal" is not a flat line.
  unit.base.temp = Math.min(38, Math.max(20, unit.base.temp + noise() * 0.05));
  unit.base.humidity = Math.min(85, Math.max(30, unit.base.humidity + noise() * 0.15));

  const target = targetFor(unit);
  // Incidents build quickly; cooling off is slower.
  const rate = unit.phase === "recovery" ? 0.18 : 0.3;

  const T = numeric.smokeThreshold;
  const G = numeric.gasThreshold;
  const c = unit.cur;

  c.temp = approach(c.temp, target.temp, rate) + noise() * 0.4;
  c.humidity = approach(c.humidity, target.humidity, rate) + noise() * 1;
  c.smoke = Math.max(0, approach(c.smoke, target.smoke, rate) + noise() * 0.03 * T);
  c.gas = Math.max(0, approach(c.gas, target.gas, rate) + noise() * 0.03 * G);
  c.flame = target.flame;

  unit.frames += 1;

  return {
    deviceCode: unit.deviceCode,
    temp: round(c.temp),
    humidity: round(c.humidity),
    smoke: round(c.smoke, 0),
    gas: round(c.gas, 0),
    gasType:
      unit.phase === "gas-leak"
        ? "LPG"
        : unit.phase === "fire"
          ? "Combustible"
          : c.smoke > T
            ? "Smoke particulate"
            : "Normal",
    fire: c.flame,
  };
}

// ─── Device selection ────────────────────────────────────────────────────────

interface Candidate {
  deviceCode: string;
  label: string | null;
}

/**
 * DEVICE_SIMULATOR_DEVICES names units explicitly. Otherwise the first
 * DEVICE_SIMULATOR_COUNT active units of the best-covered station are used —
 * the same station a fresh console adopts on first load, so a visitor lands
 * on live data without touching Settings.
 */
async function selectDevices(): Promise<Candidate[]> {
  const explicit = (env.DEVICE_SIMULATOR_DEVICES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (explicit.length) {
    const found = await Device.find({ deviceCode: { $in: explicit } })
      .select("deviceCode label")
      .lean();
    const byCode = new Map(found.map((d) => [d.deviceCode, d]));
    const missing = explicit.filter((c) => !byCode.has(c));
    if (missing.length) {
      logger.warn(`Simulator: unknown device code(s) ignored — ${missing.join(", ")}`);
    }
    return explicit
      .filter((c) => byCode.has(c))
      .map((c) => ({ deviceCode: c, label: byCode.get(c)!.label ?? null }));
  }

  const all = await Device.find({ status: "active" })
    .sort({ deviceCode: 1 })
    .select("deviceCode label stationId")
    .lean();

  const byStation = new Map<string, Candidate[]>();
  for (const d of all) {
    const key = String(d.stationId ?? "");
    const list = byStation.get(key) ?? [];
    list.push({ deviceCode: d.deviceCode, label: d.label ?? null });
    byStation.set(key, list);
  }

  const best = [...byStation.values()].sort((a, b) => b.length - a.length)[0] ?? [];
  return best.slice(0, numeric.simulatorCount);
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

const enabled = env.DEVICE_SIMULATOR === "true";
const intervalMs = numeric.simulatorIntervalMs;
/** Store roughly one frame every 10s per unit while quiet; every frame during an incident. */
const persistEvery = Math.max(1, Math.round((10 * SEC) / intervalMs));

let units: SimUnit[] = [];
let timer: NodeJS.Timeout | null = null;
let retryTimer: NodeJS.Timeout | null = null;
let ticking = false;
let totalFrames = 0;
let lastFrameAt: Date | null = null;

async function tick(): Promise<void> {
  if (ticking) return;
  ticking = true;

  const now = Date.now();

  const results = await Promise.allSettled(
    units.map((unit) => {
      const frame = step(unit, now);
      const persist = unit.phase !== "normal" || unit.frames % persistEvery === 0;
      return ingestReading(frame, { persist });
    }),
  );

  totalFrames += units.length;
  lastFrameAt = new Date();

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      logger.error(`Simulator frame from ${units[i].deviceCode} failed`, r.reason);
    } else if (r.value.alertCreated) {
      logger.info(
        `Simulator ${units[i].deviceCode}: alert ${r.value.alertId} raised (risk ${r.value.riskScore})`,
      );
    }
  });

  ticking = false;
}

export async function startSimulator(): Promise<void> {
  if (!enabled || timer) return;

  let devices: Candidate[];
  try {
    devices = await selectDevices();
  } catch (err) {
    logger.error("Simulator: could not load devices", err);
    devices = [];
  }

  if (!devices.length) {
    logger.warn(
      "Simulator: no active devices in the database yet — run `npm run seed`. Retrying in 60s.",
    );
    retryTimer = setTimeout(() => void startSimulator(), 60 * SEC);
    return;
  }

  const now = Date.now();
  units = devices.map((d, i) => {
    const { base, weights } = profileFor(d.label);
    const unit: SimUnit = {
      deviceCode: d.deviceCode,
      label: d.label,
      base: { ...base },
      cur: { ...base, flame: 0 },
      phase: "normal",
      phaseUntil: 0,
      frames: 0,
      weights,
      opening: OPENING[i % OPENING.length],
    };
    // Stagger the scripted openings a minute apart so the first alert lands
    // within a minute of boot and the units do not all fire together.
    enterPhase(unit, "normal", now, 40 * SEC + i * 60 * SEC + rnd(0, 20 * SEC));
    return unit;
  });

  logger.info(
    `Device simulator: ${units.length} synthetic OGNIBORMO unit(s) reporting every ${intervalMs}ms — ${units.map((u) => u.deviceCode).join(", ")}`,
  );

  timer = setInterval(() => void tick(), intervalMs);
  void tick();
}

export function stopSimulator(): void {
  if (timer) clearInterval(timer);
  if (retryTimer) clearTimeout(retryTimer);
  timer = null;
  retryTimer = null;
  units = [];
}

export function getSimulatorStatus(): SimulatorStatus {
  return {
    enabled,
    running: timer !== null,
    intervalMs,
    frames: totalFrames,
    lastFrameAt: lastFrameAt?.toISOString() ?? null,
    units: units.map((u) => ({
      deviceCode: u.deviceCode,
      label: u.label,
      phase: u.phase,
    })),
  };
}
