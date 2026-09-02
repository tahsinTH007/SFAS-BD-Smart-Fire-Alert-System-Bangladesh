"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Activity,
  Bell,
  BellRing,
  Check,
  Cpu,
  Database,
  Monitor,
  Radio,
  Server,
  Settings as SettingsIcon,
  Usb,
  Volume2,
  Wifi,
} from "lucide-react";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  selectActiveStation,
  setStation,
  updatePrefs,
  type NotificationPrefs,
} from "@/redux/slices/sessionSlice";
import {
  playAlertTone,
  requestNotificationPermission,
  measureLatency,
} from "@/socket/socketClient";
import { sensorApi, systemApi } from "@/api/systemApi";
import { Panel } from "@/components/dashboard/components/Primitives";
import { API_BASE_URL, SOCKET_URL } from "@/lib/config";
import type { HealthReport, SerialStatus } from "@/api/types";

const SettingsPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { stations, stationId, prefs } = useSelector(
    (s: RootState) => s.session,
  );
  const activeStation = useSelector(selectActiveStation);
  const connected = useSelector((s: RootState) => s.telemetry.connected);

  const [health, setHealth] = useState<HealthReport | null>(null);
  const [serial, setSerial] = useState<SerialStatus | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    systemApi.health().then(setHealth).catch(() => setHealth(null));
    sensorApi.serialStatus().then(setSerial).catch(() => setSerial(null));
    measureLatency().then(setLatency);

    const id = setInterval(() => {
      void measureLatency().then(setLatency);
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  const toggle = (key: keyof NotificationPrefs) => async () => {
    if (key === "desktop" && !prefs.desktop) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.error("Browser blocked desktop notifications", {
          description: "Allow notifications for this site, then try again.",
        });
        return;
      }
    }
    dispatch(updatePrefs({ [key]: !prefs[key] } as Partial<NotificationPrefs>));
  };

  const changeStation = (id: string) => {
    if (id === stationId) return;
    dispatch(setStation(id));
    const st = stations.find((s) => s._id === id);
    toast.success(`Switched to ${st?.stationCode ?? "station"}`, {
      description: "The console now shows only this station's coverage.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60">
              <SettingsIcon size={19} className="text-slate-300" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-50 sm:text-xl">
                Settings
              </h1>
              <p className="text-xs text-slate-500">
                Station assignment, alerting behaviour and system status
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6">
        {/* ── Station ─────────────────────────────────────────────────── */}
        <Panel
          title="This console's station"
          subtitle="Alerts, units and buildings are scoped to this station"
          icon={Radio}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {stations.map((s) => {
              const active = s._id === stationId;
              return (
                <button
                  key={s._id}
                  onClick={() => changeStation(s._id)}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    active
                      ? "border-orange-500/50 bg-orange-500/10"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                      active
                        ? "border-orange-500/50 bg-orange-500/20"
                        : "border-slate-700 bg-slate-800/60"
                    }`}
                  >
                    {active ? (
                      <Check size={14} className="text-orange-400" />
                    ) : (
                      <Radio size={13} className="text-slate-500" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${active ? "text-orange-300" : "text-slate-200"}`}
                      >
                        {s.stationCode}
                      </span>
                      {active && (
                        <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-slate-400">
                      {s.name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-600">
                      {s.buildingCount ?? 0} buildings · {s.deviceCount ?? 0}{" "}
                      units
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {activeStation && (
            <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
              Showing incidents for{" "}
              <span className="font-semibold text-slate-300">
                {activeStation.name}
              </span>
              . Units and buildings belonging to other stations are hidden from
              every screen, including the live map.
            </p>
          )}
        </Panel>

        {/* ── Alerting ────────────────────────────────────────────────── */}
        <Panel
          title="Alerting"
          subtitle="How this console gets your attention"
          icon={BellRing}
        >
          <div className="flex flex-col divide-y divide-slate-800">
            <Toggle
              icon={Monitor}
              title="Full-screen critical alerts"
              description="Take over the screen until a critical alert is acknowledged. Strongly recommended for a control room."
              checked={prefs.criticalBanner}
              onChange={toggle("criticalBanner")}
            />
            <Toggle
              icon={Volume2}
              title="Alarm sound"
              description="Play a tone when an alert arrives."
              checked={prefs.sound}
              onChange={toggle("sound")}
              action={
                <button
                  onClick={() => playAlertTone("critical")}
                  className="rounded-md border border-slate-700 px-2.5 py-1 text-[10px] font-semibold text-slate-400 transition-colors hover:text-slate-200"
                >
                  Test
                </button>
              }
            />
            <Toggle
              icon={Bell}
              title="Repeat until acknowledged"
              description="Re-sound the alarm every 12 seconds while a critical alert is open."
              checked={prefs.repeatUntilAcknowledged}
              onChange={toggle("repeatUntilAcknowledged")}
            />
            <Toggle
              icon={Monitor}
              title="Desktop notifications"
              description="Show OS notifications even when this tab is in the background."
              checked={prefs.desktop}
              onChange={toggle("desktop")}
            />
          </div>

          <div className="mt-5 border-t border-slate-800 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Notify me about
            </p>
            <div className="mt-2 flex gap-2">
              {(["critical", "important", "info"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => dispatch(updatePrefs({ minPriority: p }))}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                    prefs.minPriority === p
                      ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                      : "border-slate-800 text-slate-400 hover:bg-slate-800/60"
                  }`}
                >
                  {p === "critical"
                    ? "Critical only"
                    : p === "important"
                      ? "Important +"
                      : "Everything"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-600">
              Alerts below this level are still recorded and visible in the
              console — they just don&apos;t interrupt you.
            </p>
          </div>
        </Panel>

        {/* ── System ──────────────────────────────────────────────────── */}
        <Panel
          title="System status"
          subtitle="Live connection health"
          icon={Server}
        >
          <ul className="flex flex-col gap-2.5">
            <StatusRow
              icon={Wifi}
              label="Live alert socket"
              up={connected}
              detail={
                connected
                  ? latency !== null
                    ? `Connected · ${latency} ms round trip`
                    : "Connected"
                  : "Reconnecting…"
              }
            />
            <StatusRow
              icon={Database}
              label="Database"
              up={health?.dependencies.mongodb.up ?? false}
              detail="Alert and device storage"
            />
            <StatusRow
              icon={Activity}
              label="Cache"
              up={health?.dependencies.redis.up ?? false}
              detail="Optional — API works without it"
              optional
            />
            <StatusRow
              icon={Usb}
              label="Arduino serial link"
              up={serial?.connected ?? false}
              detail={
                serial?.connected
                  ? `Connected on ${serial.path} @ ${serial.baudRate}`
                  : `Not connected${serial?.path ? ` (${serial.path})` : ""} — run the simulator to demo`
              }
              optional
            />
          </ul>

          <dl className="mt-4 grid gap-2 border-t border-slate-800 pt-4 sm:grid-cols-2">
            <Meta label="API endpoint" value={API_BASE_URL} />
            <Meta label="Socket endpoint" value={SOCKET_URL} />
            <Meta label="Environment" value={health?.env ?? "—"} />
            <Meta
              label="Detected serial ports"
              value={
                serial?.availablePorts?.length
                  ? serial.availablePorts.map((p) => p.path).join(", ")
                  : "none"
              }
            />
          </dl>
        </Panel>

        {/* ── Detection thresholds (read-only) ────────────────────────── */}
        <Panel
          title="Detection thresholds"
          subtitle="Configured on the server"
          icon={Cpu}
        >
          <p className="text-xs leading-relaxed text-slate-400">
            A reading starts contributing to the risk score at its threshold and
            reaches full weight above it. An alert is raised at a fused score of
            40, and escalates to critical at 70.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Threshold label="Smoke" value="80" unit="ppm" />
            <Threshold label="Gas" value="300" unit="ppm" />
            <Threshold label="Temperature" value="50" unit="°C" />
          </div>

          <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            Change these in{" "}
            <code className="rounded bg-slate-800 px-1 py-0.5 text-slate-300">
              backend/.env
            </code>{" "}
            (SMOKE_THRESHOLD, GAS_THRESHOLD, TEMP_THRESHOLD) and restart the API.
          </p>
        </Panel>

        <div className="pb-4 text-center">
          <Link
            href="/profile"
            className="text-[11px] font-semibold text-sky-400 transition-colors hover:text-sky-300"
          >
            ← Back to profile
          </Link>
        </div>
      </main>
    </div>
  );
};

// ─── Pieces ───────────────────────────────────────────────────────────────────

const Toggle: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, description, checked, onChange, action }) => (
  <div className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
    <Icon size={15} className="mt-0.5 shrink-0 text-slate-500" />

    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-200">{title}</p>
        {action}
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
        {description}
      </p>
    </div>

    <button
      role="switch"
      aria-checked={checked}
      aria-label={title}
      onClick={onChange}
      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-orange-600" : "bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  </div>
);

const StatusRow: React.FC<{
  icon: React.ElementType;
  label: string;
  up: boolean;
  detail: string;
  optional?: boolean;
}> = ({ icon: Icon, label, up, detail, optional }) => (
  <li className="flex items-start gap-2.5">
    <Icon
      size={14}
      className={`mt-0.5 shrink-0 ${up ? "text-emerald-400" : optional ? "text-slate-500" : "text-red-400"}`}
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-200">{label}</span>
        <span
          className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider ${
            up ? "text-emerald-400" : optional ? "text-slate-500" : "text-red-400"
          }`}
        >
          {up ? "Up" : optional ? "Offline" : "Down"}
        </span>
      </div>
      <p className="truncate text-[10px] text-slate-600">{detail}</p>
    </div>
  </li>
);

const Meta: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
      {label}
    </dt>
    <dd className="truncate font-mono text-[11px] text-slate-400">{value}</dd>
  </div>
);

const Threshold: React.FC<{ label: string; value: string; unit: string }> = ({
  label,
  value,
  unit,
}) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5 text-center">
    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-lg font-bold text-slate-100 tabular-nums">
      {value}
      <span className="ml-0.5 text-[10px] font-normal text-slate-500">
        {unit}
      </span>
    </p>
  </div>
);

export default SettingsPage;
