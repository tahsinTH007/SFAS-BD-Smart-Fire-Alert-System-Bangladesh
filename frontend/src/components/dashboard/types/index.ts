// Device Types
export type DeviceStatus = "active" | "maintenance" | "offline" | "error";

export interface DeviceLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Device {
  _id?: string;
  deviceCode: string;
  apiKeyHash: string;
  buildingId: string;
  stationId: string;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeenAt?: Date | string;
  location?: DeviceLocation;
  ipAddress?: string;
  installedAt?: Date | string;
}

// Building Types
export type OccupancyType =
  | "Residential"
  | "Commercial"
  | "Mixed"
  | "Industrial"
  | "Educational"
  | "Healthcare";
export type StructureType =
  | "Reinforced Concrete"
  | "Steel Frame"
  | "Brick"
  | "Wood"
  | "Mixed";

export interface Building {
  _id?: string;
  name: string;
  address?: string;
  sector: string;
  stationId: string;
  floors: number;
  estimatedPeople: number;
  structureType?: StructureType;
  occupancyType: OccupancyType;
  location?: DeviceLocation;
}

// Unit Types
export type UnitType =
  | "engine"
  | "ladder"
  | "foam"
  | "rescue"
  | "ambulance"
  | "command";
export type UnitStatus =
  | "available"
  | "busy"
  | "maintenance"
  | "out_of_service";

export interface Unit {
  _id?: string;
  unitCode: string;
  name?: string;
  type: UnitType;
  stationId?: string;
  status: UnitStatus;
  personnelCount?: number;
}

// Tab Type
export type DashboardTab = "devices" | "buildings" | "units";
