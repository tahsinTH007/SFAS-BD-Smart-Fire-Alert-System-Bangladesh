"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Clock,
  MapPin,
  Radio,
  Phone,
  Users,
  Thermometer,
  Eye,
  Shield,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { MapAlert } from "../types/mapAlert";
import { PRIORITY_META, UNIT_STATUS_COLORS } from "../config/priorityMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";

interface AlertSheetProps {
  alert: MapAlert;
  onClose: () => void;
}

function getPriorityConfig(priority: string) {
  const normalized = (priority || "info").toLowerCase();
  return (
    PRIORITY_META[normalized as keyof typeof PRIORITY_META] ||
    PRIORITY_META["info"]
  );
}

export const AlertSheet: React.FC<AlertSheetProps> = ({ alert, onClose }) => {
  const meta = getPriorityConfig(alert.priority);
  const Icon = meta.icon;

  // ✅ coordinates is now [number, number] | null — safe to access
  const coordsDisplay = alert.coordinates
    ? `${alert.coordinates[0].toFixed(5)}, ${alert.coordinates[1].toFixed(5)}`
    : "N/A";

  const googleMapsUrl = alert.coordinates
    ? `https://maps.google.com/?q=${alert.coordinates[0]},${alert.coordinates[1]}`
    : null;

  const detailItems = [
    { icon: MapPin, label: "Location", value: alert.location },
    { icon: Radio, label: "Reported By", value: alert.reportedBy },
    { icon: Phone, label: "Contact", value: String(alert.contactNumber) },
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
      value: coordsDisplay,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Header */}
      <div
        className={`relative border-b ${meta.border} bg-linear-to-b from-slate-900 to-slate-950`}
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
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </SheetClose>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Message */}
        <p className="text-[13px] text-slate-300 leading-relaxed">
          {alert.message}
        </p>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-3">
          {detailItems.map(({ icon: Ico, label, value }) => (
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
              <p className="text-[12px] text-slate-300 leading-snug">
                {value || "-"}
              </p>
            </div>
          ))}
        </div>

        {/* ✅ Google Maps link — only render when coordinates exist */}
        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] text-sky-400 hover:text-sky-300"
          >
            <MapPin size={12} /> Open in Google Maps
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 px-6 py-4 flex justify-between">
        <Link href={`/notifications/${alert.id}`}>
          <Button size="sm" className="bg-red-600 hover:bg-red-500">
            <Eye size={13} /> Full Details
          </Button>
        </Link>

        {!alert.acknowledged && (
          <Button size="sm">
            <Shield size={13}/> Acknowledge
          </Button>
        )}
      </div>
    </div>
  );
};
