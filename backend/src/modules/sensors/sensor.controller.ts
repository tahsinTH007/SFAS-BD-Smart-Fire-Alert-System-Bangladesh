import { asyncHandler } from "../../lib/asyncHandler.js";
import { validate } from "../../lib/validation.js";
import { getSerialStatus, listSerialPorts } from "../../config/serial.js";
import { sensorReadingSchema } from "../devices/device.validator.js";
import { assessRisk } from "./riskEngine.js";
import { ingestReading } from "./sensor.service.js";

/**
 * HTTP ingest. The Arduino prototype uses the serial link; this is the path a
 * networked unit (ESP32) would use, and it makes the pipeline testable without
 * hardware attached.
 */
export const postReading = asyncHandler(async (req, res) => {
  const frame = validate(sensorReadingSchema, req.body);
  const result = await ingestReading(frame);

  res.status(result.accepted ? 201 : 400).json({
    success: result.accepted,
    data: result,
  });
});

/** Scores a reading without storing it — used by the dashboard's simulator. */
export const evaluateReading = asyncHandler(async (req, res) => {
  const frame = validate(sensorReadingSchema, req.body);
  const assessment = assessRisk(frame);
  res.json({ success: true, data: assessment });
});

export const serialStatus = asyncHandler(async (_req, res) => {
  const [status, ports] = await Promise.all([
    Promise.resolve(getSerialStatus()),
    listSerialPorts(),
  ]);
  res.json({ success: true, data: { ...status, availablePorts: ports } });
});
