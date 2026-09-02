import { Flame, AlertTriangle, Info } from "lucide-react";
import { Priority } from "../types/notification";

export interface PriorityMeta {
  label: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
  badge: string;
  barColor: string;
  dotColor: string;
  glow: string;
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  critical: {
    label: "Critical",
    icon: Flame,
    color: "text-red-400",
    bg: "bg-red-950/60",
    border: "border-red-800/50",
    badge: "bg-red-600 text-white hover:bg-red-600",
    barColor: "bg-red-500",
    dotColor: "bg-red-500",
    glow: "shadow-red-900/40",
  },
  important: {
    label: "Important",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800/40",
    badge: "bg-amber-600 text-white hover:bg-amber-600",
    barColor: "bg-amber-500",
    dotColor: "bg-amber-500",
    glow: "shadow-amber-900/40",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-950/30",
    border: "border-sky-800/40",
    badge: "bg-sky-700 text-white hover:bg-sky-700",
    barColor: "bg-sky-500",
    dotColor: "bg-sky-500",
    glow: "shadow-sky-900/40",
  },
} as const;
