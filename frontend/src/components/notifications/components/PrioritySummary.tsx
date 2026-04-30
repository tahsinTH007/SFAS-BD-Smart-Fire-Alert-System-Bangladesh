import React from "react";
import { Priority } from "../types/notification";
import { PRIORITY_META } from "../config/priorityMeta";
import { Badge } from "@/components/ui/badge";

interface PrioritySummaryProps {
  counts: Record<Priority, number>;
  unreadCounts: Record<Priority, number>;
  filterPriority: Priority | "all";
  onFilterChange: (priority: Priority | "all") => void;
}

export const PrioritySummary: React.FC<PrioritySummaryProps> = ({
  counts,
  unreadCounts,
  filterPriority,
  onFilterChange,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(["critical", "important", "info"] as Priority[]).map((p) => {
        const meta = PRIORITY_META[p];
        const Icon = meta.icon;
        const unread = unreadCounts[p];
        const isActive = filterPriority === p;

        return (
          <button
            key={p}
            onClick={() => onFilterChange(isActive ? "all" : p)}
            className={`relative rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
              isActive
                ? `${meta.bg} ${meta.border} shadow-lg ${meta.glow}`
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.bg} border ${meta.border}`}
                >
                  <Icon size={15} className={meta.color} />
                </div>
                <div>
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${meta.color}`}
                  >
                    {meta.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {counts[p]} alerts
                  </p>
                </div>
              </div>
              {unread > 0 && (
                <Badge
                  className={`${meta.badge} text-[10px] rounded-full px-2`}
                >
                  {unread}
                </Badge>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
