import React from "react";
import { useSelector } from "react-redux";
import { selectActiveStation } from "@/redux/slices/sessionSlice";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationHeaderProps {
  unreadCount: number;
  criticalUnread: number;
  totalCount: number;
  onMarkAllRead: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  criticalUnread,
  totalCount,
  onMarkAllRead,
}) => {
  const station = useSelector(selectActiveStation);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {/* Left: Back + Title */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[13px] mb-3 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to live map
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-red-950 border border-red-800/60 flex items-center justify-center">
              <Bell size={20} className="text-red-400" />
            </div>
            {criticalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                {criticalUnread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Alert console
            </h1>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {station ? `${station.stationCode} · ` : ""}
              {unreadCount} unread · {totalCount} total
            </p>
          </div>
        </div>
      </div>

      {/* Right: Mark all read */}
      <Button
        variant="outline"
        size="sm"
        onClick={onMarkAllRead}
        disabled={unreadCount === 0}
        className="w-full sm:w-auto shrink-0 border-slate-700 text-slate-400 hover:text-slate-100 hover:border-slate-600 bg-slate-900 text-[12px] gap-1.5 disabled:opacity-30"
      >
        <CheckCheck size={13} />
        Mark All Read
      </Button>
    </div>
  );
};
