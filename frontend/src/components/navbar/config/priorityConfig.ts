import { Priority } from "@/components/notifications/types/notification";

interface PriorityStyle {
  label: string;
  dot: string;
  badge: string;
  bar: string;
  glow: string;
  icon: string;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityStyle> = {
  critical: {
    label: "Critical",
    dot: "bg-red-600",
    badge: "bg-red-600/15 text-red-600 border-red-300 dark:border-red-900",
    bar: "bg-red-600",
    glow: "shadow-red-600/30",
    icon: "text-red-600",
  },
  important: {
    label: "Important",
    dot: "bg-orange-500",
    badge:
      "bg-orange-500/15 text-orange-600 border-orange-300 dark:border-orange-900",
    bar: "bg-orange-500",
    glow: "shadow-orange-500/30",
    icon: "text-orange-600",
  },
  info: {
    label: "Info",
    dot: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-600 border-blue-300 dark:border-blue-900",
    bar: "bg-blue-500",
    glow: "shadow-blue-500/30",
    icon: "text-blue-600",
  },
} as const;
