import { serialParser } from "../../config/serial.js";
import { ISensorData } from "./sensor.types.js";
import { createAlert } from "../alerts/alert.service.js";

const deviceStateMap = new Map<
  string,
  {
    lastFire: number;
    lastSmoke: boolean;
  }
>();

// 🔥 MUST match Arduino threshold
const SMOKE_THRESHOLD = 80;

export const initSensorListener = () => {
  serialParser.on("data", async (data: string) => {
    try {
      const cleanData = data.replace(/[^\x20-\x7E]+/g, "").trim();
      if (!cleanData) return;

      let sensorData: ISensorData;

      try {
        sensorData = JSON.parse(cleanData);
      } catch (err) {
        console.error(
          "❌ Failed to parse JSON:",
          (err as Error).message,
          "| RAW:",
          JSON.stringify(data),
        );
        return;
      }

      const deviceCode = sensorData.deviceCode;

      const prev = deviceStateMap.get(deviceCode) ?? {
        lastFire: 0,
        lastSmoke: false,
      };

      let shouldAlert = false;
      let alertType: "fire" | "smoke" | null = null;

      // 🔥 FIRE → trigger on rising edge (0 → 1)
      if (sensorData.fire === 1 && prev.lastFire === 0) {
        shouldAlert = true;
        alertType = "fire";
      }

      // 💨 SMOKE → SAME LOGIC AS FIRE (NO COOLDOWN)
      const smokeDetected = sensorData.smoke > SMOKE_THRESHOLD;

      if (smokeDetected && !prev.lastSmoke) {
        shouldAlert = true;
        alertType = "smoke";
      }

      // 🚨 CREATE ALERT
      if (shouldAlert && alertType) {
        const alertPayload = {
          ...sensorData,
          type: alertType,
        };

        console.log("🚨 Creating alert:", alertPayload);

        const savedAlert = await createAlert(alertPayload);

        console.log("✅ Alert saved:", savedAlert);
      }

      // 🔄 UPDATE STATE
      deviceStateMap.set(deviceCode, {
        lastFire: sensorData.fire,
        lastSmoke: smokeDetected,
      });
    } catch (err) {
      console.error("❌ Serial listener error:", err);
    }
  });
};
