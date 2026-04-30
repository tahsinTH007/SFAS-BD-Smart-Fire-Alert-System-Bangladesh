import React from "react";
import { Activity } from "lucide-react";
import { Separator } from "../../ui/separator";

interface TopStatusStripProps {
  isCriticalUnack: boolean;
  acknowledged: boolean;
}

export const TopStatusStrip: React.FC<TopStatusStripProps> = ({
  isCriticalUnack,
  acknowledged,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity
              size={13}
              className={
                isCriticalUnack
                  ? "text-red-400 animate-pulse"
                  : "text-green-500"
              }
            />
            <span
              className={`text-[11px] font-semibold uppercase tracking-widest ${isCriticalUnack ? "text-red-400" : "text-green-500"}`}
            >
              {isCriticalUnack
                ? "Active Alert"
                : acknowledged
                  ? "Acknowledged"
                  : "Monitored"}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4 border-slate-700" />
          <span className="text-[11px] text-slate-600">
            Station: Dhaka Central — Unit #DC-01
          </span>
        </div>
        <span className="text-[11px] text-slate-600">
          Last sync: <span className="text-slate-500">Just now</span>
        </span>
      </div>
    </div>
  );
};
