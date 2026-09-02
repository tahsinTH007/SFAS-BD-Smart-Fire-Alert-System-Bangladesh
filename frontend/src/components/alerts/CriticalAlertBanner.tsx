"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  Flame,
  MapPin,
  Radio,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { AppDispatch, RootState } from "@/redux/store";
import { acknowledgeAlert } from "@/redux/slices/alertSlice";
import { playAlertTone } from "@/socket/socketClient";
import type { AlertResponse } from "@/api/types";

/**
 * Full-screen takeover for unacknowledged critical alerts.
 *
 * A toast in the corner is the wrong weight for "there is a fire in a building
 * with 320 people in it" — an operator may be looking at another tab or across
 * the room. This blocks the console until someone acknowledges, re-sounds the
 * alarm on an interval, and shows the acknowledge action as the primary control.
 */
/** How recently an alert must have been raised to still take over the screen. */
const FRESH_WINDOW_MS = 10 * 60_000;

export const CriticalAlertBanner: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const alerts = useSelector((s: RootState) => s.alerts.alerts);
  const liveIds = useSelector((s: RootState) => s.alerts.liveIds);
  const mutating = useSelector((s: RootState) => s.alerts.mutating);
  const prefs = useSelector((s: RootState) => s.session.prefs);

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Newest unacknowledged critical alert that hasn't been snoozed — and that is
   * actually *current*. Either it arrived over the socket while this console was
   * open, or it was raised within the freshness window. Without this an operator
   * opening the console to a backlog of old criticals would face a wall of
   * takeovers before they could do anything.
   */
  const active: AlertResponse | null = useMemo(() => {
    if (!prefs.criticalBanner) return null;

    const live = new Set(liveIds);
    const cutoff = Date.now() - FRESH_WINDOW_MS;

    return (
      alerts.find((a) => {
        if (a.priority !== "critical") return false;
        if (a.acknowledged || a.status !== "active") return false;
        if (dismissed.has(a.id)) return false;

        if (live.has(a.id)) return true;
        const raised = a.timestampISO ? Date.parse(a.timestampISO) : 0;
        return raised >= cutoff;
      }) ?? null
    );
  }, [alerts, dismissed, prefs.criticalBanner, liveIds]);

  const queued = useMemo(
    () =>
      alerts.filter(
        (a) =>
          a.priority === "critical" && !a.acknowledged && a.status === "active",
      ).length,
    [alerts],
  );

  // Re-sound the alarm while a critical alert sits unacknowledged.
  useEffect(() => {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
    if (!active || !prefs.sound || !prefs.repeatUntilAcknowledged) return;

    repeatTimer.current = setInterval(() => playAlertTone("critical"), 12_000);
    return () => {
      if (repeatTimer.current) clearInterval(repeatTimer.current);
    };
  }, [active, prefs.sound, prefs.repeatUntilAcknowledged]);

  // Escape snoozes rather than acknowledges — acknowledging is a deliberate act.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDismissed((d) => new Set(d).add(active.id));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!active) return null;

  const onAcknowledge = async () => {
    await dispatch(acknowledgeAlert(active.id));
  };

  const openDetail = () => {
    setDismissed((d) => new Set(d).add(active.id));
    router.push(`/notifications/${active.id}`);
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="critical-alert-title"
      className="fixed inset-0 z-[10100] flex items-end justify-center bg-red-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-t-2xl border-2 border-red-500/60 bg-slate-950 shadow-[0_0_60px_rgba(239,68,68,0.35)] sm:rounded-2xl">
        {/* Pulsing alarm bar */}
        <div className="sfas-sweep relative h-1.5 overflow-hidden bg-red-600" />

        <div className="px-5 pt-5 sm:px-7 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-red-400 sm:text-xs">
                Critical fire alert
              </span>
              {queued > 1 && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                  +{queued - 1} more
                </span>
              )}
            </div>

            <button
              onClick={() => setDismissed((d) => new Set(d).add(active.id))}
              aria-label="Snooze this alert"
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-red-500/50 bg-red-500/15 sm:h-16 sm:w-16">
              <Flame size={28} className="animate-pulse text-red-400" />
            </span>

            <div className="min-w-0 flex-1">
              <h2
                id="critical-alert-title"
                className="text-2xl font-extrabold leading-tight text-white sm:text-3xl"
              >
                {active.title}
              </h2>
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-red-200/90">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span className="line-clamp-2">
                  {active.location ?? "Unknown location"}
                </span>
              </p>

              {/* The score is the single most important number here, so on
                  narrow screens it moves inline rather than being dropped. */}
              <p className="mt-2 flex items-baseline gap-1.5 sm:hidden">
                <span className="text-3xl font-black leading-none text-red-400 tabular-nums">
                  {active.riskScore}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500/70">
                  risk / 100
                </span>
              </p>
            </div>

            {/* Risk score, huge */}
            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-5xl font-black leading-none text-red-400 tabular-nums">
                {active.riskScore}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500/70">
                risk / 100
              </p>
            </div>
          </div>

          {/* Key facts */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Fact
              icon={Radio}
              label="Unit"
              value={active.deviceId ?? "—"}
            />
            <Fact
              icon={AlertTriangle}
              label="Floor"
              value={
                [active.floor && `F${active.floor}`, active.room]
                  .filter(Boolean)
                  .join(" · ") || "—"
              }
            />
            <Fact
              icon={Users}
              label="At risk"
              value={active.estimatedPeople ?? "—"}
            />
            <Fact
              icon={Flame}
              label="Flame"
              value={active.flame === 1 ? "YES" : "No"}
              alarm={active.flame === 1}
            />
          </div>

          {active.riskFactors.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-300">
                {active.riskFactors.length} sensors agree:
              </span>{" "}
              {active.riskFactors
                .map((f) => f.replace(/-/g, " + "))
                .join(", ")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 bg-slate-900/60 px-5 py-4 sm:flex-row sm:px-7">
          <button
            onClick={onAcknowledge}
            disabled={mutating}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/40 transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            <ShieldCheck size={17} />
            {mutating ? "Acknowledging…" : "Acknowledge"}
          </button>

          <button
            onClick={openDetail}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-6 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            Open incident
          </button>
        </div>

        <p className="pb-4 text-center text-[10px] text-slate-600">
          Press Esc to snooze — the alert stays unacknowledged
        </p>
      </div>
    </div>
  );
};

const Fact: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  alarm?: boolean;
}> = ({ icon: Icon, label, value, alarm }) => (
  <div
    className={`rounded-xl border px-3 py-2 ${
      alarm ? "border-red-500/50 bg-red-500/10" : "border-slate-800 bg-slate-900/60"
    }`}
  >
    <div className="flex items-center gap-1.5">
      <Icon size={10} className={alarm ? "text-red-400" : "text-slate-600"} />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
    <p
      className={`mt-0.5 truncate text-sm font-bold ${
        alarm ? "text-red-300" : "text-slate-100"
      }`}
    >
      {value}
    </p>
  </div>
);
