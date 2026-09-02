import { Types } from "mongoose";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { BadRequestError } from "../../lib/error.js";
import type { DeviceInput, DeviceInputRepo } from "./device.types.js";

/**
 * Generates a device API key and its bcrypt hash.
 *
 * The previous version returned only the hash and discarded the plaintext, so
 * the generated key was unrecoverable and no device could ever authenticate
 * with it. The caller now receives both: the hash is stored, the plaintext is
 * shown to the operator once at creation time.
 */
export async function generateApiKey(): Promise<{
  apiKey: string;
  apiKeyHash: string;
}> {
  const apiKey = `sfas_${crypto.randomBytes(32).toString("hex")}`;
  const apiKeyHash = await bcrypt.hash(apiKey, 12);
  return { apiKey, apiKeyHash };
}

export async function verifyApiKey(
  apiKey: string,
  apiKeyHash: string,
): Promise<boolean> {
  return bcrypt.compare(apiKey, apiKeyHash);
}

export async function prepareDeviceForDb(input: DeviceInput): Promise<{
  device: DeviceInputRepo;
  apiKey: string;
}> {
  if (!Types.ObjectId.isValid(input.buildingId)) {
    throw new BadRequestError("Invalid buildingId");
  }
  if (!Types.ObjectId.isValid(input.stationId)) {
    throw new BadRequestError("Invalid stationId");
  }

  const [lng, lat] = input.coordinates ?? [];
  if (
    typeof lng !== "number" ||
    typeof lat !== "number" ||
    Number.isNaN(lng) ||
    Number.isNaN(lat)
  ) {
    throw new BadRequestError(
      "coordinates must be [longitude, latitude] numbers",
    );
  }

  const { apiKey, apiKeyHash } = await generateApiKey();

  const device: DeviceInputRepo = {
    deviceCode: input.deviceCode.trim(),
    apiKeyHash,

    buildingId: new Types.ObjectId(input.buildingId),
    stationId: new Types.ObjectId(input.stationId),

    floor: input.floor,
    room: input.room ?? null,
    label: input.label ?? null,

    status: input.status ?? "active",
    firmwareVersion: input.firmwareVersion ?? "1.0.0",

    lastSeenAt: input.lastSeenAt ? new Date(input.lastSeenAt) : undefined,
    lastHeartbeatAt: input.lastHeartbeatAt
      ? new Date(input.lastHeartbeatAt)
      : undefined,

    lastSensorData: {
      temperature: input.temperature ?? 0,
      humidity: input.humidity ?? 0,
      smokeLevel: input.smokeLevel ?? 0,
      gasLevel: input.gasLevel ?? 0,
      flame: 0,
      riskScore: 0,
      readAt: null,
    },

    location: {
      type: "Point",
      coordinates: [lng, lat],
    },

    ipAddress: input.ipAddress ?? null,
    installedAt: input.installedAt ? new Date(input.installedAt) : undefined,
  };

  return { device, apiKey };
}
