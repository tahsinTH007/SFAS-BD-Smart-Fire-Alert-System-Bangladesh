/**
 * Chart tokens for the SFAS-BD console.
 *
 * Colour decisions here were validated against the actual dark chart surface
 * (slate-900, #0f172a) rather than eyeballed.
 *
 * Why no stacked "alerts by priority" chart: critical(red) and important(amber)
 * are the classic deuteranopia confusion pair. Every red/amber/blue triple we
 * validated either fell outside the dark lightness band or failed CVD
 * separation (best case ΔE 4.4, hard floor 6). Rather than ship a chart whose
 * series a colourblind operator cannot separate — in a fire console — the trend
 * chart carries a single series and priority is broken out as icon + label +
 * value tiles, where colour is never the only channel.
 */

export const CHART = {
  surface: "#0f172a", // slate-900 — chart card
  plane: "#020617", // slate-950 — page
  inkPrimary: "#f8fafc", // slate-50
  inkSecondary: "#cbd5e1", // slate-300
  inkMuted: "#64748b", // slate-500
  gridline: "#1e293b", // slate-800
  baseline: "#334155", // slate-700

  /** Single categorical/series hue. Passes ≥3:1 on the surface above. */
  series: "#3987e5",
  seriesSoft: "rgba(57, 135, 229, 0.16)",
} as const;

/**
 * Sequential blue ramp, light → dark, for encoding magnitude (risk, alert
 * counts). One hue only — never a rainbow.
 */
export const SEQUENTIAL_BLUE = [
  "#cde2fb",
  "#9ec5f4",
  "#6da7ec",
  "#3987e5",
  "#2a78d6",
  "#256abf",
  "#184f95",
] as const;

/** Picks a ramp step for a 0..1 magnitude. */
export function rampStep(t: number): string {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  // Bias toward the darker half so mid values stay legible on a dark surface.
  const i = Math.round(2 + clamped * (SEQUENTIAL_BLUE.length - 3));
  return SEQUENTIAL_BLUE[i];
}

/**
 * Reserved status colours. These are UI state indicators, not chart series, and
 * are always shipped with an icon and a text label so hue never carries the
 * meaning on its own.
 */
export const STATUS = {
  critical: {
    hex: "#ef4444",
    label: "Critical",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  important: {
    hex: "#f59e0b",
    label: "Important",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  info: {
    hex: "#38bdf8",
    label: "Info",
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
} as const;

export type StatusKey = keyof typeof STATUS;

/** Risk band for a 0-100 fused score, matching the backend's thresholds. */
export function riskBand(score: number): {
  key: StatusKey;
  label: string;
  hex: string;
} {
  if (score >= 70) return { key: "critical", label: "Critical", hex: STATUS.critical.hex };
  if (score >= 40) return { key: "important", label: "Elevated", hex: STATUS.important.hex };
  return { key: "info", label: "Normal", hex: STATUS.info.hex };
}
