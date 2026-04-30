import { Types } from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { DeviceInput, DeviceInputRepo } from "./device.types.js";

async function generateHashApiKey() {
  const apiKey = "sfas_" + crypto.randomBytes(32).toString("hex");
  const Hash = await bcrypt.hash(apiKey, 12);

  return Hash;
}

export async function prepareDeviceForDb(
  input: DeviceInput,
): Promise<{ device: DeviceInputRepo }> {
  const buildingId = Types.ObjectId.isValid(input.buildingId)
    ? new Types.ObjectId(input.buildingId)
    : null;

  if (!buildingId) {
    throw new Error("Invalid buildingId");
  }

  const apiKeyHash = await generateHashApiKey();

  const stationId = Types.ObjectId.isValid(input.stationId)
    ? new Types.ObjectId(input.stationId)
    : null;

  if (!stationId) {
    throw new Error("Invalid stationId");
  }

  let coordinates: [number, number] | null = null;

  if (
    Array.isArray(input.coordinates) &&
    input.coordinates.length === 2 &&
    !isNaN(Number(input.coordinates[0])) &&
    !isNaN(Number(input.coordinates[1]))
  ) {
    coordinates = [Number(input.coordinates[0]), Number(input.coordinates[1])];
  }

  if (!coordinates) {
    throw new Error("Invalid coordinates");
  }

  const device = {
    deviceCode: input.deviceCode.trim(),

    apiKeyHash,

    buildingId,
    stationId,

    floor: input.floor,
    room: input.room ?? null,

    status: input.status ?? "active",
    firmwareVersion: input.firmwareVersion ?? "1.0.0",

    lastSeenAt: input.lastSeenAt ? new Date(input.lastSeenAt) : undefined,

    lastHeartbeatAt: input.lastHeartbeatAt
      ? new Date(input.lastHeartbeatAt)
      : undefined,

    lastSensorData: {
      temperature: input.temperature ?? 0,
      smokeLevel: input.smokeLevel ?? 0,
      gasLevel: input.gasLevel ?? 0,
    },

    location: {
      type: "Point",
      coordinates,
    },

    ipAddress: input.ipAddress ?? null,

    installedAt: input.installedAt ? new Date(input.installedAt) : undefined,
  };

  return {
    device,
  };
}
