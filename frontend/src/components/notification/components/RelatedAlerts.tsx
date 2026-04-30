"use client";

import React from "react";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { PRIORITY_META } from "../config/priorityMeta";
import { Priority } from "@/components/notifications/types/notification";

export const RelatedAlerts = ({ alerts }: any) => {
  const priority: Priority =
    alerts.priority === "critical" ||
    alerts.priority === "important" ||
    alerts.priority === "info"
      ? alerts.priority
      : ("critical" as Priority);

  return (
    <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Bell size={14} className="text-slate-500" /> Related Alerts
        </h2>
      </div>

      {/* SCROLLABLE ALERTS */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent max-h-50">
        {alerts.length === 0 && (
          <p className="text-center text-slate-500 py-6 text-sm">
            No related alerts found
          </p>
        )}

        {alerts.map((alert: any) => {
          const rMeta = PRIORITY_META[priority];
          const RIcon = rMeta.icon;

          return (
            <Link
              key={alert.id}
              href={`/notifications/${alert.id}`}
              className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors group"
            >
              {/* Left priority bar */}
              <div
                className={`shrink-0 w-0.5 self-stretch rounded-full ${rMeta.barColor} opacity-60`}
              />

              {/* Icon */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${rMeta.bg} border ${rMeta.border}`}
              >
                <RIcon size={13} className={rMeta.color} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-300 group-hover:text-slate-100 truncate transition-colors">
                  {alert.title}
                </p>

                <p className="text-[11px] text-slate-600 truncate mt-0.5">
                  {alert.location}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={`${rMeta.badge} text-[9px] px-1.5 py-0 rounded-full`}
                  >
                    {rMeta.label}
                  </Badge>

                  <span className="text-[10px] text-slate-700">
                    {alert.timestamp}
                  </span>
                </div>
              </div>

              <ChevronRight
                size={14}
                className="text-slate-700 group-hover:text-slate-500 shrink-0 mt-1 transition-colors"
              />
            </Link>
          );
        })}
      </div>
    </Card>
  );
};
