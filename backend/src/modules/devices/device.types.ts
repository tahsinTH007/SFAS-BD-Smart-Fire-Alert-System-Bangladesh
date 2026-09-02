import { HydratedDocument, InferSchemaType, Types } from "mongoose";
import { DeviceSchema } from "../../db/models/device.model.js";

export type DeviceStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "compromised";

export type DeviceInput = {
  deviceCode: string;
  buildingId: string;
  stationId: string;
  floor: number;
  room?: string | null;
  label?: string | null;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeenAt?: string | null;
  lastHeartbeatAt?: string | null;
  temperature: number;
  humidity?: number;
  smokeLevel: number;
  gasLevel: number;
  /** [longitude, latitude] */
  coordinates: number[];
  ipAddress?: string | null;
  installedAt?: string | null;
};

export type DeviceInputRepo = {
  deviceCode: string;
  apiKeyHash: string;

  buildingId: Types.ObjectId;
  stationId: Types.ObjectId;

  status: DeviceStatus;
  firmwareVersion: string;

  floor: number;
  room?: string | null;
  label?: string | null;

  lastSeenAt?: Date | null;
  lastHeartbeatAt?: Date | null;

  lastSensorData?: {
    temperature: number;
    humidity: number;
    smokeLevel: number;
    gasLevel: number;
    flame: number;
    riskScore: number;
    readAt: Date | null;
  };

  location: {
    type?: string;
    coordinates: [number, number];
  };

  ipAddress?: string | null;
  installedAt?: Date | null;
};

export type DeviceSchemaType = InferSchemaType<typeof DeviceSchema>;
export type DeviceDocument = HydratedDocument<DeviceSchemaType>;

export type GetAllDevicesQuery = {
  page: number;
  limit: number;
  stationId?: string;
  search?: string;
  status?: DeviceStatus;
  buildingId?: string;
  floor?: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};
