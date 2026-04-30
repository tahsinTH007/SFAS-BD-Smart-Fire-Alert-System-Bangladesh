import { DeviceStatus, UnitStatus, UnitType, OccupancyType } from "../types";

// Device Status Configuration
export const DEVICE_STATUS_CONFIG: Record<
  DeviceStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  active: {
    label: "Active",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  maintenance: {
    label: "Maintenance",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  offline: {
    label: "Offline",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
  },
  error: {
    label: "Error",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
};

// Unit Status Configuration
export const UNIT_STATUS_CONFIG: Record<
  UnitStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  available: {
    label: "Available",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  busy: {
    label: "Busy",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
  maintenance: {
    label: "Maintenance",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
  out_of_service: {
    label: "Out of Service",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
  },
};

// Unit Type Configuration
export const UNIT_TYPE_CONFIG: Record<
  UnitType,
  { label: string; icon: string }
> = {
  engine: { label: "Engine", icon: "🚒" },
  ladder: { label: "Ladder", icon: "🪜" },
  foam: { label: "Foam Tender", icon: "🧯" },
  rescue: { label: "Rescue", icon: "🚑" },
  ambulance: { label: "Ambulance", icon: "🚑" },
  command: { label: "Command", icon: "📡" },
};

// Occupancy Type Configuration
export const OCCUPANCY_TYPE_CONFIG: Record<
  OccupancyType,
  { label: string; icon: string }
> = {
  Residential: { label: "Residential", icon: "🏠" },
  Commercial: { label: "Commercial", icon: "🏢" },
  Mixed: { label: "Mixed Use", icon: "🏗️" },
  Industrial: { label: "Industrial", icon: "🏭" },
  Educational: { label: "Educational", icon: "🏫" },
  Healthcare: { label: "Healthcare", icon: "🏥" },
};
