"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  Droplets,
  Flame,
  Search,
  Thermometer,
  Wind,
  Wifi,
  WifiOff,
  FlaskConical,
} from "lucide-react";
import { EmptyState, Panel, inputClass } from "./Primitives";
import { Sparkline } from "./charts/Sparkline";
import { RiskMeter } from "./charts/RiskMeter";
import { riskBand } from "./charts/tokens";
import type { TelemetryDevice } from "@/api/types";
import type { LiveReading } from "@/redux/slices/telemetrySlice";

interface TelemetryTabProps {
  telemetry: TelemetryDevice[];
  history: Record<string, LiveReading[]>;
  socketConnected: boolean;
  loading: boolean;
}

/** Thresholds mirror the backend risk engine defaults. */
const THRESHOLDS = { smoke: 80, gas: 300, temp: 50 };

export const TelemetryTab: React.FC<TelemetryTabProps> = ({
  telemetry,
  history,
  socketConnected,
  loading,
}) => {
  const [query, setQuery] = useState("");
  const [onlyAlerting, setOnlyAlerting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return telemetry.filter((d) => {
      if (onlyAlerting && d.readings.riskScore < 40) return false;
      if (!q) return true;
      return [d.deviceCode, d.label, d.building, d.room, d.sector]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [telemetry, query, onlyAlerting]);

  const alerting = telemetry.filter((d) => d.readings.riskScore >= 40).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Filters sit in one row above the cards. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by unit, room, building…"
            className={`${inputClass} pl-9`}
            aria-label="Filter sensor units"
          />
        </div>

        <button
          onClick={() => setOnlyAlerting((v) => !v)}
          className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
            onlyAlerting
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity size={13} />
          Elevated only
          <span className="rounded-full bg-slate-800 px-1.5 text-[10px] tabular-nums">
            {alerting}
          </span>
        </button>

        <div
          className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-semibold ${
            socketConnected
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-slate-700 bg-slate-900/60 text-slate-500"
          }`}
        >
          {socketConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {socketConnected ? "Live" : "Reconnecting"}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel title="Sensor units" icon={Activity} bodyClassName="p-0">
          <EmptyState
            icon={Activity}
            title={loading ? "Loading units…" : "No units match"}
            message={
              telemetry.length === 0
                ? "No devices are registered yet. Add one from the Devices tab, then run the simulator or connect an Arduino unit."
                : "Try clearing the search or the elevated-only filter."
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((device) => (
            <SensorCard
              key={device.id}
              device={device}
              history={history[device.deviceCode] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sensor card ──────────────────────────────────────────────────────────────

const SensorCard: React.FC<{
  device: TelemetryDevice;
  history: LiveReading[];
}> = ({ device, history }) => {
  const r = device.readings;
  const band = riskBand(r.riskScore);
  const hasFlame = r.flame === 1;

  const series = (key: keyof LiveReading) =>
    history.map((h) => Number(h[key])).filter((n) => Number.isFinite(n));

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-slate-900/60 transition-colors ${
        hasFlame || r.riskScore >= 70
          ? "border-red-500/40"
          : r.riskScore >= 40
            ? "border-amber-500/30"
            : "border-slate-800"
      }`}
    >
      {/* Critical units get a moving sweep so they catch the eye on a wall display. */}
      {r.riskScore >= 70 && (
        <div className="sfas-sweep relative h-0.5 overflow-hidden bg-red-950" />
      )}

      <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                device.online ? "bg-emerald-500" : "bg-slate-600"
              }`}
            />
            <h3 className="truncate text-sm font-semibold text-slate-100">
              {device.label ?? device.deviceCode}
            </h3>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {device.deviceCode} · {device.building ?? "Unassigned"} · Floor{" "}
            {device.floor}
          </p>
        </div>

        {!device.online && (
          <span className="shrink-0 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Offline
          </span>
        )}
      </header>

      <div className="flex items-center gap-4 px-4 py-4">
        <RiskMeter score={r.riskScore} size={96} />

        <div className="min-w-0 flex-1">
          {hasFlame && (
            <div className="mb-2 flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1.5">
              <Flame size={12} className="shrink-0 text-red-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">
                Flame detected
              </span>
            </div>
          )}

          <ul className="flex flex-col gap-1.5">
            <Reading
              icon={Thermometer}
              label="Temp"
              value={`${r.temperature.toFixed(1)}°C`}
              over={r.temperature >= THRESHOLDS.temp}
              values={series("temperature")}
              threshold={THRESHOLDS.temp}
            />
            <Reading
              icon={Droplets}
              label="Humidity"
              value={`${r.humidity.toFixed(0)}%`}
              values={series("humidity")}
            />
            <Reading
              icon={Wind}
              label="Smoke"
              value={r.smoke.toFixed(0)}
              over={r.smoke >= THRESHOLDS.smoke}
              values={series("smoke")}
              threshold={THRESHOLDS.smoke}
            />
            <Reading
              icon={FlaskConical}
              label="Gas"
              value={r.gas.toFixed(0)}
              over={r.gas >= THRESHOLDS.gas}
              values={series("gas")}
              threshold={THRESHOLDS.gas}
            />
          </ul>
        </div>
      </div>

      <footer className="border-t border-slate-800 px-4 py-2.5">
        <p className="text-[10px] text-slate-500">
          <span style={{ color: band.hex }} className="font-semibold">
            {band.label}
          </span>
          {" · "}
          {r.readAt
            ? `updated ${new Date(r.readAt).toLocaleTimeString()}`
            : "awaiting first reading"}
        </p>
      </footer>
    </article>
  );
};

const Reading: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  over?: boolean;
  values: number[];
  threshold?: number;
}> = ({ icon: Icon, label, value, over, values, threshold }) => (
  <li className="flex items-center gap-2">
    <Icon
      size={12}
      className={over ? "shrink-0 text-amber-400" : "shrink-0 text-slate-600"}
    />
    <span className="w-16 shrink-0 text-[11px] text-slate-500">{label}</span>
    <span
      className={`w-14 shrink-0 text-xs font-semibold tabular-nums ${
        over ? "text-amber-300" : "text-slate-200"
      }`}
    >
      {value}
    </span>
    <span className="min-w-0 flex-1">
      <Sparkline
        values={values}
        width={72}
        height={20}
        threshold={threshold}
        color={over ? "#f59e0b" : "#3987e5"}
        ariaLabel={`${label} trend`}
      />
    </span>
  </li>
);
