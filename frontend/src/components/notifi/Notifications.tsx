"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  AlertTriangle,
  Info,
  ArrowLeft,
  Search,
  Filter,
  Trash2,
  CheckCheck,
  Clock,
  MapPin,
  Phone,
  User,
  Bell,
  BellOff,
  ChevronDown,
  X,
  Shield,
  Truck,
  Radio,
  Activity,
  EyeOff,
} from "lucide-react";

// ─── shadcn imports ─────────────────────────────────────────────────────────
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Priority = "critical" | "important" | "info";
type AlertType =
  | "fire_detected"
  | "smoke_detected"
  | "heat_surge"
  | "equipment_failure"
  | "new_report"
  | "unit_dispatched"
  | "system_update"
  | "patrol_schedule";

interface Notification {
  id: number;
  type: AlertType;
  priority: Priority;
  title: string;
  message: string;
  location: string;
  reportedBy: string;
  contactNumber: string;
  timestamp: string;
  read: boolean;
  acknowledged: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — realistic Bangladesh fire station alerts
// ─────────────────────────────────────────────────────────────────────────────
const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "fire_detected",
    priority: "critical",
    title: "🔥 Active Fire — Dhaka North",
    message:
      "Multi-story residential building fire detected at floor 4–6. Civilians reported trapped. Immediate unit deployment required.",
    location: "Mohammadpur, Dhaka",
    reportedBy: "Sensor Grid #MH-12",
    contactNumber: "02-XXXX-4412",
    timestamp: "Today, 09:14 AM",
    read: false,
    acknowledged: false,
  },
  {
    id: 2,
    type: "smoke_detected",
    priority: "critical",
    title: "💨 Heavy Smoke — Gazipur Industrial Zone",
    message:
      "Dense smoke plume rising from a textile warehouse. Wind direction SW — spreading toward residential area. Air quality critical.",
    location: "Gazipur Industrial Zone, Gazipur",
    reportedBy: "Sensor Grid #GZ-07",
    contactNumber: "02-XXXX-7731",
    timestamp: "Today, 08:52 AM",
    read: false,
    acknowledged: false,
  },
  {
    id: 3,
    type: "heat_surge",
    priority: "critical",
    title: "🌡️ Extreme Heat Surge — Chittagong Port",
    message:
      "Temperature exceeded 480°C inside fuel storage bay 3. Auto-suppression activated. Manual backup required immediately.",
    location: "Chittagong Port Terminal, Chittagong",
    reportedBy: "Thermocouple #CT-Port-03",
    contactNumber: "031-XXXX-9900",
    timestamp: "Today, 08:31 AM",
    read: true,
    acknowledged: true,
  },
  {
    id: 4,
    type: "unit_dispatched",
    priority: "important",
    title: "🚒 Unit Dispatched — Sylhet Station",
    message:
      "Fire Engine Unit #SL-04 has been dispatched toward Biswanath Upazila following a reported kitchen fire at a local hotel.",
    location: "Biswanath, Sylhet",
    reportedBy: "Dispatch Center — Sylhet",
    contactNumber: "0821-XXXX-1100",
    timestamp: "Today, 07:45 AM",
    read: false,
    acknowledged: false,
  },
  {
    id: 5,
    type: "equipment_failure",
    priority: "important",
    title: "⚠️ Pump Failure — Rajshahi Station",
    message:
      "Primary water pump on Engine #RJ-02 has stalled. Backup pump engaging. Maintenance team notified. Unit availability reduced.",
    location: "Rajshahi Fire Station No. 1",
    reportedBy: "Engine Diagnostics",
    contactNumber: "0721-XXXX-5500",
    timestamp: "Today, 06:20 AM",
    read: false,
    acknowledged: false,
  },
  {
    id: 6,
    type: "new_report",
    priority: "important",
    title: "📋 New Incident Report — Comilla",
    message:
      "Incident report #2025-0202-87 submitted by Station Commander. Factory fire post-mortem documentation pending sign-off.",
    location: "Comilla Fire Station",
    reportedBy: "Cmdr. Rahman A.",
    contactNumber: "0821-XXXX-3300",
    timestamp: "Today, 05:10 AM",
    read: true,
    acknowledged: true,
  },
  {
    id: 7,
    type: "new_report",
    priority: "important",
    title: "📋 Casualty Update — Dhaka South",
    message:
      "Two casualties confirmed from the Wari warehouse fire (Inc. #2025-0131-44). Hospital liaison has been notified.",
    location: "Wari, Dhaka South",
    reportedBy: "Station Inspector K. Haq",
    contactNumber: "02-XXXX-8800",
    timestamp: "Yesterday, 11:45 PM",
    read: true,
    acknowledged: true,
  },
  {
    id: 8,
    type: "system_update",
    priority: "info",
    title: "🔧 System Maintenance — Sensor Network",
    message:
      "Scheduled maintenance on the national sensor grid between 2:00–4:00 AM. Some zones may have delayed alerts during this window.",
    location: "Nationwide",
    reportedBy: "SFAS-BD System Admin",
    contactNumber: "—",
    timestamp: "Yesterday, 06:00 PM",
    read: true,
    acknowledged: true,
  },
  {
    id: 9,
    type: "patrol_schedule",
    priority: "info",
    title: "📅 Patrol Schedule Updated — Week 6",
    message:
      "Updated patrol rotation for February 3–9 has been published. All station commanders please review and confirm staffing.",
    location: "All Stations",
    reportedBy: "Operations Planning",
    contactNumber: "—",
    timestamp: "Yesterday, 03:00 PM",
    read: true,
    acknowledged: true,
  },
  {
    id: 10,
    type: "system_update",
    priority: "info",
    title: "📡 GPS Tracker Calibration Complete",
    message:
      "All fire unit GPS trackers have been recalibrated. Location accuracy is now within 5 meters. No action required.",
    location: "Nationwide",
    reportedBy: "SFAS-BD System Admin",
    contactNumber: "—",
    timestamp: "Jan 31, 2025 — 10:00 AM",
    read: true,
    acknowledged: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG MAPS
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_META = {
  critical: {
    label: "Critical",
    icon: Flame,
    color: "text-red-400",
    bg: "bg-red-950/60",
    border: "border-red-800/50",
    badge: "bg-red-600 text-white hover:bg-red-600",
    barColor: "bg-red-500",
    glow: "shadow-red-900/40",
    dotColor: "bg-red-500",
  },
  important: {
    label: "Important",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800/40",
    badge: "bg-amber-600 text-white hover:bg-amber-600",
    barColor: "bg-amber-500",
    glow: "shadow-amber-900/40",
    dotColor: "bg-amber-500",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-950/30",
    border: "border-sky-800/40",
    badge: "bg-sky-700 text-white hover:bg-sky-700",
    barColor: "bg-sky-500",
    glow: "shadow-sky-900/40",
    dotColor: "bg-sky-500",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Animated pulse ring on critical unread items */
const PulseRing = () => (
  <span className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-red-500 opacity-40 animate-ping" />
);

/** Single notification row card */
const NotificationCard = ({
  notification,
  selected,
  onSelect,
  onAcknowledge,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  selected: boolean;
  onSelect: (id: number) => void;
  onAcknowledge: (id: number) => void;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
  const meta = PRIORITY_META[notification.priority];
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
      {/* Left priority bar (full height) */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${meta.barColor} ${
          notification.read ? "opacity-30" : "opacity-100"
        }`}
      />

      {/* Checkbox */}
      <div
        className="flex-shrink-0 pt-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(notification.id)}
          className="border-slate-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
        />
      </div>

      {/* Priority icon */}
      <div className="relative flex-shrink-0 mt-0.5">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg} border ${meta.border}`}
        >
          <Icon size={17} className={meta.color} strokeWidth={2} />
        </div>
        {isCriticalUnread && <PulseRing />}
        {/* Unread dot */}
        {!notification.read && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${meta.dotColor} border-2 border-slate-900`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
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
          <div className="flex items-center gap-2 flex-shrink-0">
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

        {/* Message */}
        <p
          className={`text-xs mt-0.5 leading-relaxed ${
            notification.read ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {notification.message}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-slate-500" />
            {notification.location}
          </span>
          <span className="flex items-center gap-1">
            <Radio size={11} className="text-slate-500" />
            {notification.reportedBy}
          </span>
          {notification.contactNumber !== "—" && (
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

      {/* Quick action buttons (on hover) */}
      <div
        className="flex-shrink-0 flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ opacity: 1 }}
      >
        {!notification.acknowledged && notification.priority === "critical" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge(notification.id);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const AllNotificationsPage = () => {
  const [notifications, setNotifications] =
    useState<Notification[]>(NOTIFICATIONS);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ── Derived ──
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase()) ||
        n.location.toLowerCase().includes(search.toLowerCase());
      const matchesPriority =
        filterPriority === "all" || n.priority === filterPriority;
      const matchesRead =
        filterRead === "all" ||
        (filterRead === "unread" && !n.read) ||
        (filterRead === "read" && n.read);
      return matchesSearch && matchesPriority && matchesRead;
    });
  }, [notifications, search, filterPriority, filterRead]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalUnread = notifications.filter(
    (n) => !n.read && n.priority === "critical",
  ).length;

  // ── Grouped counts for tabs ──
  const counts = {
    critical: notifications.filter((n) => n.priority === "critical").length,
    important: notifications.filter((n) => n.priority === "important").length,
    info: notifications.filter((n) => n.priority === "info").length,
  };

  // ── Handlers ──
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((n) => n.id)));
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markSelectedRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (selectedIds.has(n.id) ? { ...n, read: true } : n)),
    );
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
  };

  const acknowledge = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, acknowledged: true, read: true } : n,
      ),
    );
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const deleteOne = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top Status Strip ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Activity
                size={13}
                className={`${criticalUnread > 0 ? "text-red-400 animate-pulse" : "text-green-500"}`}
              />
              <span
                className={`text-[11px] font-semibold uppercase tracking-widest ${criticalUnread > 0 ? "text-red-400" : "text-green-500"}`}
              >
                {criticalUnread > 0
                  ? `${criticalUnread} Active Alert${criticalUnread > 1 ? "s" : ""}`
                  : "All Clear"}
              </span>
            </div>
            <Separator
              orientation="vertical"
              className="h-4 border-slate-700"
            />
            <span className="text-[11px] text-slate-600">
              Station: Dhaka Central — Unit #DC-01
            </span>
          </div>
          <span className="text-[11px] text-slate-600">
            Last sync: <span className="text-slate-500">Just now</span>
          </span>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          {/* Left: Back + Title */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[13px] mb-3 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
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
                  All Notifications
                </h1>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {unreadCount} unread · {notifications.length} total alerts
                </p>
              </div>
            </div>
          </div>

          {/* Right: Mark all read */}
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="border-slate-700 text-slate-400 hover:text-slate-100 hover:border-slate-600 bg-slate-900 text-[12px] gap-1.5 disabled:opacity-30"
          >
            <CheckCheck size={13} />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* ── Priority Summary Cards ── */}
      <div className="max-w-6xl mx-auto px-6 pb-5 grid grid-cols-3 gap-3">
        {(["critical", "important", "info"] as Priority[]).map((p) => {
          const meta = PRIORITY_META[p];
          const Icon = meta.icon;
          const unread = notifications.filter(
            (n) => n.priority === p && !n.read,
          ).length;
          return (
            <button
              key={p}
              onClick={() =>
                setFilterPriority(filterPriority === p ? "all" : p)
              }
              className={`relative rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                filterPriority === p
                  ? `${meta.bg} ${meta.border} shadow-lg ${meta.glow}`
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.bg} border ${meta.border}`}
                  >
                    <Icon size={15} className={meta.color} />
                  </div>
                  <div>
                    <p
                      className={`text-[11px] font-bold uppercase tracking-wider ${meta.color}`}
                    >
                      {meta.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {counts[p]} alerts
                    </p>
                  </div>
                </div>
                {unread > 0 && (
                  <Badge
                    className={`${meta.badge} text-[10px] rounded-full px-2`}
                  >
                    {unread}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filters & Search ── */}
      <div className="max-w-6xl mx-auto px-6 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts, locations, reports…"
              className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-600 text-sm focus:border-red-800 focus:ring-0 rounded-lg h-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Read status filter */}
          <Select
            value={filterRead}
            onValueChange={(v) => setFilterRead(v as any)}
          >
            <SelectTrigger className="w-36 bg-slate-900 border-slate-700 text-slate-300 text-sm rounded-lg h-9 focus:border-red-800 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem
                value="all"
                className="text-slate-300 text-sm focus:bg-slate-800"
              >
                All
              </SelectItem>
              <SelectItem
                value="unread"
                className="text-slate-300 text-sm focus:bg-slate-800"
              >
                Unread
              </SelectItem>
              <SelectItem
                value="read"
                className="text-slate-300 text-sm focus:bg-slate-800"
              >
                Read
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Clear priority filter */}
          {filterPriority !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterPriority("all")}
              className="border-slate-700 text-slate-400 hover:text-slate-200 bg-slate-900 text-xs gap-1 h-9"
            >
              <X size={11} />
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="max-w-6xl mx-auto px-6 pb-3">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5">
            <span className="text-[12px] text-slate-400 font-medium">
              <span className="text-slate-200 font-bold">
                {selectedIds.size}
              </span>{" "}
              selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={markSelectedRead}
                className="text-sky-400 hover:text-sky-300 hover:bg-slate-800 text-[12px] gap-1.5 h-7 px-3"
              >
                <CheckCheck size={13} /> Mark Read
              </Button>
              <Separator
                orientation="vertical"
                className="h-5 border-slate-700"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteSelected}
                className="text-red-400 hover:text-red-300 hover:bg-slate-800 text-[12px] gap-1.5 h-7 px-3"
              >
                <Trash2 size={13} /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification List ── */}
      <div className="max-w-6xl mx-auto px-6">
        <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {/* List header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/80">
            <Checkbox
              checked={
                selectedIds.size === filtered.length && filtered.length > 0
              }
              onCheckedChange={selectAll}
              className="border-slate-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
              {filtered.length} Notification{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Important
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Info
              </span>
            </div>
          </div>

          {/* Scrollable list */}
          <ScrollArea className="max-h-[560px]">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                  <BellOff size={24} className="text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  No notifications found
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Try adjusting your filters or search query.
                </p>
              </div>
            ) : (
              filtered.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  selected={selectedIds.has(n.id)}
                  onSelect={toggleSelect}
                  onAcknowledge={acknowledge}
                  onMarkRead={markRead}
                  onDelete={deleteOne}
                />
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>

      {/* ── Footer Branding ── */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-red-500" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            SFAS-BD
          </span>
          <span className="text-[11px] text-slate-700">|</span>
          <span className="text-[10px] text-slate-700">
            Smart Fire Alert System – Bangladesh
          </span>
        </div>
        <span className="text-[10px] text-slate-700">
          © 2025 Bangladesh Fire Service
        </span>
      </div>
    </div>
  );
};

export default AllNotificationsPage;
