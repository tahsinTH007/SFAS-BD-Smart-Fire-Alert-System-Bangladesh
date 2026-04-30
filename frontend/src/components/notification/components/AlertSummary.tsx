import React from "react";
import {
  FileText,
  MapPin,
  Navigation,
  Radio,
  Phone,
  Users,
  Thermometer,
  ExternalLink,
  Cpu,
  Building2,
  Layers,
  DoorOpen,
  Wind,
  Flame,
  FlaskConical,
  AreaChart,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "../../ui/card";
import { getGoogleMapsUrl, formatCoordinates } from "../utils/mapLinks";

interface AlertSummaryProps {
  message: string;
  location: string;
  coordinates: [number, number];
  reportedBy: string;
  contactNumber: string;
  estimatedPeople: string;
  temperature: string;
  type: string;
  status: string;
  deviceId: string;
  sector: string;
  building: string;
  floor: string;
  room: string;
  smokeLevel: number;
  gas: number;
  gasType: string | null;
  affectedArea: string | null;
  read: boolean;
  acknowledged: boolean;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    active: {
      label: "Active",
      cls: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    acknowledged: {
      label: "Acknowledged",
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    resolved: {
      label: "Resolved",
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  };
  const s = map[status] ?? map.active;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}
    >
      {status === "resolved" ? (
        <CheckCircle2 size={9} />
      ) : (
        <AlertCircle size={9} />
      )}
      {s.label.toUpperCase()}
    </span>
  );
};

export const AlertSummary: React.FC<AlertSummaryProps> = ({
  message,
  location,
  coordinates,
  reportedBy,
  contactNumber,
  estimatedPeople,
  temperature,
  type,
  status,
  deviceId,
  sector,
  building,
  floor,
  room,
  smokeLevel,
  gas,
  gasType,
  affectedArea,
  read,
  acknowledged,
}) => {
  const [lat, lng] = coordinates;

  const locationItems = [
    { icon: MapPin, label: "Location", value: location },
    {
      icon: Navigation,
      label: "Coordinates",
      value: formatCoordinates({ lat, lng }),
    },
    { icon: Building2, label: "Building", value: building },
    { icon: Layers, label: "Floor", value: `Floor ${floor}` },
    { icon: DoorOpen, label: "Room", value: room },
    {
      icon: AreaChart,
      label: "Affected Area",
      value: affectedArea ?? "—",
    },
  ];

  const sensorItems = [
    { icon: Flame, label: "Smoke Level", value: `${smokeLevel} ppm` },
    { icon: Thermometer, label: "Temperature", value: `${temperature}°C` },
    { icon: FlaskConical, label: "Gas Level", value: `${gas} ppm` },
    { icon: Wind, label: "Gas Type", value: gasType ?? "—" },
  ];

  const incidentItems = [
    { icon: Radio, label: "Reported By", value: reportedBy },
    { icon: Phone, label: "Contact", value: contactNumber },
    {
      icon: Users,
      label: "Est. People",
      value: `${estimatedPeople} residents`,
    },
    { icon: Cpu, label: "Device ID", value: deviceId },
    { icon: FileText, label: "Sector", value: sector },
  ];

  const Section = ({
    title,
    items,
  }: {
    title: string;
    items: { icon: React.ElementType; label: string; value: string }[];
  }) => (
    <div className="mt-5 pt-5 border-t border-slate-800">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={13} className="text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                {label}
              </p>
              <p className="text-[13px] text-slate-300 mt-0.5 leading-snug truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <FileText size={14} className="text-slate-500" /> Alert Summary
        </h2>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {acknowledged && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-sky-500/10 text-sky-400 border-sky-500/20">
              ACK
            </span>
          )}
          {!read && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Message */}
        <p className="text-[14px] text-slate-300 leading-relaxed whitespace-pre-line">
          {message}
        </p>

        <Section title="Location & Structure" items={locationItems} />
        <Section title="Sensor Readings" items={sensorItems} />
        <Section title="Incident Info" items={incidentItems} />

        {/* Google Maps link */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <a
            href={getGoogleMapsUrl(lat, lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] text-sky-400 hover:text-sky-300 transition-colors"
          >
            <MapPin size={13} /> View on Google Maps <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </Card>
  );
};
