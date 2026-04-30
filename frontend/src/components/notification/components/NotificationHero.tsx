import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Shield,
  Eye,
  Share2,
  Trash2,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { PRIORITY_META } from "../config/priorityMeta";
import type { PriorityMeta } from "@/components/notifications/config/priorityMeta";
import { Priority } from "@/components/notifications/types/notification";

interface NotificationHeroProps {
  priority: string;
  title: string;
  incidentId: string;
  timestamp: string;
  read: boolean;
  acknowledged: boolean;
  copied: boolean;
  isCriticalUnack: boolean;
  onAcknowledge: () => void;
  onMarkRead: () => void;
  onCopyId: () => void;
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
};

export const NotificationHero: React.FC<NotificationHeroProps> = ({
  priority,
  title,
  incidentId,
  timestamp,
  read,
  acknowledged,
  copied,
  isCriticalUnack,
  onAcknowledge,
  onMarkRead,
  onCopyId,
}) => {
  const priorityT: Priority =
    priority === "critical" || priority === "important" || priority === "info"
      ? priority
      : ("critical" as Priority);

  const meta = PRIORITY_META[priorityT] || DEFAULT_META;
  const Icon = meta.icon;

  return (
    <div
      className={`relative bg-linear-to-b ${meta.heroGrad} border-b ${meta.heroBorder}`}
    >
      {/* Pulse glow for unacknowledged critical */}
      {priority === "critical" && !acknowledged && (
        <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
      )}

      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* Back nav */}
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[13px] mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to All Notifications
        </Link>

        {/* Top row: icon + title + actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Hero Icon blob */}
            <div className="relative shrink-0">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${meta.bg} border ${meta.border} shadow-lg ${meta.glow}`}
              >
                <Icon size={26} className={meta.color} strokeWidth={1.8} />
              </div>
              {isCriticalUnack && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-slate-950 animate-pulse" />
              )}
            </div>

            {/* Title block */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`${meta.badge} text-[11px] px-2.5 py-0.5 rounded-full font-bold tracking-wide`}
                >
                  {meta.label}
                </Badge>
                {!read && (
                  <Badge
                    variant="outline"
                    className="border-slate-700 text-slate-500 text-[10px] px-2 py-0 rounded-full"
                  >
                    Unread
                  </Badge>
                )}
                {acknowledged && (
                  <Badge
                    variant="outline"
                    className="border-emerald-800/60 text-emerald-500 text-[10px] px-2 py-0 rounded-full flex items-center gap-1"
                  >
                    <CheckCircle2 size={10} /> Acknowledged
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-2 leading-tight">
                {title}
              </h1>
              {/* Incident ID + timestamp */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={onCopyId}
                  className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-300 transition-colors group"
                >
                  <span className="font-mono text-slate-600 group-hover:text-slate-400">
                    {incidentId}
                  </span>
                  {copied ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <Copy size={11} />
                  )}
                </button>
                <Separator
                  orientation="vertical"
                  className="h-3.5 border-slate-800"
                />
                <span className="flex items-center gap-1 text-[12px] text-slate-600">
                  <Clock size={11} /> {timestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Hero actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isCriticalUnack && (
              <Button
                onClick={onAcknowledge}
                className="bg-red-600 hover:bg-red-500 text-white text-[12px] font-semibold gap-1.5 h-9 px-4 rounded-lg shadow-lg shadow-red-900/40"
              >
                <Shield size={14} /> Acknowledge
              </Button>
            )}
            {!read && (
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkRead}
                className="border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 bg-slate-900/70 text-[12px] gap-1.5 h-9"
              >
                <Eye size={13} /> Mark Read
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 bg-slate-900/70 h-9 w-9 p-0"
                  >
                    <Share2 size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200 text-xs">
                  Share Alert
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-800 bg-slate-900/70 h-9 w-9 p-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200 text-xs">
                  Delete Alert
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
};
