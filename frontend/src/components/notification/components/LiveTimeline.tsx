import React from "react";
import { Clock, CheckCircle2, Activity } from "lucide-react";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import type { TimelineEvent } from "../types/notificationDetail";
import { getTimelineEventClasses } from "../utils/formatTimeline";

interface LiveTimelineProps {
  timeline: TimelineEvent[];
}

export const LiveTimeline: React.FC<LiveTimelineProps> = ({ timeline }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Clock size={14} className="text-slate-500" /> Live Timeline
        </h2>
      </div>
      <div className="px-5 py-4">
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-2.25 top-3 bottom-3 w-px bg-slate-800" />

          {timeline.map((ev, i) => {
            const Icon = ev.icon;
            const {
              isDone,
              isActive,
              isPending,
              dotClasses,
              labelClasses,
              detailClasses,
            } = getTimelineEventClasses(ev.status);

            return (
              <div
                key={i}
                className={`relative flex gap-3.5 ${i < timeline.length - 1 ? "pb-5" : ""}`}
              >
                {/* Dot */}
                <div
                  className="relative shrink-0 z-10"
                  style={{ width: "18px", height: "18px" }}
                >
                  <div className={dotClasses}>
                    {isDone && (
                      <CheckCircle2 size={11} className="text-white" />
                    )}
                    {isActive && (
                      <Activity
                        size={11}
                        className="text-white animate-pulse"
                      />
                    )}
                  </div>
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-amber-500 opacity-25 animate-ping" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className={labelClasses}>{ev.label}</span>
                    {isActive && (
                      <Badge className="bg-amber-600/20 text-amber-400 border border-amber-800/40 text-[9px] px-1.5 py-0 rounded-full">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <p className={detailClasses}>{ev.detail}</p>
                  <span className="text-[10px] text-slate-700">{ev.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
