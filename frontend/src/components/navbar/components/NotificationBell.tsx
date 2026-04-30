import React, { useState, useRef, useEffect } from "react";
import { Bell, Flame } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "../hooks/useNotifications";

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    unreadCount,
    criticalCount,
    markRead,
    markAllRead,
    groupedNotifications,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-white/90 hover:text-white hover:bg-white/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-all duration-200 group"
      >
        {criticalCount > 0 ? (
          <Flame
            size={22}
            strokeWidth={2}
            className="animate-pulse text-red-400"
          />
        ) : (
          <Bell size={22} strokeWidth={1.8} />
        )}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-extrabold text-white bg-linear-to-br from-red-500 to-orange-600 rounded-full border-2 border-slate-900 dark:border-slate-900 shadow-lg shadow-red-500/50 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Critical indicator */}
        {criticalCount > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationDropdown
          groupedNotifications={groupedNotifications}
          unreadCount={unreadCount}
          markRead={markRead}
          markAllRead={markAllRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
