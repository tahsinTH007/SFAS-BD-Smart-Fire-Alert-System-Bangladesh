export const UNIT_STATUS_META = {
  on_scene: {
    label: "On Scene",
    color: "text-emerald-400",
    bg: "bg-emerald-950/50",
    border: "border-emerald-800/50",
    dot: "bg-emerald-500",
  },
  en_route: {
    label: "En Route",
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800/40",
    dot: "bg-amber-500",
  },
  standby: {
    label: "Standby",
    color: "text-sky-400",
    bg: "bg-sky-950/30",
    border: "border-sky-800/40",
    dot: "bg-sky-500",
  },
  returned: {
    label: "Returned",
    color: "text-slate-400",
    bg: "bg-slate-800/40",
    border: "border-slate-700/40",
    dot: "bg-slate-500",
  },
} as const;
