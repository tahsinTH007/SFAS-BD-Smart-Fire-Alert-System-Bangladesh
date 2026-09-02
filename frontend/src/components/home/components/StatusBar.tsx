"use client";

import React from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { selectActiveStation } from "@/redux/slices/sessionSlice";
import type { RootState } from "@/redux/store";

interface StatusBarProps {
  criticalCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ criticalCount }) => {
  // The station used to be hardcoded to "Dhaka Central — Unit #DC-01", which was
  // wrong on every console except that one.
  const station = useSelector(selectActiveStation);
  const lastSynced = useSelector((s: RootState) => s.alerts.lastSyncedAt);

  const alarm = criticalCount > 0;

  return (
    <div className="shrink-0 border-b border-slate-800 bg-slate-900 px-3 py-2 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5">
          {alarm ? (
            <Activity size={13} className="shrink-0 animate-pulse text-red-400" />
          ) : (
            <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
          )}
          <span
            className={`whitespace-nowrap text-[11px] font-bold uppercase tracking-widest ${
              alarm ? "text-red-400" : "text-emerald-500"
            }`}
          >
            {alarm ? (
              <>
                {criticalCount} critical
                <span className="hidden sm:inline"> alert{criticalCount > 1 ? "s" : ""}</span>
              </>
            ) : (
              "All clear"
            )}
          </span>
        </div>

        {/* Station identity — truncates rather than wrapping, so the bar keeps
            a single fixed row height for the map layout below. */}
        <span className="min-w-0 flex-1 truncate text-[11px] text-slate-600">
          {station ? (
            <>
              <span className="hidden sm:inline">Station: </span>
              {station.name}
              <span className="hidden md:inline"> — {station.stationCode}</span>
            </>
          ) : (
            "No station selected"
          )}
        </span>

        <span className="hidden shrink-0 text-[11px] text-slate-600 lg:inline">
          Last sync:{" "}
          <span className="text-slate-500">
            {lastSynced
              ? new Date(lastSynced).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </span>
      </div>
    </div>
  );
};
