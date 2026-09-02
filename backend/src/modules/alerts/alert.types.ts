// ─── Domain model (internal, hydrated from DB) ────────────────────────────────

export interface AlertComment {
  author: string;
  body: string;
  createdAt: string;
}

export type Alert = {
  id: string;
  type: string;
  priority: "critical" | "important" | "info";
  title: string;
  message: string;
  location: string | null;
  reportedBy: string | null;
  contactNumber: string | null;
  /** [lat, lng] tuple */
  coordinates: [number, number];
  /** Human-friendly relative time, e.g. "12 min ago". */
  timestamp: string | null;
  /** Machine-readable original, for charts and sorting on the client. */
  timestampISO: string | null;
  createdAt: string | null;
  read: boolean;
  acknowledged: boolean;

  // Sensor snapshot
  smokeLevel: number;
  gas: number;
  gasType: string | null;
  humidity: number | null;
  flame: number;
  temperature: string | null;
  riskScore: number;
  riskFactors: string[];

  status: "active" | "acknowledged" | "resolved";
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
};

/** Outbound API shape. Identical to the domain model today. */
export type AlertResponse = Alert;

export interface AlertQuery {
  page: number;
  limit: number;
  /** Scopes every read to one fire station's coverage area. */
  stationId?: string;
  priority?: string;
  status?: string;
  type?: string;
  deviceId?: string;
  building?: string;
  sector?: string;
  read?: boolean;
  acknowledged?: boolean;
  search?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function toAlertResponse(alert: Alert): AlertResponse {
  return alert;
}

export function mapAlerts(alerts: Alert[]): AlertResponse[] {
  return alerts;
}
