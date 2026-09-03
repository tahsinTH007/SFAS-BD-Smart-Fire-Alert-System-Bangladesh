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

// ─── Units & dispatch ────────────────────────────────────────────────────────

export type UnitType =
  | "engine"
  | "ladder"
  | "rescue"
  | "medic"
  | "foam"
  | "water_tender"
  | "command";

export type UnitStatus =
  | "available"
  | "dispatched"
  | "on_scene"
  | "returning"
  | "maintenance"
  | "off_duty";

export type CrewRole =
  | "officer"
  | "driver"
  | "firefighter"
  | "paramedic"
  | "technician"
  | "rescuer";

export interface CrewMember {
  _id?: string;
  name: string;
  rank: string;
  role: CrewRole;
  phone: string | null;
  bloodGroup: string | null;
  certifications: string[];
  yearsOfService: number;
  onDuty: boolean;
}

export interface RouteEstimate {
  distanceKm: number;
  etaMinutes: number;
  source: "estimate" | "osrm";
  geometry: [number, number][];
  basis: string;
}

export interface Unit {
  _id: string;
  unitCode: string;
  name: string;
  type: UnitType;
  stationId: string;
  status: UnitStatus;
  crew: CrewMember[];
  crewTotal: number;
  crewOnDuty: number;
  assignable: boolean;
  registration: string | null;
  waterCapacityL: number;
  ladderReachM: number;
  location?: { type: string; coordinates: [number, number] };
  currentAlertId?:
    | { _id: string; title: string; priority: string; location: string; incident: string; status: string }
    | string
    | null;
  dispatchedAt: string | null;
  note: string | null;
  /** Only present on the dispatch recommendation endpoint. */
  route?: RouteEstimate | null;
  recommended?: boolean;
}

export interface UnitStats {
  total: number;
  available: number;
  dispatched: number;
  onScene: number;
  returning: number;
  maintenance: number;
  offDuty: number;
  byType: Record<string, number>;
  crew: { total: number; onDuty: number };
}

export type DispatchStatus =
  | "assigned"
  | "en_route"
  | "on_scene"
  | "cleared"
  | "cancelled";

export interface DispatchRecord {
  _id: string;
  alertId: string | { _id: string; title: string; priority: string; location: string; incident: string; coordinates?: [number, number] };
  unitId: string | Pick<Unit, "_id" | "unitCode" | "name" | "type" | "status" | "crew" | "location">;
  status: DispatchStatus;
  dispatchedBy: string;
  distanceKm: number | null;
  etaMinutes: number | null;
  routeSource: "estimate" | "osrm";
  routeGeometry: [number, number][];
  assignedAt: string;
  enRouteAt: string | null;
  arrivedAt: string | null;
  clearedAt: string | null;
  note: string | null;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AreaStat {
  area: string;
  total: number;
  critical: number;
  important: number;
  avgRisk: number;
  buildingCount: number;
  lastAt: string;
}

export interface BuildingStat {
  building: string;
  sector?: string;
  total: number;
  critical: number;
  avgRisk: number;
  lastAt: string;
}

export interface TypeStat {
  type: string;
  total: number;
  critical: number;
  avgRisk: number;
}

export interface CauseStat {
  factor: string;
  label: string;
  total: number;
  critical: number;
}

export interface HourStat {
  hour: number;
  total: number;
  critical: number;
}

export interface DeviceStat {
  deviceCode: string;
  building?: string;
  total: number;
  critical: number;
  resolved: number;
  avgRisk: number;
  lastAt: string;
}

export interface ResponseMetrics {
  acknowledged: number;
  avgAckMinutes: number | null;
  slowestAckMinutes: number | null;
  resolvedCount: number;
  avgResolveMinutes: number | null;
  dispatchesArrived: number;
  avgActualTravelMinutes: number | null;
  avgEstimatedEtaMinutes: number | null;
  avgDistanceKm: number | null;
}

export interface AnalyticsSummary {
  days: number;
  areas: AreaStat[];
  buildings: BuildingStat[];
  types: TypeStat[];
  causes: CauseStat[];
  hourly: HourStat[];
  devices: DeviceStat[];
  response: ResponseMetrics;
}
