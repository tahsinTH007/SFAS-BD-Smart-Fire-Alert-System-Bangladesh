import React from "react";
import Link from "next/link";
import { NotificationItem } from "./NotificationItem";
import {
  Notification,
  Priority,
} from "@/components/notifications/types/notification";

export const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string }> =
  {
    critical: { label: "Critical", dot: "bg-red-500" },
    important: { label: "Important", dot: "bg-orange-500" },
    info: { label: "Info", dot: "bg-blue-500" },
  };

interface NotificationDropdownProps {
  groupedNotifications: Record<Priority, Notification[]>;
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  groupedNotifications,
  unreadCount,
  markRead,
  markAllRead,
  onClose,
}) => {
  const priorities: Priority[] = ["critical", "important", "info"];

  return (
    <div className="absolute top-[calc(100%+10px)] right-0 w-110 max-h-120 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/40 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-3 duration-200 z-10001">
      {/* Header */}
      <div className="relative px-5 py-4 border-b-2 border-slate-100 dark:border-slate-800 bg-linear-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/30">
              <span className="text-white text-lg">🔔</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Fire Alerts
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline transition-all px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Priority legend */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          {priorities.map((priority) => {
            const cfg = PRIORITY_CONFIG[priority];
            return (
              <div key={priority} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {priorities.map((priority) => {
          const items = groupedNotifications[priority] ?? [];
          if (items.length === 0) return null;
          const cfg = PRIORITY_CONFIG[priority];

          return (
            <div key={priority}>
              {/* Section header */}
              <div className="sticky top-0 bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 z-10">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {cfg.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-500 ml-1">
                    ({items.length})
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markRead}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {priorities.every(
          (priority) => (groupedNotifications[priority]?.length ?? 0) === 0,
        ) && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              All clear!
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
              No active fire alerts at the moment
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
        <Link href="/notifications">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
          >
            View All Notifications →
          </button>
        </Link>
      </div>
    </div>
  );
};
