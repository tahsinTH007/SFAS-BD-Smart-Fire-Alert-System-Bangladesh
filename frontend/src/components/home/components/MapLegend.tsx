import React from "react";
import { Priority } from "../types/mapAlert";
import { PRIORITY_META } from "../config/priorityMeta";

interface MapLegendProps {
  alertCounts: Record<Priority, number>;
}

export const MapLegend: React.FC<MapLegendProps> = ({ alertCounts }) => {
  return (
    <div className="px-4 py-3 border-b border-slate-800">
      <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-2">
        Map Legend
      </p>
      <div className="flex flex-col gap-1.5">
        {(["critical", "important", "info"] as Priority[]).map((p) => {
          const cfg = PRIORITY_META[p];
          return (
            <div key={p} className="flex items-center gap-2">
              <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                <div
                  className="w-3.5 h-3.5 rounded-full border-2"
                  style={{
                    borderColor: cfg.markerColor,
                    background: cfg.outerRing,
                  }}
                />
                <div
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ background: cfg.markerColor }}
                />
              </div>
              <span className={`text-[11px] font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-[10px] text-slate-600 ml-auto">
                {alertCounts[p]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
