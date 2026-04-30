import { Flame, AlertTriangle, Info } from "lucide-react";
import { Priority } from "../types/mapAlert";

interface PriorityMeta {
  label: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
  badge: string;
  markerColor: string;
  markerGlow: string;
  outerRing: string;
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  critical: {
    label: "Critical",
    icon: Flame,
    color: "text-red-400",
    bg: "bg-red-950/70",
    border: "border-red-800/50",
    badge: "bg-red-600 text-white",
    markerColor: "#ef4444",
    markerGlow: "#ef4444",
    outerRing: "#991b1b",
  },
  important: {
    label: "Important",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-950/60",
    border: "border-amber-800/40",
    badge: "bg-amber-600 text-white",
    markerColor: "#f59e0b",
    markerGlow: "#f59e0b",
    outerRing: "#92400e",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-950/50",
    border: "border-sky-800/40",
    badge: "bg-sky-600 text-white",
    markerColor: "#38bdf8",
    markerGlow: "#38bdf8",
    outerRing: "#0369a1",
  },
} as const;

export const UNIT_STATUS_COLORS: Record<string, string> = {
  on_scene: "text-emerald-400",
  en_route: "text-amber-400",
  standby: "text-sky-400",
  returned: "text-slate-400",
};
