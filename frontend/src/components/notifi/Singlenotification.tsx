"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Flame,
  AlertTriangle,
  Info,
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Radio,
  Shield,
  Truck,
  Activity,
  ChevronRight,
  User,
  CheckCircle2,
  Circle,
  Send,
  Trash2,
  Share2,
  ExternalLink,
  Eye,
  Navigation,
  Wind,
  Thermometer,
  Users,
  FileText,
  Copy,
  Bell,
} from "lucide-react";

// ─── shadcn ─────────────────────────────────────────────────────────────────
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Textarea } from "../ui/textarea";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES  (identical to AllNotifications)
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

// ─── Extended detail fields only on the single view ────────────────────────
interface NotificationDetail extends Notification {
  incidentId: string;
  coordinates: { lat: number; lng: number };
  affectedArea: string;
  estimatedPeople: number;
  windDirection: string;
  temperature: string;
  floorAffected: string;
  structureType: string;
  units: DispatchUnit[];
  timeline: TimelineEvent[];
  relatedAlerts: Notification[];
}

interface DispatchUnit {
  id: string;
  name: string;
  station: string;
  status: "en_route" | "on_scene" | "standby" | "returned";
  eta: string;
  personnel: number;
}

interface TimelineEvent {
  time: string;
  label: string;
  detail: string;
  status: "completed" | "active" | "pending";
  icon: React.FC<{ size?: number; className?: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DETAIL  —  a critical active fire
// ─────────────────────────────────────────────────────────────────────────────
const DETAIL: NotificationDetail = {
  id: 1,
  type: "fire_detected",
  priority: "critical",
  title: "Active Fire — Mohammadpur Residential Block",
  message:
    "Multi-story residential building fire detected across floors 4 through 6. Sensor Grid #MH-12 triggered at 09:12 AM after sustained heat readings above 340°C. Residents on upper floors reported trapped via emergency hotline. Smoke density is heavy — visibility near zero inside the structure. Wind from the northwest is pushing the fire toward the eastern wing. Immediate multi-unit deployment was ordered at 09:14 AM.",
  location: "Mohammadpur, Dhaka",
  reportedBy: "Sensor Grid #MH-12",
  contactNumber: "02-8800-4412",
  timestamp: "Today, 09:14 AM",
  read: false,
  acknowledged: false,
  // extended
  incidentId: "INC-2025-0202-041",
  coordinates: { lat: 23.7838, lng: 90.3563 },
  affectedArea:
    "Block C, Mohammadpur Residential Colony — 6-story concrete structure",
  estimatedPeople: 48,
  windDirection: "NW → SE  |  12 km/h",
  temperature: "340°C  (sensor avg)  /  480°C  (peak at floor 5)",
  floorAffected: "Floors 4, 5, 6  (top 3 floors)",
  structureType: "6-story reinforced concrete — built 1998",
  units: [
    {
      id: "DC-01",
      name: "Engine Unit #1",
      station: "Dhaka Central",
      status: "on_scene",
      eta: "—",
      personnel: 6,
    },
    {
      id: "DC-03",
      name: "Ladder Unit #3",
      station: "Dhaka Central",
      status: "on_scene",
      eta: "—",
      personnel: 4,
    },
    {
      id: "MH-02",
      name: "Engine Unit #2",
      station: "Mohammadpur",
      status: "en_route",
      eta: "~4 min",
      personnel: 5,
    },
    {
      id: "DC-07",
      name: "Foam Tender #7",
      station: "Dhaka Central",
      status: "en_route",
      eta: "~8 min",
      personnel: 3,
    },
    {
      id: "MH-05",
      name: "Rescue Squad #5",
      station: "Mohammadpur",
      status: "standby",
      eta: "On call",
      personnel: 8,
    },
  ],
  timeline: [
    {
      time: "09:10 AM",
      label: "Sensor Triggered",
      detail: "Heat sensor #MH-12 exceeded threshold (340°C).",
      status: "completed",
      icon: Thermometer,
    },
    {
      time: "09:12 AM",
      label: "Alert Raised",
      detail: "System auto-classified as Critical — fire_detected.",
      status: "completed",
      icon: Bell,
    },
    {
      time: "09:14 AM",
      label: "Dispatch Order Issued",
      detail: "Station Commander approved 3-unit deployment.",
      status: "completed",
      icon: Truck,
    },
    {
      time: "09:18 AM",
      label: "First Unit On Scene",
      detail: "Engine Unit #DC-01 arrived. Incident Commander assigned.",
      status: "completed",
      icon: CheckCircle2,
    },
    {
      time: "09:22 AM",
      label: "Ladder Unit Deployed",
      detail: "Ladder Unit #DC-03 raised to floor 6 for rescue operations.",
      status: "completed",
      icon: Activity,
    },
    {
      time: "09:26 AM",
      label: "Reinforcement En Route",
      detail: "Engine #MH-02 and Foam Tender #DC-07 dispatched.",
      status: "active",
      icon: Truck,
    },
    {
      time: "~09:34 AM",
      label: "Foam Tender Arrival (Est.)",
      detail: "Foam suppression scheduled once unit on scene.",
      status: "pending",
      icon: Circle,
    },
    {
      time: "—",
      label: "Incident Contained",
      detail: "Awaiting full suppression and clearance.",
      status: "pending",
      icon: Shield,
    },
  ],
  relatedAlerts: [
    {
      id: 2,
      type: "smoke_detected",
      priority: "critical",
      title: "Heavy Smoke — Gazipur Industrial Zone",
      message: "Dense smoke plume rising from a textile warehouse.",
      location: "Gazipur Industrial Zone",
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
      title: "Extreme Heat Surge — Chittagong Port",
      message: "Temperature exceeded 480°C inside fuel storage bay 3.",
      location: "Chittagong Port Terminal",
      reportedBy: "Thermocouple #CT-Port-03",
      contactNumber: "031-XXXX-9900",
      timestamp: "Today, 08:31 AM",
      read: true,
      acknowledged: true,
    },
    {
      id: 5,
      type: "equipment_failure",
      priority: "important",
      title: "Pump Failure — Rajshahi Station",
      message: "Primary water pump on Engine #RJ-02 has stalled.",
      location: "Rajshahi Fire Station No. 1",
      reportedBy: "Engine Diagnostics",
      contactNumber: "0721-XXXX-5500",
      timestamp: "Today, 06:20 AM",
      read: false,
      acknowledged: false,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG  (mirror of AllNotifications PRIORITY_META)
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
    glow: "shadow-red-900/50",
    dotColor: "bg-red-500",
    heroGrad: "from-red-950/80 via-slate-950 to-slate-950",
    heroBorder: "border-red-900/40",
  },
  important: {
    label: "Important",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800/40",
    badge: "bg-amber-600 text-white hover:bg-amber-600",
    barColor: "bg-amber-500",
    glow: "shadow-amber-900/50",
    dotColor: "bg-amber-500",
    heroGrad: "from-amber-950/80 via-slate-950 to-slate-950",
    heroBorder: "border-amber-900/40",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-950/30",
    border: "border-sky-800/40",
    badge: "bg-sky-700 text-white hover:bg-sky-700",
    barColor: "bg-sky-500",
    glow: "shadow-sky-900/50",
    dotColor: "bg-sky-500",
    heroGrad: "from-sky-950/60 via-slate-950 to-slate-950",
    heroBorder: "border-sky-900/40",
  },
} as const;

const UNIT_STATUS_META = {
  on_scene: {
    label: "On Scene",
    color: "text-emerald-400",
    bg: "bg-emerald-950/50",
    border: "border-emerald-800/50",
    dot: "bg-emerald-500",
  },
  en_route: {
    label: "En Route",
    color: "text-amber-400",
    bg: "bg-amber-950/40",
    border: "border-amber-800/40",
    dot: "bg-amber-500",
  },
  standby: {
    label: "Standby",
    color: "text-sky-400",
    bg: "bg-sky-950/30",
    border: "border-sky-800/40",
    dot: "bg-sky-500",
  },
  returned: {
    label: "Returned",
    color: "text-slate-400",
    bg: "bg-slate-800/40",
    border: "border-slate-700/40",
    dot: "bg-slate-500",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
const SingleNotificationPage = () => {
  const [data, setData] = useState<NotificationDetail>(DETAIL);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<
    { author: string; text: string; time: string }[]
  >([
    {
      author: "Cmdr. Rahman A.",
      text: "IC assigned. Ladder crew working on floor 6 rescue. Awaiting foam unit.",
      time: "09:21 AM",
    },
  ]);
  const [copied, setCopied] = useState(false);

  const meta = PRIORITY_META[data.priority];
  const HeroIcon = meta.icon;
  const isCriticalUnack = data.priority === "critical" && !data.acknowledged;

  const handleAcknowledge = () =>
    setData((d) => ({ ...d, acknowledged: true, read: true }));
  const handleMarkRead = () => setData((d) => ({ ...d, read: true }));

  const postComment = () => {
    if (!comment.trim()) return;
    setComments((c) => [
      ...c,
      {
        author: "You",
        text: comment.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setComment("");
  };

  const copyId = () => {
    navigator.clipboard.writeText(data.incidentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top Status Strip ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Activity
                size={13}
                className={
                  isCriticalUnack
                    ? "text-red-400 animate-pulse"
                    : "text-green-500"
                }
              />
              <span
                className={`text-[11px] font-semibold uppercase tracking-widest ${isCriticalUnack ? "text-red-400" : "text-green-500"}`}
              >
                {isCriticalUnack
                  ? "Active Alert"
                  : data.acknowledged
                    ? "Acknowledged"
                    : "Monitored"}
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

      {/* ── Hero Banner ── */}
      <div
        className={`relative bg-gradient-to-b ${meta.heroGrad} border-b ${meta.heroBorder}`}
      >
        {/* subtle pulse glow for unacknowledged critical */}
        {data.priority === "critical" && !data.acknowledged && (
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
              <div className="relative flex-shrink-0">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${meta.bg} border ${meta.border} shadow-lg ${meta.glow}`}
                >
                  <HeroIcon
                    size={26}
                    className={meta.color}
                    strokeWidth={1.8}
                  />
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
                  {!data.read && (
                    <Badge
                      variant="outline"
                      className="border-slate-700 text-slate-500 text-[10px] px-2 py-0 rounded-full"
                    >
                      Unread
                    </Badge>
                  )}
                  {data.acknowledged && (
                    <Badge
                      variant="outline"
                      className="border-emerald-800/60 text-emerald-500 text-[10px] px-2 py-0 rounded-full flex items-center gap-1"
                    >
                      <CheckCircle2 size={10} /> Acknowledged
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-2 leading-tight">
                  {data.title}
                </h1>
                {/* Incident ID + timestamp */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={copyId}
                    className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-300 transition-colors group"
                  >
                    <span className="font-mono text-slate-600 group-hover:text-slate-400">
                      {data.incidentId}
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
                    <Clock size={11} /> {data.timestamp}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isCriticalUnack && (
                <Button
                  onClick={handleAcknowledge}
                  className="bg-red-600 hover:bg-red-500 text-white text-[12px] font-semibold gap-1.5 h-9 px-4 rounded-lg shadow-lg shadow-red-900/40"
                >
                  <Shield size={14} /> Acknowledge
                </Button>
              )}
              {!data.read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkRead}
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

      {/* ── Body: two-column layout ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ════════════════════════════════ LEFT (2 cols) ════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* ── Alert Summary ── */}
          <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} className="text-slate-500" /> Alert Summary
              </h2>
            </div>
            <div className="p-5">
              <p className="text-[14px] text-slate-300 leading-relaxed">
                {data.message}
              </p>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-5 pt-5 border-t border-slate-800">
                {[
                  { icon: MapPin, label: "Location", value: data.location },
                  {
                    icon: Navigation,
                    label: "Coordinates",
                    value: `${data.coordinates.lat}°N, ${data.coordinates.lng}°E`,
                  },
                  { icon: Radio, label: "Reported By", value: data.reportedBy },
                  { icon: Phone, label: "Contact", value: data.contactNumber },
                  {
                    icon: Users,
                    label: "Est. People",
                    value: `${data.estimatedPeople} residents`,
                  },
                  { icon: Wind, label: "Wind", value: data.windDirection },
                  {
                    icon: Thermometer,
                    label: "Temperature",
                    value: data.temperature,
                  },
                  {
                    icon: FileText,
                    label: "Structure",
                    value: data.structureType,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={13} className="text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-[13px] text-slate-300 mt-0.5 leading-snug">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Google Maps link */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <a
                  href={`https://maps.google.com/?q=${data.coordinates.lat},${data.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <MapPin size={13} /> View on Google Maps{" "}
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </Card>

          {/* ── Dispatched Units ── */}
          <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Truck size={14} className="text-slate-500" /> Dispatched Units
              </h2>
              <Badge className="bg-slate-800 text-slate-400 text-[10px] border border-slate-700 rounded-full px-2">
                {data.units.length} units
              </Badge>
            </div>
            <div className="divide-y divide-slate-800">
              {data.units.map((unit) => {
                const uMeta = UNIT_STATUS_META[unit.status];
                return (
                  <div
                    key={unit.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    {/* Animated status dot */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${uMeta.dot}`}
                      />
                      {unit.status === "en_route" && (
                        <span
                          className={`absolute inset-0 rounded-full ${uMeta.dot} opacity-40 animate-ping`}
                        />
                      )}
                    </div>
                    {/* Unit info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-200">
                          {unit.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                          {unit.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {unit.station} · {unit.personnel} personnel
                      </p>
                    </div>
                    {/* ETA + status badge */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {unit.status !== "on_scene" &&
                        unit.status !== "returned" && (
                          <span className="text-[11px] text-slate-600 flex items-center gap-1">
                            <Clock size={10} /> {unit.eta}
                          </span>
                        )}
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${uMeta.bg} ${uMeta.border} ${uMeta.color}`}
                      >
                        {uMeta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── Activity & Comments ── */}
          <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <User size={14} className="text-slate-500" /> Activity &
                Comments
              </h2>
            </div>
            <div className="p-5">
              {/* Existing comments */}
              <div className="flex flex-col gap-3">
                {comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                      <User size={13} className="text-slate-500" />
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-lg px-3.5 py-2.5 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-slate-300">
                          {c.author}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {c.time}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input box */}
              <div className="mt-4 flex gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={13} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        postComment();
                      }
                    }}
                    placeholder="Post a comment or update…"
                    rows={2}
                    className="bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-600 text-[13px] rounded-lg resize-none focus:border-red-800 focus:ring-0"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={postComment}
                      disabled={!comment.trim()}
                      className="bg-red-600 hover:bg-red-500 text-white text-[12px] gap-1.5 h-8 px-4 rounded-lg disabled:opacity-30"
                    >
                      <Send size={12} /> Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ════════════════════════════════ RIGHT (1 col) ════════════════════════════════ */}
        <div className="flex flex-col gap-5">
          {/* ── Live Timeline ── */}
          <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} className="text-slate-500" /> Live Timeline
              </h2>
            </div>
            <div className="px-5 py-4">
              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-[9px] top-3 bottom-3 w-px bg-slate-800" />

                {data.timeline.map((ev, i) => {
                  const Icon = ev.icon;
                  const isDone = ev.status === "completed";
                  const isActive = ev.status === "active";
                  const isPending = ev.status === "pending";

                  return (
                    <div
                      key={i}
                      className={`relative flex gap-3.5 ${i < data.timeline.length - 1 ? "pb-5" : ""}`}
                    >
                      {/* Dot */}
                      <div
                        className="relative flex-shrink-0 z-10"
                        style={{ width: "18px", height: "18px" }}
                      >
                        <div
                          className={`w-full h-full rounded-full flex items-center justify-center border-2
                            ${isDone ? "bg-emerald-600 border-emerald-500" : ""}
                            ${isActive ? "bg-amber-600  border-amber-500" : ""}
                            ${isPending ? "bg-slate-800  border-slate-700" : ""}
                          `}
                        >
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
                          <span
                            className={`text-[12px] font-semibold
                            ${isDone ? "text-slate-400" : ""}
                            ${isActive ? "text-amber-400" : ""}
                            ${isPending ? "text-slate-600" : ""}
                          `}
                          >
                            {ev.label}
                          </span>
                          {isActive && (
                            <Badge className="bg-amber-600/20 text-amber-400 border border-amber-800/40 text-[9px] px-1.5 py-0 rounded-full">
                              LIVE
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 leading-relaxed
                          ${isDone ? "text-slate-600" : isPending ? "text-slate-700" : "text-slate-500"}
                        `}
                        >
                          {ev.detail}
                        </p>
                        <span className="text-[10px] text-slate-700">
                          {ev.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* ── Related Alerts ── */}
          <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Bell size={14} className="text-slate-500" /> Related Alerts
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {data.relatedAlerts.map((alert) => {
                const rMeta = PRIORITY_META[alert.priority];
                const RIcon = rMeta.icon;
                return (
                  <Link
                    key={alert.id}
                    href={`/notifications/${alert.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Left priority bar */}
                    <div
                      className={`flex-shrink-0 w-0.5 self-stretch rounded-full ${rMeta.barColor} opacity-60`}
                    />
                    {/* Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${rMeta.bg} border ${rMeta.border}`}
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
                      className="text-slate-700 group-hover:text-slate-500 flex-shrink-0 mt-1 transition-colors"
                    />
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-t border-slate-900">
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

export default SingleNotificationPage;
