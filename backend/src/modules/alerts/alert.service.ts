import { io } from "../../config/socket.js";
import {
  repoCreateAlert,
  repoGetAllAlerts,
  repoGetAlertById,
  repoGetAlertsByType,
} from "./alert.repository.js";
import { AlertResponse, mapAlerts, toAlertResponse } from "./alert.types.js";

function randomUttaraCoordinates(): string {
  const minLat = 23.85;
  const maxLat = 23.88;
  const minLng = 90.38;
  const maxLng = 90.41;

  const lat = Math.random() * (maxLat - minLat) + minLat;
  const lng = Math.random() * (maxLng - minLng) + minLng;

  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

interface CreateAlertParams {
  type: string;
  deviceCode: string;
  apiKey: string;
  buildingId: string;
  stationId: string;
  firmwareVersion: string;
  ipAddress: string;
  location: string;
  coordinates: string;
  smoke: number;
  gas: number;
  gasType: string;
  fire: number;
  temp: number;
  humidity: number;
  reportedBy: string;
  contactNumber: string;
  affectedArea: string;
  estimatedPeople: number;
  sector: string;
  building: string;
  floor: number;
  room: string;
}

export async function createAlert(
  params: CreateAlertParams,
): Promise<AlertResponse> {
  let priority: "critical" | "important" | "info" = "info";

  if (params.fire === 1) priority = "critical";
  else if (params.smoke > 100) priority = "important";
  else if (params.smoke > 80) priority = "info";

  const title =
    params.fire === 1
      ? "🔥 Fire Detected"
      : params.smoke > 70
        ? "💨 Smoke Detected"
        : "⚠️ Sensor Alert";

  const message =
    `Device ${params.deviceCode} reported ${params.fire === 1 ? "FIRE" : "SMOKE"} condition.\n` +
    `Smoke: ${params.smoke}\n` +
    `Temp: ${params.temp}°C\n` +
    `Humidity: ${params.humidity}%`;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const counter = String(Math.floor(Math.random() * 900 + 100));
  const incidentId = `INC-${year}-${month}${day}-${counter}`;

  const payload = {
    type: params.type,
    priority,
    title,
    message,

    location: params.location,

    coordinates: randomUttaraCoordinates(),

    reportedBy: params.reportedBy,
    contactNumber: params.contactNumber,
    affectedArea: params.affectedArea,
    estimatedPeople: params.estimatedPeople,

    incident: incidentId,

    temperature: params.temp.toString(),
    smokeLevel: params.smoke,
    gas: params.gas,
    gasType: params.gasType,

    deviceId: params.deviceCode,

    building: params.building,
    sector: params.sector,
    floor: params.floor,
    room: params.room,

    status: "active" as const,
    timestamp: new Date(),
  };

  const alert = await repoCreateAlert(payload);

  if (io) {
    io.emit("alert:new", toAlertResponse(alert));
  }

  return toAlertResponse(alert);
}

export async function getAllAlerts(): Promise<AlertResponse[]> {
  const alerts = await repoGetAllAlerts();
  return mapAlerts(alerts);
}

export async function getSingleAlert(
  id: string,
): Promise<AlertResponse | null> {
  const alert = await repoGetAlertById(id);
  if (!alert) return null;
  return toAlertResponse(alert);
}

export async function getAlertsByType(
  priority: string,
): Promise<AlertResponse[]> {
  const alerts = await repoGetAlertsByType(priority);
  return mapAlerts(alerts);
}
