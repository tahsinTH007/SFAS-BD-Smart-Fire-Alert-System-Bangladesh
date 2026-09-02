import "dotenv/config";

import { connectDB } from "../db/index.js";
import { logger } from "../lib/logger.js";
import { Device } from "../db/models/device.model.js";
import { ingestReading } from "../modules/sensors/sensor.service.js";
import type { ISensorData } from "../modules/sensors/sensor.types.js";

/**
 * Drives the real ingest pipeline with synthetic OGNIBORMO frames, so the
 * dashboard can be demonstrated without an Arduino attached.
 *
 *   npm run simulate              # continuous, mostly-normal readings
 *   npm run simulate -- --burst   # one round of incidents, then exit
 *
 * Note this posts through `ingestReading` directly, so it needs the API process
 * running only if you want the socket broadcasts to reach a browser.
 */

const BURST = process.argv.includes("--burst");
const INTERVAL_MS = 4000;

type Scenario = "normal" | "smoulder" | "gas-leak" | "fire";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(base: number, spread: number): number {
  return +(base + (Math.random() - 0.5) * spread).toFixed(2);
}

/** Builds a frame matching the scenario's physical signature. */
function frameFor(deviceCode: string, scenario: Scenario): ISensorData {
  switch (scenario) {
    case "fire":
      // Flame + heavy smoke + heat: every sensor agrees.
      return {
        deviceCode,
        temp: jitter(78, 20),
        humidity: jitter(18, 6),
        smoke: jitter(240, 60),
        gas: jitter(410, 80),
        gasType: "Combustible",
        fire: 1,
      };

    case "smoulder":
      // Smoke and warmth, no visible flame yet — the early-warning case.
      return {
        deviceCode,
        temp: jitter(54, 8),
        humidity: jitter(28, 6),
        smoke: jitter(150, 40),
        gas: jitter(180, 60),
        gasType: "Smoke particulate",
        fire: 0,
      };

    case "gas-leak":
      // Gas alone: dangerous, but not a fire signature.
      return {
        deviceCode,
        temp: jitter(31, 3),
        humidity: jitter(55, 8),
        smoke: jitter(20, 15),
        gas: jitter(520, 90),
        gasType: "LPG",
        fire: 0,
      };

    default:
      return {
        deviceCode,
        temp: jitter(30, 5),
        humidity: jitter(58, 10),
        smoke: jitter(25, 20),
        gas: jitter(90, 50),
        gasType: "Normal",
        fire: 0,
      };
  }
}

async function main() {
  await connectDB();

  const devices = await Device.find({ status: "active" }).lean();
  if (!devices.length) {
    logger.error("No devices found. Run `npm run seed` first.");
    process.exit(1);
  }

  const codes = devices.map((d) => d.deviceCode);
  logger.info(`Simulating ${codes.length} OGNIBORMO units…`);

  if (BURST) {
    const scenarios: Scenario[] = ["fire", "smoulder", "gas-leak", "normal"];
    for (let i = 0; i < codes.length; i++) {
      const scenario = scenarios[i % scenarios.length];
      const result = await ingestReading(frameFor(codes[i], scenario));
      logger.info(
        `${codes[i]} [${scenario}] risk=${result.riskScore} alert=${result.alertCreated}`,
      );
    }
    logger.info("Burst complete.");
    process.exit(0);
  }

  // Continuous mode: mostly normal, with an occasional incident.
  setInterval(async () => {
    const deviceCode = pick(codes);
    const roll = Math.random();
    const scenario: Scenario =
      roll > 0.94 ? "fire" : roll > 0.85 ? "smoulder" : roll > 0.78 ? "gas-leak" : "normal";

    try {
      const result = await ingestReading(frameFor(deviceCode, scenario));
      const flag = result.alertCreated ? " → ALERT" : "";
      logger.info(
        `${deviceCode} [${scenario}] risk=${result.riskScore}${flag}`,
      );
    } catch (err) {
      logger.error("Simulation frame failed", err);
    }
  }, INTERVAL_MS);

  logger.info(`Emitting a frame every ${INTERVAL_MS}ms. Ctrl+C to stop.`);
}

main().catch((err) => {
  logger.error("Simulator failed", err);
  process.exit(1);
});
