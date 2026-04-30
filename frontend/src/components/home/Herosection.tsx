"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import {
  Flame,
  AlertTriangle,
  Info,
  MapPin,
  Clock,
  Radio,
  Phone,
  Shield,
  Truck,
  Activity,
  X,
  ChevronRight,
  Eye,
  ExternalLink,
  Users,
  Thermometer,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// ─── shadcn ─────────────────────────────────────────────────────────────────
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Separator } from "../ui/separator";

interface MapAlert {
  id: number;
  type: string;
  priority: string;
  title: string;
  message: string;
  location: string;
  reportedBy: string;
  contactNumber: string;
  timestamp: string;
  acknowledged: boolean;
  coordinates: [number, number];
  estimatedPeople?: number;
  temperature?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT DATA  (geo-placed across Bangladesh)
// ─────────────────────────────────────────────────────────────────────────────
const ALERTS: MapAlert[] = [
  {
    id: 1,
    type: "fire_detected",
    priority: "critical",
    title: "Active Fire — Mohammadpur",
    message:
      "Multi-story residential building fire detected at floors 4–6. Civilians reported trapped. Immediate deployment required.",
    location: "Mohammadpur, Dhaka",
    reportedBy: "Sensor Grid #MH-12",
    contactNumber: "02-8800-4412",
    timestamp: "Today, 09:14 AM",
    acknowledged: false,
    coordinates: [23.7838, 90.3563],
    estimatedPeople: 48,
    temperature: "340°C avg / 480°C peak",
    units: [
      { id: "DC-01", name: "Engine Unit #1", status: "on_scene" },
      { id: "DC-03", name: "Ladder Unit #3", status: "on_scene" },
      { id: "MH-02", name: "Engine Unit #2", status: "en_route" },
    ],
  },
  {
    id: 2,
    type: "smoke_detected",
    priority: "critical",
    title: "Heavy Smoke — Gazipur Industrial",
    message:
      "Dense smoke plume from a textile warehouse. Wind SW — spreading toward residential zone. Air quality critical.",
    location: "Gazipur Industrial Zone",
    reportedBy: "Sensor Grid #GZ-07",
    contactNumber: "02-8800-7731",
    timestamp: "Today, 08:52 AM",
    acknowledged: false,
    coordinates: [23.9999, 90.3744],
    estimatedPeople: 120,
    temperature: "—",
    units: [
      { id: "GZ-01", name: "Engine Unit #1", status: "en_route" },
      { id: "GZ-04", name: "Foam Tender #4", status: "standby" },
    ],
  },
  {
    id: 3,
    type: "heat_surge",
    priority: "critical",
    title: "Heat Surge — Chittagong Port",
    message:
      "Temperature exceeded 480°C inside fuel storage bay 3. Auto-suppression active. Manual backup required.",
    location: "Chittagong Port Terminal",
    reportedBy: "Thermocouple #CT-Port-03",
    contactNumber: "031-9900-0011",
    timestamp: "Today, 08:31 AM",
    acknowledged: true,
    coordinates: [22.5406, 91.8278],
    estimatedPeople: 34,
    temperature: "480°C peak",
    units: [{ id: "CT-02", name: "Foam Tender #2", status: "on_scene" }],
  },
  {
    id: 4,
    type: "unit_dispatched",
    priority: "important",
    title: "Unit Dispatched — Sylhet",
    message:
      "Fire Engine Unit #SL-04 dispatched to Biswanath Upazila — reported kitchen fire at a local hotel.",
    location: "Biswanath, Sylhet",
    reportedBy: "Dispatch Center — Sylhet",
    contactNumber: "0821-1100-2200",
    timestamp: "Today, 07:45 AM",
    acknowledged: false,
    coordinates: [24.7471, 92.1468],
    estimatedPeople: 22,
    units: [{ id: "SL-04", name: "Engine Unit #4", status: "en_route" }],
  },
  {
    id: 5,
    type: "equipment_failure",
    priority: "important",
    title: "Pump Failure — Rajshahi Station",
    message:
      "Primary water pump on Engine #RJ-02 stalled. Backup engaging. Maintenance notified. Unit availability reduced.",
    location: "Rajshahi Fire Station No. 1",
    reportedBy: "Engine Diagnostics",
    contactNumber: "0721-5500-6600",
    timestamp: "Today, 06:20 AM",
    acknowledged: false,
    coordinates: [24.3833, 88.6167],
    units: [],
  },
  {
    id: 6,
    type: "new_report",
    priority: "important",
    title: "Incident Report — Comilla",
    message:
      "Report #2025-0202-87 submitted. Factory fire post-mortem pending sign-off by Station Commander.",
    location: "Comilla Fire Station",
    reportedBy: "Cmdr. Rahman A.",
    contactNumber: "0821-3300-4400",
    timestamp: "Today, 05:10 AM",
    acknowledged: true,
    coordinates: [23.4365, 90.7513],
    units: [],
  },
  {
    id: 7,
    type: "fire_detected",
    priority: "critical",
    title: "Active Fire — Wari Warehouse",
    message:
      "Warehouse fire in Wari district. Two casualties confirmed. Suppression underway — foam units deployed.",
    location: "Wari, Dhaka South",
    reportedBy: "Station Inspector K. Haq",
    contactNumber: "02-8800-8800",
    timestamp: "Yesterday, 11:45 PM",
    acknowledged: true,
    coordinates: [23.7103, 90.4074],
    estimatedPeople: 15,
    temperature: "290°C",
    units: [
      { id: "DS-03", name: "Engine Unit #3", status: "on_scene" },
      { id: "DS-07", name: "Foam Tender #7", status: "on_scene" },
    ],
  },
  {
    id: 8,
    type: "smoke_detected",
    priority: "important",
    title: "Smoke Alert — Khulna Mill",
    message:
      "Low-density smoke detected at a jute mill. Sensor confirmed — fire risk elevated. Patrol unit dispatched.",
    location: "Industrial Area, Khulna",
    reportedBy: "Sensor Grid #KH-03",
    contactNumber: "0841-2200-3300",
    timestamp: "Yesterday, 09:00 AM",
    acknowledged: false,
    coordinates: [22.8456, 89.5518],
    units: [{ id: "KH-02", name: "Patrol Unit #2", status: "en_route" }],
  },
  {
    id: 9,
    type: "fire_detected",
    priority: "critical",
    title: "Active Fire — Jessore Market",
    message:
      "Market-area fire spreading through adjacent wooden structures. Evacuation in progress. 3 units deployed.",
    location: "Old Market, Jessore",
    reportedBy: "Sensor Grid #JS-05",
    contactNumber: "0421-7700-8800",
    timestamp: "Today, 10:02 AM",
    acknowledged: false,
    coordinates: [23.1621, 88.4361],
    estimatedPeople: 67,
    temperature: "395°C",
    units: [
      { id: "JS-01", name: "Engine Unit #1", status: "on_scene" },
      { id: "JS-03", name: "Ladder Unit #3", status: "en_route" },
      { id: "JS-06", name: "Rescue Squad #6", status: "en_route" },
    ],
  },
  {
    id: 10,
    type: "heat_surge",
    priority: "important",
    title: "Heat Warning — Rangpur Cold Storage",
    message:
      "Thermocouple in cold storage bay 2 spiked to 180°C. Electrical fault suspected. Inspection team dispatched.",
    location: "Rangpur Industrial Block",
    reportedBy: "Thermocouple #RP-Bay-02",
    contactNumber: "0521-4400-5500",
    timestamp: "Today, 07:10 AM",
    acknowledged: false,
    coordinates: [25.7439, 89.2752],
    temperature: "180°C spike",
    units: [{ id: "RP-04", name: "Inspection Team", status: "en_route" }],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_META = {
  critical: {
    label: "Critical",
    icon: Flame,
    color: "text-red-400",
    bg: "bg-red-950/70",
    border: "border-red-800/50",
    badge: "bg-red-600 text-white",
    markerColor: "#ef4444",
    markerGlow: "#ef4444",
    outerRing: "#991b1b",
  },
  important: {
    label: "Important",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-950/60",
    border: "border-amber-800/40",
    badge: "bg-amber-600 text-white",
    markerColor: "#f59e0b",
    markerGlow: "#f59e0b",
    outerRing: "#92400e",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-950/50",
    border: "border-sky-800/40",
    badge: "bg-sky-600 text-white",
    markerColor: "#38bdf8",
    markerGlow: "#38bdf8",
    outerRing: "#0369a1",
  },
} as const;

const UNIT_STATUS_COLORS: Record<string, string> = {
  on_scene: "text-emerald-400",
  en_route: "text-amber-400",
  standby: "text-sky-400",
  returned: "text-slate-400",
};

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMICALLY IMPORTED MAP COMPONENT (to avoid SSR issues)
// ─────────────────────────────────────────────────────────────────────────────
const DynamicMap = dynamic(
  () => import("./Mapcomponent").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-600 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-500 rounded-full animate-spin" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    ),
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// SHEET CONTENT  (full detail panel)
// ─────────────────────────────────────────────────────────────────────────────
const AlertSheetContent = ({
  alert,
  onClose,
}: {
  alert: MapAlert;
  onClose: () => void;
}) => {
  const meta = PRIORITY_META[alert.priority];
  const Icon = meta.icon;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header */}
      <div
        className={`relative border-b ${meta.border} bg-gradient-to-b from-slate-900 to-slate-950`}
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.bg} border ${meta.border} shadow-lg`}
              >
                <Icon size={22} className={meta.color} strokeWidth={1.8} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={`${meta.badge} text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-wide`}
                  >
                    {meta.label}
                  </Badge>
                  {alert.acknowledged && (
                    <Badge
                      variant="outline"
                      className="border-emerald-800/60 text-emerald-500 text-[9px] px-2 py-0 rounded-full flex items-center gap-1"
                    >
                      <CheckCircle2 size={9} /> ACK
                    </Badge>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-1.5 leading-tight">
                  {alert.title.replace(/^[\u{1F300}-\u{1FFFF}]\s*/u, "")}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <Clock size={10} /> {alert.timestamp}
                </p>
              </div>
            </div>
            <SheetClose asChild>
              <button className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </SheetClose>
          </div>
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Message */}
        <div>
          <p className="text-[13px] text-slate-300 leading-relaxed">
            {alert.message}
          </p>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: MapPin, label: "Location", value: alert.location },
            { icon: Radio, label: "Reported By", value: alert.reportedBy },
            { icon: Phone, label: "Contact", value: alert.contactNumber },
            ...(alert.estimatedPeople
              ? [
                  {
                    icon: Users,
                    label: "Est. People",
                    value: `${alert.estimatedPeople} at risk`,
                  },
                ]
              : []),
            ...(alert.temperature
              ? [
                  {
                    icon: Thermometer,
                    label: "Temperature",
                    value: alert.temperature,
                  },
                ]
              : []),
            {
              icon: MapPin,
              label: "Coordinates",
              value: `${alert.coordinates[0].toFixed(4)}°N, ${alert.coordinates[1].toFixed(4)}°E`,
            },
          ].map(({ icon: Ico, label, value }) => (
            <div
              key={label}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Ico size={11} className="text-slate-600" />
                <span className="text-[9px] text-slate-600 font-semibold uppercase tracking-wider">
                  {label}
                </span>
              </div>
              <p className="text-[12px] text-slate-300 leading-snug">{value}</p>
            </div>
          ))}
        </div>

        {/* Dispatched Units */}
        {alert.units && alert.units.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck size={12} className="text-slate-500" /> Dispatched Units
              </h3>
              <Badge className="bg-slate-800 text-slate-500 text-[9px] border border-slate-700 rounded-full px-1.5">
                {alert.units.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5">
              {alert.units.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2"
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        unit.status === "on_scene"
                          ? "bg-emerald-500"
                          : unit.status === "en_route"
                            ? "bg-amber-500"
                            : unit.status === "standby"
                              ? "bg-sky-500"
                              : "bg-slate-500"
                      }`}
                    />
                    {unit.status === "en_route" && (
                      <span className="absolute inset-0 rounded-full bg-amber-500 opacity-40 animate-ping" />
                    )}
                  </div>
                  <span className="text-[12px] font-medium text-slate-300 flex-1">
                    {unit.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                    {unit.id}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${UNIT_STATUS_COLORS[unit.status] || "text-slate-500"}`}
                  >
                    {unit.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map link */}
        <a
          href={`https://maps.google.com/?q=${alert.coordinates[0]},${alert.coordinates[1]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-sky-400 hover:text-sky-300 transition-colors"
        >
          <MapPin size={12} /> Open in Google Maps <ExternalLink size={10} />
        </a>
      </div>

      {/* Footer actions */}
      <div className="border-t border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/60">
        <Link
          href={`/notifications/${alert.id}`}
          className="inline-flex items-center gap-1.5"
        >
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-500 text-white text-[12px] gap-1.5 h-9 px-4 rounded-lg"
          >
            <Eye size={13} /> Full Details
            <ChevronRight size={12} />
          </Button>
        </Link>
        {!alert.acknowledged && (
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 bg-slate-900 text-[12px] gap-1.5 h-9"
          >
            <Shield size={13} /> Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION  (main export)
// ─────────────────────────────────────────────────────────────────────────────
const HeroSection = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [sheetAlert, setSheetAlert] = useState<MapAlert | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const criticalCount = ALERTS.filter((a) => a.priority === "critical").length;
  const importantCount = ALERTS.filter(
    (a) => a.priority === "important",
  ).length;
  const infoCount = ALERTS.filter((a) => a.priority === "info").length;
  const activeUnits = ALERTS.reduce(
    (sum, a) =>
      sum +
      (a.units?.filter(
        (u) => u.status === "en_route" || u.status === "on_scene",
      ).length || 0),
    0,
  );

  const handleMarkerClick = useCallback((alert: MapAlert) => {
    setSheetAlert(alert);
    setSheetOpen(true);
  }, []);

  return (
    <section
      className="relative w-full bg-slate-950 text-slate-100"
      style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top Status Strip ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Activity
                size={13}
                className={
                  criticalCount > 0
                    ? "text-red-400 animate-pulse"
                    : "text-green-500"
                }
              />
              <span
                className={`text-[11px] font-semibold uppercase tracking-widest ${criticalCount > 0 ? "text-red-400" : "text-green-500"}`}
              >
                {criticalCount > 0
                  ? `${criticalCount} Active Critical Alert${criticalCount > 1 ? "s" : ""}`
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

      <div className="flex" style={{ height: "calc(100vh - 40px)" }}>
        {/* ──────────── LEFT PANEL — Stats + Legend + Active List ──────────── */}
        <div className="w-80 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
          {/* SFAS-BD Brand */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-950 border border-red-800/60 flex items-center justify-center">
                <Flame size={18} className="text-red-400" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-100 tracking-tight">
                  SFAS-BD
                </p>
                <p className="text-[9.5px] text-slate-600 uppercase tracking-widest">
                  Smart Fire Alert System
                </p>
              </div>
            </div>
          </div>

          <Separator className="border-slate-800" />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-px bg-slate-800">
            {[
              {
                label: "Critical",
                count: criticalCount,
                color: "text-red-400",
                bg: "bg-slate-900",
              },
              {
                label: "Important",
                count: importantCount,
                color: "text-amber-400",
                bg: "bg-slate-900",
              },
              {
                label: "Units",
                count: activeUnits,
                color: "text-emerald-400",
                bg: "bg-slate-900",
              },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} px-3 py-3 text-center`}>
                <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-[9px] text-slate-600 uppercase tracking-wider mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Map legend */}
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-2">
              Map Legend
            </p>
            <div className="flex flex-col gap-1.5">
              {(["critical", "important", "info"] as Priority[]).map((p) => {
                const cfg = PRIORITY_META[p];
                return (
                  <div key={p} className="flex items-center gap-2">
                    <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2`}
                        style={{
                          borderColor: cfg.markerColor,
                          background: cfg.outerRing,
                        }}
                      />
                      <div
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{ background: cfg.markerColor }}
                      />
                    </div>
                    <span className={`text-[11px] font-semibold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-auto">
                      {ALERTS.filter((a) => a.priority === p).length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active alerts list */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-3 pb-1.5">
              <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest">
                Live Alerts
              </p>
            </div>
            <div className="flex flex-col gap-px">
              {ALERTS.map((alert) => {
                const cfg = PRIORITY_META[alert.priority];
                const Icon = cfg.icon;
                const isHov = hoveredId === alert.id;
                return (
                  <button
                    key={alert.id}
                    onMouseEnter={() => setHoveredId(alert.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleMarkerClick(alert)}
                    className={`relative flex items-start gap-2.5 px-4 py-2.5 text-left transition-all duration-150 ${
                      isHov ? "bg-slate-800/60" : "hover:bg-slate-800/30"
                    }`}
                  >
                    {/* Priority bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                        alert.priority === "critical"
                          ? "bg-red-500"
                          : alert.priority === "important"
                            ? "bg-amber-500"
                            : "bg-sky-400"
                      }`}
                    />
                    {/* Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}
                    >
                      <Icon size={13} className={cfg.color} />
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[11.5px] font-semibold truncate ${isHov ? "text-slate-100" : "text-slate-300"}`}
                      >
                        {alert.title.replace(/^[\u{1F300}-\u{1FFFF}]\s*/u, "")}
                      </p>
                      <p className="text-[10px] text-slate-600 truncate mt-0.5">
                        {alert.location}
                      </p>
                    </div>
                    {/* Time */}
                    <span className="text-[9px] text-slate-700 flex-shrink-0 mt-0.5">
                      {alert.timestamp
                        .replace("Today, ", "")
                        .replace("Yesterday, ", "")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom nav link */}
          <div className="border-t border-slate-800 px-4 py-3">
            <Link
              href="/notifications"
              className="flex items-center justify-between text-[12px] text-slate-500 hover:text-slate-300 transition-colors group"
            >
              <span>View All Notifications</span>
              <ArrowRight
                size={13}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>

        {/* ──────────── RIGHT — Full-bleed Map ──────────── */}
        <div className="flex-1 relative">
          <DynamicMap
            alerts={ALERTS}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onMarkerClick={handleMarkerClick}
          />

          {/* Hovered alert info badge (bottom-right of map) */}
          {hoveredId &&
            (() => {
              const hAlert = ALERTS.find((a) => a.id === hoveredId);
              if (!hAlert) return null;
              const cfg = PRIORITY_META[hAlert.priority];
              return (
                <div
                  className="absolute bottom-6 right-6 z-10 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3"
                  style={{
                    borderLeftColor: cfg.markerColor,
                    borderLeftWidth: "3px",
                  }}
                >
                  <Badge
                    className={`${cfg.badge} text-[9px] px-2 py-0.5 rounded-full font-bold`}
                  >
                    {cfg.label}
                  </Badge>
                  <span className="text-[12px] font-semibold text-slate-200">
                    {hAlert.title.replace(/^[\u{1F300}-\u{1FFFF}]\s*/u, "")}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {hAlert.location}
                  </span>
                </div>
              );
            })()}
        </div>
      </div>

      {/* ──────────── SHADCN SHEET MODAL ──────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-[440px] max-w-full p-0 bg-slate-950 border-slate-800 shadow-2xl shadow-black/40 z-[9999]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Alert Details</SheetTitle>
            <SheetDescription>
              View detailed information about this alert
            </SheetDescription>
          </SheetHeader>
          {sheetAlert && (
            <AlertSheetContent
              alert={sheetAlert}
              onClose={() => setSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default HeroSection;
