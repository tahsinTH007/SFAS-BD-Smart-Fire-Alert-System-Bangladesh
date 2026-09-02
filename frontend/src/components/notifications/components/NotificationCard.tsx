import React from "react";
import {
  MapPin,
  Phone,
  Clock,
  Radio,
  Shield,
  EyeOff,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Notification, Priority } from "../types/notification";
import { PRIORITY_META, PriorityMeta } from "../config/priorityMeta";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PulseRing } from "./PulseRing";
import Link from "next/link";

interface NotificationCardProps {
  notification: Notification;
  selected: boolean;
  onSelect: (id: string) => void;
  onAcknowledge: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_META: PriorityMeta = {
  label: "Unknown",
  icon: Clock,
  bg: "bg-gray-600",
  color: "text-white",
  border: "border-gray-500",
  barColor: "bg-gray-500",
  badge: "bg-gray-700 text-white",
  dotColor: "bg-gray-400",
  glow: "shadow-slate-900/40",
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  selected,
  onSelect,
  onAcknowledge,
  onMarkRead,
  onDelete,
}) => {
  const priority: Priority =
    notification.priority === "critical" ||
    notification.priority === "important" ||
    notification.priority === "info"
      ? notification.priority
      : ("critical" as Priority);

  const meta = PRIORITY_META[priority] || DEFAULT_META;
  const Icon = meta.icon;

  const isCriticalUnread =
    notification.priority === "critical" && !notification.read;

  return (
    <div
      className={`
        relative flex gap-3 px-4 py-3.5 transition-all duration-200 cursor-pointer border-b border-slate-800/60 last:border-b-0
        ${selected ? "bg-slate-700/40" : "hover:bg-slate-800/40"}
        ${!notification.read ? meta.bg : ""}
      `}
      onClick={() => onSelect(notification.id)}
    >
      {/* Left priority bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${meta.barColor} ${
          notification.read ? "opacity-30" : "opacity-100"
        }`}
      />

      {/* Checkbox */}
      <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(notification.id)}
          className="border-slate-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
        />
      </div>

      {/* Priority icon */}
      <div className="relative shrink-0 mt-0.5">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg} border ${meta.border}`}
        >
          <Icon size={17} className={meta.color} strokeWidth={2} />
        </div>
        {isCriticalUnread && <PulseRing />}
        {!notification.read && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${meta.dotColor} border-2 border-slate-900`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4
            className={`text-sm truncate ${
              notification.read
                ? "text-slate-500 font-medium"
                : "text-slate-100 font-semibold"
            }`}
          >
            {notification.title}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={`text-[10px] px-2 py-0.5 rounded-full ${meta.badge}`}
            >
              {meta.label}
            </Badge>
            {notification.acknowledged && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-slate-700 text-slate-500 rounded-full"
              >
                ACK
              </Badge>
            )}
          </div>
        </div>

        <p
          className={`text-xs mt-0.5 leading-relaxed ${
            notification.read ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {notification.message}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-slate-500" />
            {notification.location}
          </span>
          <span className="flex items-center gap-1">
            <Radio size={11} className="text-slate-500" />
            {notification.reportedBy}
          </span>
          {notification.contactNumber && (
            <span className="flex items-center gap-1">
              <Phone size={11} className="text-slate-500" />
              {notification.contactNumber}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto text-slate-700">
            <Clock size={11} />
            {notification.timestamp}
          </span>
        </div>
      </div>

      {/* Quick action buttons */}
      <div
        className="shrink-0 flex flex-col items-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* View Details */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/notifications/${notification.id}`}
                className="p-1.5 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-slate-700/60 transition-colors"
              >
                <ExternalLink size={14} />
              </Link>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-slate-200 text-xs border-slate-700">
              View Details
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!notification.acknowledged && notification.priority === "critical" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onAcknowledge(notification.id)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-amber-400 hover:bg-slate-700/60 transition-colors"
                >
                  <Shield size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-slate-200 text-xs border-slate-700">
                Acknowledge
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {!notification.read && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onMarkRead(notification.id)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-sky-400 hover:bg-slate-700/60 transition-colors"
                >
                  <EyeOff size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-slate-200 text-xs border-slate-700">
                Mark Read
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDelete(notification.id)}
                className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-700/60 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-slate-200 text-xs border-slate-700">
              Delete
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
