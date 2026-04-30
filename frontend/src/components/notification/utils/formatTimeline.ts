import type { TimelineEvent } from "../types/notificationDetail";

/**
 * Determines the visual state classes for a timeline event
 */
export const getTimelineEventClasses = (status: TimelineEvent["status"]) => {
  const isDone = status === "completed";
  const isActive = status === "active";
  const isPending = status === "pending";

  return {
    isDone,
    isActive,
    isPending,
    dotClasses: `w-full h-full rounded-full flex items-center justify-center border-2
      ${isDone ? "bg-emerald-600 border-emerald-500" : ""}
      ${isActive ? "bg-amber-600 border-amber-500" : ""}
      ${isPending ? "bg-slate-800 border-slate-700" : ""}
    `,
    labelClasses: `text-[12px] font-semibold
      ${isDone ? "text-slate-400" : ""}
      ${isActive ? "text-amber-400" : ""}
      ${isPending ? "text-slate-600" : ""}
    `,
    detailClasses: `text-[11px] mt-0.5 leading-relaxed
      ${isDone ? "text-slate-600" : isPending ? "text-slate-700" : "text-slate-500"}
    `,
  };
};
