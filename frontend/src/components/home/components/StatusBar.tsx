import React from "react";
import { Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface StatusBarProps {
  criticalCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ criticalCount }) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Activity
              size={13}
              className={
                criticalCount > 0
                  ? "text-red-400 animate-pulse"
                  : "text-green-500"
              }
            />
            <span
              className={`text-[11px] font-semibold uppercase tracking-widest ${
                criticalCount > 0 ? "text-red-400" : "text-green-500"
              }`}
            >
              {criticalCount > 0
                ? `${criticalCount} Active Critical Alert${criticalCount > 1 ? "s" : ""}`
                : "All Clear"}
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
