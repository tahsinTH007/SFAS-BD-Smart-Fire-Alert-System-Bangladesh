import React from "react";
import { MapPin } from "lucide-react";
import { PRIORITY_CONFIG } from "../config/priorityConfig";
import { Notification } from "@/components/notifications/types/notification";
import Link from "next/link";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClose: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onClose,
}) => {
  const config = PRIORITY_CONFIG[notification.priority];

  const handleClick = () => {
    onRead(notification.id);
    onClose();
  };

  return (
    <Link
      href={`/notifications/${notification.id}`}
      onClick={handleClick}
      className={`relative flex gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
        !notification.read ? "bg-slate-50/80 dark:bg-slate-800/50" : ""
      }`}
    >
      {/* Left priority bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.bar}`} />

      {/* Priority dot */}
      <div className="shrink-0 mt-1.5">
        <div
          className={`w-2.5 h-2.5 rounded-full ${config.dot} ${
            !notification.read ? `shadow-md ${config.glow}` : "opacity-50"
          } ${
            !notification.read && notification.priority === "critical"
              ? "animate-pulse"
              : ""
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className={`text-sm leading-tight ${
              !notification.read
                ? "font-bold text-slate-900 dark:text-slate-50"
                : "font-medium text-slate-600 dark:text-slate-400"
            }`}
          >
            {notification.title}
          </p>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${config.badge} shrink-0 uppercase tracking-wide`}
          >
            {config.label}
          </span>
        </div>

        <p
          className={`text-xs leading-relaxed ${
            !notification.read
              ? "text-slate-600 dark:text-slate-400"
              : "text-slate-500 dark:text-slate-500"
          }`}
        >
          {notification.message}
        </p>

        <div className="flex items-center gap-3 mt-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-600">
            {notification.timestamp}
          </p>

          {notification.location && (
            <>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-500">
                <MapPin size={10} />
                <span>{notification.location}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};
