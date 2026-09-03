export type DashboardTab =
  | "overview"
  | "units"
  | "summary"
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
  Unit,
  UnitStats,
  DispatchRecord,
  AnalyticsSummary,
} from "@/api/types";
