import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { initSerial, serialEvents } from "../../config/serial.js";
import { ingestReading } from "./sensor.service.js";
import type { ISensorData } from "./sensor.types.js";

/** Strips control characters the Arduino occasionally emits mid-frame. */
function clean(line: string): string {
  return line.replace(/[^\x20-\x7E]+/g, "").trim();
}

function parseFrame(line: string): ISensorData | null {
  if (env.SERIAL_DATA_FORMAT === "json") {
    try {
      return JSON.parse(line) as ISensorData;
    } catch {
      return null;
    }
  }

  if (env.SERIAL_DATA_FORMAT === "csv") {
    // deviceCode,temp,humidity,smoke,gas,flame
    const [deviceCode, temp, humidity, smoke, gas, fire] = line.split(",");
    if (!deviceCode) return null;
    return {
      deviceCode: deviceCode.trim(),
      temp: Number(temp),
      humidity: Number(humidity),
      smoke: Number(smoke),
      gas: Number(gas),
      fire: Number(fire),
    } as ISensorData;
  }

  return null;
}

export const initSensorListener = (): void => {
  if (env.SERIAL_ENABLED !== "true") {
    logger.info("Serial ingest disabled (SERIAL_ENABLED=false)");
    return;
  }

  serialEvents.on("line", async (raw: string) => {
    const line = clean(raw);
    if (!line) return;

    const frame = parseFrame(line);
    if (!frame) {
      logger.debug(`Unparsable serial frame: ${JSON.stringify(line)}`);
      return;
    }

    try {
      const result = await ingestReading(frame);
      if (result.alertCreated) {
        logger.info(`Alert ${result.alertId} raised from ${frame.deviceCode}`);
      }
    } catch (err) {
      logger.error("Sensor ingest failed", err);
    }
  });

  initSerial();
};
