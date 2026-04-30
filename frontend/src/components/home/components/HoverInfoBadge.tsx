"use client";

import React from "react";
import { MapAlert } from "../types/mapAlert";
import { PRIORITY_META } from "../config/priorityMeta";
import { Badge } from "@/components/ui/badge";

interface HoverInfoBadgeProps {
  alert: MapAlert;
}

function getPriorityConfig(priority: string) {
  const normalized = (priority || "info").toLowerCase();

  return (
    PRIORITY_META[normalized as keyof typeof PRIORITY_META] ||
    PRIORITY_META["info"]
  );
}

export const HoverInfoBadge: React.FC<HoverInfoBadgeProps> = ({ alert }) => {
  const cfg = getPriorityConfig(alert.priority); // ✅ FIXED

  return (
    <div
      className="absolute bottom-6 right-6 z-10 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3"
      style={{
        borderLeftColor: cfg.markerColor,
        borderLeftWidth: "3px",
      }}
    >
      <Badge
        className={`${cfg.badge} text-[9px] px-2 py-0.5 rounded-full font-bold`}
      >
        {cfg.label}
      </Badge>

      {/* Title */}
      <span className="text-[12px] font-semibold text-slate-200">
        {alert.title.replace(/^[\u{1F300}-\u{1FFFF}]\s*/u, "")}
      </span>

      {/* Location */}
      <span className="text-[10px] text-slate-600">{alert.location}</span>
    </div>
  );
};
