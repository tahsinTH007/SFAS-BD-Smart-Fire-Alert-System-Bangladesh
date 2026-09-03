"use client";

import React from "react";
import {
  Activity,
  Building2,
  ChartColumn,
  Cpu,
  LayoutGrid,
  Radio,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardTab } from "../types";

interface TabNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  counts: {
    devices: number;
    buildings: number;
    stations: number;
    telemetry: number;
    units: number;
  };
}

const TABS: {
  key: DashboardTab;
  label: string;
  icon: LucideIcon;
  countKey?: keyof TabNavProps["counts"];
}[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "units", label: "Units & Crew", icon: Truck, countKey: "units" },
  { key: "summary", label: "Summary", icon: ChartColumn },
  { key: "telemetry", label: "Live Sensors", icon: Activity, countKey: "telemetry" },
  { key: "devices", label: "Devices", icon: Cpu, countKey: "devices" },
  { key: "buildings", label: "Buildings", icon: Building2, countKey: "buildings" },
  { key: "stations", label: "Stations", icon: Radio, countKey: "stations" },
];

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => (
  <div
    role="tablist"
    aria-label="Dashboard sections"
    className="sfas-scroll flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-1"
  >
    {TABS.map(({ key, label, icon: Icon, countKey }) => {
      const active = activeTab === key;
      const count = countKey ? counts[countKey] : undefined;

      return (
        <button
          key={key}
          role="tab"
          aria-selected={active}
          onClick={() => onTabChange(key)}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:px-4",
            active
              ? "bg-slate-800 text-slate-50 shadow-sm"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
          )}
        >
          <Icon size={14} className={active ? "text-orange-400" : ""} />
          <span>{label}</span>
          {count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                active
                  ? "bg-slate-700 text-slate-200"
                  : "bg-slate-800 text-slate-500",
              )}
            >
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
