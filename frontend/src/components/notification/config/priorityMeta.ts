import { Flame, AlertTriangle, Info } from "lucide-react";
import type { Priority } from "../types/notificationDetail";

export const PRIORITY_META = {
  critical: {
    label: "Critical",
    icon: Flame,
    color: "text-red-400",
    bg: "bg-red-950/60",
    border: "border-red-800/50",
    badge: "bg-red-600 text-white hover:bg-red-600",
    barColor: "bg-red-500",
    glow: "shadow-red-900/50",
    dotColor: "bg-red-500",
    heroGrad: "from-red-950/80 via-slate-950 to-slate-950",
    heroBorder: "border-red-900/40",
  },
  important: {
    label: "Important",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800/40",
    badge: "bg-amber-600 text-white hover:bg-amber-600",
    barColor: "bg-amber-500",
    glow: "shadow-amber-900/50",
    dotColor: "bg-amber-500",
    heroGrad: "from-amber-950/80 via-slate-950 to-slate-950",
    heroBorder: "border-amber-900/40",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-950/30",
    border: "border-sky-800/40",
    badge: "bg-sky-700 text-white hover:bg-sky-700",
    barColor: "bg-sky-500",
    glow: "shadow-sky-900/50",
    dotColor: "bg-sky-500",
    heroGrad: "from-sky-950/60 via-slate-950 to-slate-950",
    heroBorder: "border-sky-900/40",
  },
} as const;

export type PriorityMeta = (typeof PRIORITY_META)[Priority];
