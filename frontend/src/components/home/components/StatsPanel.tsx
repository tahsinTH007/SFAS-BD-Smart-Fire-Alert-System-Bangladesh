import React from "react";

interface StatsPanelProps {
  criticalCount: number;
  importantCount: number;
  infoCount: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  criticalCount,
  importantCount,
  infoCount,
}) => {
  return (
    <div className="grid grid-cols-3 gap-px bg-slate-800">
      {[
        {
          label: "Critical",
          count: criticalCount,
          color: "text-red-400",
          bg: "bg-slate-900",
        },
        {
          label: "Important",
          count: importantCount,
          color: "text-amber-400",
          bg: "bg-slate-900",
        },
        {
          label: "Info",
          count: infoCount,
          color: "text-emerald-400",
          bg: "bg-slate-900",
        },
      ].map((s) => (
        <div key={s.label} className={`${s.bg} px-3 py-3 text-center`}>
          <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
};
