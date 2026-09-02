export type DashboardTab =
  | "overview"
  | "telemetry"
  | "devices"
  | "buildings"
  | "stations";

export type {
  Building,
  BuildingStats,
  Device,
  DeviceStats,
  DeviceStatus,
  ReadingPoint,
  Station,
  TelemetryDevice,
} from "@/api/types";
