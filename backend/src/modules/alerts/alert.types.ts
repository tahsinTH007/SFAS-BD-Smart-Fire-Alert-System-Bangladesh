// ─── Domain model (internal, hydrated from DB) ────────────────────────────────

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
  timestamp: string | null;
  read: boolean;
  acknowledged: boolean;
  smokeLevel: number;
  gas: number;
  gasType: string | null;
  status: "active" | "acknowledged" | "resolved";
  deviceId: string | null;
  sector: string | null;
  building: string | null;
  floor: string | null;
  incident: string | null;
  room: string | null;
  temperature: string | null;
  affectedArea: string | null;
  estimatedPeople: string | null;
};

// ─── Response shapes (outbound API) ───────────────────────────────────────────

export type AlertResponse = {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  location: string | null;
  reportedBy: string | null;
  contactNumber: string | null;
  coordinates: [number, number];
  timestamp: string | null;
  read: boolean;
  acknowledged: boolean;
  smokeLevel: number;
  gas: number;
  gasType: string | null;
  status: string;
  deviceId: string | null;
  sector: string | null;
  building: string | null;
  floor: string | null;
  room: string | null;
  temperature: string | null;
  affectedArea: string | null;
  estimatedPeople: string | null;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function toAlertResponse(alert: Alert): AlertResponse {
  return {
    id: alert.id,
    type: alert.type,
    priority: alert.priority,
    title: alert.title,
    message: alert.message,
    location: alert.location,
    reportedBy: alert.reportedBy,
    contactNumber: alert.contactNumber,
    coordinates: alert.coordinates,
    timestamp: alert.timestamp,
    read: alert.read,
    acknowledged: alert.acknowledged,
    smokeLevel: alert.smokeLevel,
    gas: alert.gas,
    gasType: alert.gasType,
    status: alert.status,
    deviceId: alert.deviceId,
    sector: alert.sector,
    building: alert.building,
    floor: alert.floor,
    room: alert.room,
    temperature: alert.temperature,
    affectedArea: alert.affectedArea,
    estimatedPeople: alert.estimatedPeople,
  };
}

export function mapAlerts(alerts: Alert[]): AlertResponse[] {
  return alerts.map(toAlertResponse);
}
