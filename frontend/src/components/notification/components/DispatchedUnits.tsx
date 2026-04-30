import React from "react";
import { Truck, Clock } from "lucide-react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { UNIT_STATUS_META } from "../config/unitStatusMeta";
import type { DispatchUnit } from "../types/notificationDetail";

interface DispatchedUnitsProps {
  units: DispatchUnit[];
}

export const DispatchedUnits: React.FC<DispatchedUnitsProps> = ({ units }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Truck size={14} className="text-slate-500" /> Dispatched Units
        </h2>
        <Badge className="bg-slate-800 text-slate-400 text-[10px] border border-slate-700 rounded-full px-2">
          {units.length} units
        </Badge>
      </div>
      <div className="divide-y divide-slate-800">
        {units.map((unit) => {
          const uMeta = UNIT_STATUS_META[unit.status];
          return (
            <div key={unit.id} className="flex items-center gap-4 px-5 py-3.5">
              {/* Animated status dot */}
              <div className="relative shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${uMeta.dot}`} />
                {unit.status === "en_route" && (
                  <span
                    className={`absolute inset-0 rounded-full ${uMeta.dot} opacity-40 animate-ping`}
                  />
                )}
              </div>
              {/* Unit info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-200">
                    {unit.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                    {unit.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {unit.station} · {unit.personnel} personnel
                </p>
              </div>
              {/* ETA + status badge */}
              <div className="flex items-center gap-3 shrink-0">
                {unit.status !== "on_scene" && unit.status !== "returned" && (
                  <span className="text-[11px] text-slate-600 flex items-center gap-1">
                    <Clock size={10} /> {unit.eta}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${uMeta.bg} ${uMeta.border} ${uMeta.color}`}
                >
                  {uMeta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
