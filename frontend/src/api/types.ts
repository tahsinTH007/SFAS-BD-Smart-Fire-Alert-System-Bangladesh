export type Priority = "critical" | "important" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved";

export interface AlertComment {
  author: string;
  body: string;
  createdAt: string;
}

export interface AlertResponse {
  id: string;
  type: string;
  priority: Priority;
  title: string;
  message: string;

  location: string | null;
  reportedBy: string | null;
  contactNumber: string | null;
  coordinates: [number, number] | null;

  /** Human-friendly, e.g. "12 min ago". */
  timestamp: string | null;
  /** ISO original, for sorting and charts. */
  timestampISO: string | null;
  createdAt: string | null;

  read: boolean;
  acknowledged: boolean;
  status: AlertStatus;

  // Sensor snapshot at trigger time
  temperature: string | null;
  humidity: number | null;
  smokeLevel: number;
  gas: number;
  gasType: string | null;
  flame: number;
  riskScore: number;
  riskFactors: string[];

  deviceId: string | null;
  stationId: string | null;
  buildingId: string | null;
  sector: string | null;
  building: string | null;
  floor: string | null;
  room: string | null;
  incident: string | null;
  affectedArea: string | null;
  estimatedPeople: string | null;

  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  comments: AlertComment[];
}

export interface AlertStats {
  total: number;
  unread: number;
  unacknowledged: number;
  last24h: number;
  avgRiskScore: number;
  maxRiskScore: number;
  byPriority: Record<Priority, number>;
  byStatus: Record<AlertStatus, number>;
}

export interface TimeseriesPoint {
  bucket: string;
  critical: number;
  important: number;
  info: number;
}

export interface TopDevice {
  deviceCode: string;
  alerts: number;
  critical: number;
  avgRisk: number;
  lastAt: string;
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export type DeviceStatus =
  | "active"
  | "inactive"
  | "maintenance"
  | "compromised";

export interface DeviceReadings {
  temperature: number;
  humidity: number;
  smoke: number;
  gas: number;
  flame: number;
  riskScore: number;
  readAt: string | null;
}

export interface TelemetryDevice {
  id: string;
  deviceCode: string;
  label: string | null;
  building: string | null;
  sector: string | null;
  floor: number;
  room: string | null;
  status: DeviceStatus;
  online: boolean;
  lastSeenAt: string | null;
  readings: DeviceReadings;
}

export interface Device {
  _id: string;
  deviceCode: string;
  buildingId: { _id: string; name: string; address?: string; sector?: string } | string | null;
  stationId: string;
  floor: number;
  room: string | null;
  label: string | null;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeenAt: string | null;
  lastHeartbeatAt: string | null;
  lastSensorData?: DeviceReadings;
  location?: { type: string; coordinates: [number, number] };
  ipAddress: string | null;
  installedAt: string | null;
  online?: boolean;
  secondsSinceSeen?: number | null;
  createdAt?: string;
}

export interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  avgRiskScore: number;
  maxTemperature: number;
  byStatus: Record<DeviceStatus, number>;
}

export interface ReadingPoint {
  temperature: number;
  humidity: number;
  smoke: number;
  gas: number;
  flame: number;
  riskScore: number;
  riskFactors: string[];
  recordedAt: string;
}

// ─── Buildings ───────────────────────────────────────────────────────────────

export interface Building {
  _id: string;
  name: string;
  address: string;
  sector?: string;
  stationId: string;
  structureType?: string;
  floors: number;
  estimatedPeople: number;
  yearBuilt?: number;
  occupancyType: "residential" | "commercial";
  ownerName?: string;
  ownerContact?: string;
  location?: { type: string; coordinates: [number, number] };
  deviceCount?: number;
  createdAt?: string;
}

export interface BuildingStats {
  total: number;
  totalPeople: number;
  avgFloors: number;
  byOccupancy: Record<string, number>;
}

// ─── Stations ────────────────────────────────────────────────────────────────

export interface Station {
  _id: string;
  stationCode: string;
  name: string;
  district?: string;
  division?: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  commanderName?: string;
  status: "operational" | "limited" | "offline";
  location?: { type: string; coordinates: [number, number] };
  buildingCount?: number;
  deviceCount?: number;
}

// ─── Envelopes ───────────────────────────────────────────────────────────────

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
}

export interface RiskAssessment {
  score: number;
  factors: string[];
  priority: Priority;
  kind: "fire" | "smoke" | "gas" | "heat" | "normal";
  summary: string;
}

export interface SerialStatus {
  connected: boolean;
  path: string;
  baudRate: number;
  lastLineAt: string | null;
  lastError: string | null;
  availablePorts: { path: string; manufacturer: string | null }[];
}

export interface HealthReport {
  status: string;
  ts: string;
  app: string;
  env: string;
  dependencies: {
    mongodb: { required: boolean; up: boolean };
    redis: { required: boolean; up: boolean };
    serial: { required: boolean; up: boolean; port: string; lastLineAt: string | null };
  };
}
