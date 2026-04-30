import React from "react";
import Link from "next/link";
import { Flame, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MapAlert, Priority } from "../types/mapAlert";
import { AlertListItem } from "./AlertListItem";
import { StatsPanel } from "./StatsPanel";
import { MapLegend } from "./MapLegend";

interface SidebarPanelProps {
  alerts: MapAlert[];
  criticalCount: number;
  importantCount: number;
  infoCount: number;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSidebarClick: (id: string) => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  alerts,
  criticalCount,
  importantCount,
  infoCount,
  hoveredId,
  onHover,
  onSidebarClick,
}) => {
  const alertCounts: Record<Priority, number> = {
    critical: alerts.filter((a) => a.priority === "critical").length,
    important: alerts.filter((a) => a.priority === "important").length,
    info: alerts.filter((a) => a.priority === "info").length,
  };

  return (
    <div className="w-80 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-950 border border-red-800/60 flex items-center justify-center">
            <Flame size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-100 tracking-tight">
              SFAS-BD
            </p>
            <p className="text-[9.5px] text-slate-600 uppercase tracking-widest">
              Smart Fire Alert System
            </p>
          </div>
        </div>
      </div>

      <Separator className="border-slate-800" />

      <StatsPanel
        criticalCount={criticalCount}
        importantCount={importantCount}
        infoCount={infoCount}
      />

      <MapLegend alertCounts={alertCounts} />

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-1.5">
          <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest">
            Live Alerts — click to locate
          </p>
        </div>
        <div className="flex flex-col gap-px">
          {alerts.map((alert) => (
            <AlertListItem
              key={alert.id}
              alert={alert}
              isHovered={hoveredId === alert.id}
              onHover={onHover}
              onSidebarClick={onSidebarClick}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-3">
        <Link
          href="/notifications"
          className="flex items-center justify-between text-[12px] text-slate-500 hover:text-slate-300 transition-colors group"
        >
          <span>View All Notifications</span>
          <ArrowRight
            size={13}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </div>
  );
};
