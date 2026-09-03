"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  Check,
  Clock,
  Navigation,
  Route,
  Send,
  Siren,
  Truck,
  Users,
} from "lucide-react";
import type { RootState } from "@/redux/store";
import { unitApi } from "@/api/unitApi";
import { toApiError } from "@/lib/axiosClient";
import { Panel } from "@/components/dashboard/components/Primitives";
import {
  UNIT_STATUS_META,
  UNIT_TYPE_META,
} from "@/components/dashboard/components/UnitsTab";
import { cn } from "@/lib/utils";
import type { DispatchRecord, Unit } from "@/api/types";

interface DispatchPanelProps {
  alertId: string;
  /** Disables assignment once the incident is closed. */
  resolved: boolean;
}

const DISPATCH_STATUS_META: Record<
  DispatchRecord["status"],
  { label: string; chip: string }
> = {
  assigned: {
    label: "Assigned",
    chip: "border-slate-700 bg-slate-800/60 text-slate-300",
  },
  en_route: {
    label: "En route",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  on_scene: {
    label: "On scene",
    chip: "border-red-500/30 bg-red-500/10 text-red-400",
  },
  cleared: {
    label: "Cleared",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    chip: "border-slate-700 bg-slate-800/60 text-slate-500",
  },
};

/**
 * Assigning units to an incident: what is available, how fast each can get
 * there, and the live state of everything already rolling.
 */
export const DispatchPanel: React.FC<DispatchPanelProps> = ({
  alertId,
  resolved,
}) => {
  const stationId = useSelector((s: RootState) => s.session.stationId);
  const operator = useSelector((s: RootState) => s.session.operator.name);

  const [available, setAvailable] = useState<Unit[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [units, active] = await Promise.all([
        unitApi.recommend(alertId, stationId ?? undefined),
        unitApi.dispatchesForAlert(alertId),
      ]);
      setAvailable(units);
      setDispatches(active);

      // Pre-tick the recommended first alarm so one click sends a sane response.
      setSelected(
        new Set(units.filter((u) => u.recommended).map((u) => u._id)),
      );
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [alertId, stationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const send = async () => {
    const ids = [...selected];
    if (!ids.length) return;

    setSending(true);
    try {
      await unitApi.dispatch(alertId, ids, operator);
      toast.success(`${ids.length} unit(s) dispatched`, {
        description: "The incident is now acknowledged.",
      });
      setSelected(new Set());
      await load();
    } catch (err) {
      toast.error(toApiError(err).message);
    } finally {
      setSending(false);
    }
  };

  const advance = async (
    dispatchId: string,
    status: DispatchRecord["status"],
  ) => {
    try {
      await unitApi.setDispatchStatus(dispatchId, status);
      await load();
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  /** Fastest unit overall — the headline recommendation. */
  const fastest = useMemo(
    () => available.find((u) => u.route)?.route ?? null,
    [available],
  );

  const activeDispatches = dispatches.filter(
    (d) => !["cleared", "cancelled"].includes(d.status),
  );

  return (
    <Panel
      title="Dispatch"
      subtitle={
        activeDispatches.length
          ? `${activeDispatches.length} unit(s) committed`
          : "Assign response units"
      }
      icon={Siren}
    >
      {/* ── Already rolling ──────────────────────────────────────────────── */}
      {dispatches.length > 0 && (
        <ul className="mb-5 flex flex-col gap-2.5">
          {dispatches.map((d) => {
            const unit = typeof d.unitId === "object" ? d.unitId : null;
            const meta = DISPATCH_STATUS_META[d.status];
            const TypeIcon = unit
              ? (UNIT_TYPE_META[unit.type]?.icon ?? Truck)
              : Truck;

            return (
              <li
                key={d._id}
                className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <TypeIcon size={14} className="shrink-0 text-slate-400" />
                  <span className="text-xs font-bold text-slate-100">
                    {unit?.unitCode ?? "Unit"}
                  </span>
                  <span className="truncate text-[11px] text-slate-500">
                    {unit?.name}
                  </span>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      meta.chip,
                    )}
                  >
                    {meta.label}
                  </span>

                  {d.etaMinutes != null && (
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={10} />
                      {d.arrivedAt
                        ? `arrived ${new Date(d.arrivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : `ETA ${d.etaMinutes} min`}
                    </span>
                  )}
                </div>

                {d.distanceKm != null && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
                    <Route size={9} />
                    {d.distanceKm} km · {d.routeSource === "osrm" ? "road route" : "estimated route"}
                    {" · dispatched by "}
                    {d.dispatchedBy}
                  </p>
                )}

                {!["cleared", "cancelled"].includes(d.status) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.status === "assigned" && (
                      <button
                        onClick={() => advance(d._id, "en_route")}
                        className="rounded-md bg-amber-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-amber-500"
                      >
                        Rolling
                      </button>
                    )}
                    {d.status === "en_route" && (
                      <button
                        onClick={() => advance(d._id, "on_scene")}
                        className="rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-red-500"
                      >
                        Arrived
                      </button>
                    )}
                    <button
                      onClick={() => advance(d._id, "cleared")}
                      className="rounded-md border border-slate-700 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Assign more ──────────────────────────────────────────────────── */}
      {resolved ? (
        <p className="py-2 text-xs text-slate-500">
          This incident is resolved — no further units can be assigned.
        </p>
      ) : loading ? (
        <p className="py-2 text-xs text-slate-500">Finding available units…</p>
      ) : available.length === 0 ? (
        <p className="py-2 text-xs text-amber-400">
          No units are currently available at this station.
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Available units — nearest first
            </p>
            {fastest && (
              <span className="text-[10px] text-slate-600">
                fastest {fastest.etaMinutes} min
              </span>
            )}
          </div>

          <ul className="flex flex-col gap-1.5">
            {available.map((u) => {
              const TypeIcon = UNIT_TYPE_META[u.type]?.icon ?? Truck;
              const picked = selected.has(u._id);

              return (
                <li key={u._id}>
                  <button
                    onClick={() => toggle(u._id)}
                    aria-pressed={picked}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      picked
                        ? "border-orange-500/50 bg-orange-500/10"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        picked
                          ? "border-orange-500 bg-orange-600"
                          : "border-slate-700",
                      )}
                    >
                      {picked && <Check size={12} className="text-white" />}
                    </span>

                    <TypeIcon size={15} className="shrink-0 text-slate-400" />

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100">
                          {u.unitCode}
                        </span>
                        <span className="truncate text-[11px] text-slate-500">
                          {UNIT_TYPE_META[u.type]?.label}
                        </span>
                        {u.recommended && (
                          <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300">
                            Recommended
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users size={9} /> {u.crewOnDuty} crew
                        </span>
                        {u.route && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Navigation size={9} />
                            {u.route.etaMinutes} min · {u.route.distanceKm} km
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {fastest && (
            <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
              {fastest.source === "osrm"
                ? "Times from a live road route."
                : `Times estimated: ${fastest.basis}.`}{" "}
              Units are ordered by arrival time, not distance.
            </p>
          )}

          <button
            onClick={send}
            disabled={selected.size === 0 || sending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-500 disabled:opacity-40"
          >
            <Send size={15} />
            {sending
              ? "Dispatching…"
              : selected.size === 0
                ? "Select units to dispatch"
                : `Dispatch ${selected.size} unit${selected.size > 1 ? "s" : ""}`}
          </button>
        </>
      )}
    </Panel>
  );
};
