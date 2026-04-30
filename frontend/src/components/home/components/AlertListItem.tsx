import React from "react";
import { MapAlert } from "../types/mapAlert";
import { PRIORITY_META } from "../config/priorityMeta";

interface AlertListItemProps {
  alert: MapAlert;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSidebarClick: (id: string) => void;
}

export const AlertListItem: React.FC<AlertListItemProps> = ({
  alert,
  isHovered,
  onHover,
  onSidebarClick,
}) => {
  const cfg =
    PRIORITY_META[alert.priority as keyof typeof PRIORITY_META] ||
    PRIORITY_META["info"];

  const Icon = cfg.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSidebarClick(alert.id)}
      onKeyDown={(e) => e.key === "Enter" && onSidebarClick(alert.id)}
      onMouseEnter={() => onHover(alert.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative flex items-start gap-2.5 px-4 py-2.5 text-left transition-all duration-150 cursor-pointer select-none ${
        isHovered ? "bg-slate-800/60" : "hover:bg-slate-800/30"
      }`}
    >
      {/* Priority bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-0.5 ${
          alert.priority === "critical"
            ? "bg-red-500"
            : alert.priority === "important"
              ? "bg-amber-500"
              : "bg-sky-400"
        }`}
      />

      {/* Icon */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}
      >
        <Icon size={13} className={cfg.color} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[11.5px] font-semibold truncate ${
            isHovered ? "text-slate-100" : "text-slate-300"
          }`}
        >
          {alert.title.replace(/^[\u{1F300}-\u{1FFFF}]\s*/u, "")}
        </p>
        <p className="text-[10px] text-slate-600 truncate mt-0.5">
          {alert.location}
        </p>
      </div>

      {/* Time */}
      <span className="text-[9px] text-slate-700 shrink-0 mt-0.5">
        {alert.timestamp.replace("Today, ", "").replace("Yesterday, ", "")}
      </span>
    </div>
  );
};
