import { HydratedDocument, InferSchemaType, Types } from "mongoose";
import { DeviceSchema } from "../../db/models/device.model.js";

export type DeviceInput = {
  deviceCode: string;
  buildingId: string;
  stationId: string;
  floor: number;
  room?: string | null;
  status: "active" | "inactive" | "maintenance" | "compromised";
  firmwareVersion: string;
  lastSeenAt?: string | null;
  lastHeartbeatAt?: string | null;
  temperature: number;
  smokeLevel: number;
  gasLevel: number;
  coordinates: number[];
  ipAddress?: string | null;
  installedAt?: string | null;
};

export type DeviceInputRepo = {
  deviceCode: string;

  buildingId: Types.ObjectId;
  stationId: Types.ObjectId;

  status: "active" | "inactive" | "maintenance" | "compromised";
  firmwareVersion: string;

  floor: number;
  room?: string | null;

  lastSeenAt?: Date | null;
  lastHeartbeatAt?: Date | null;

  lastSensorData?: {
    temperature: number;
    smokeLevel: number;
    gasLevel: number;
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

export type DeviceResponse = {
  id: string;
  deviceCode: string;
  buildingId: string;
  stationId: string;
  status: string;
  firmwareVersion: string;
  floor: number;
  room?: string | null;
};

export type GetAllDevicesQuery = {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "inactive" | "maintenance" | "compromised";
  buildingId?: string;
  floor?: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};
