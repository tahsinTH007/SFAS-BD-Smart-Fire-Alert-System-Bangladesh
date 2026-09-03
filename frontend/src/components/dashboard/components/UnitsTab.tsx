"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Activity,
  Ambulance,
  ChevronDown,
  Clock,
  Droplets,
  Flame,
  TowerControl,
  LifeBuoy,
  MapPin,
  Phone,
  Radio,
  Search,
  ShieldCheck,
  Siren,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Panel, StatTile, EmptyState, inputClass } from "./Primitives";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { cn } from "@/lib/utils";
import type {
  CrewMember,
  DispatchRecord,
  Unit,
  UnitStats,
  UnitStatus,
  UnitType,
} from "@/api/types";

interface UnitsTabProps {
  units: Unit[];
  stats: UnitStats | null;
  activeDispatches: DispatchRecord[];
  loading: boolean;
  onSetStatus: (id: string, status: UnitStatus, note?: string) => Promise<unknown>;
  onSetCrewDuty: (
    unitId: string,
    crewId: string,
    onDuty: boolean,
  ) => Promise<unknown>;
  onDispatchStatus: (
    dispatchId: string,
    status: DispatchRecord["status"],
  ) => Promise<unknown>;
}

export const UNIT_TYPE_META: Record<
  UnitType,
  { label: string; icon: LucideIcon }
> = {
  engine: { label: "Engine", icon: Truck },
  ladder: { label: "Ladder", icon: TowerControl },
  rescue: { label: "Rescue", icon: LifeBuoy },
  medic: { label: "Ambulance", icon: Ambulance },
  foam: { label: "Foam tender", icon: Droplets },
  water_tender: { label: "Water tender", icon: Droplets },
  command: { label: "Command", icon: Radio },
};

export const UNIT_STATUS_META: Record<
  UnitStatus,
  { label: string; chip: string; dot: string }
> = {
  available: {
    label: "Resting at station",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-500",
  },
  dispatched: {
    label: "En route",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-500 animate-pulse",
  },
  on_scene: {
    label: "On scene",
    chip: "border-red-500/30 bg-red-500/10 text-red-400",
    dot: "bg-red-500 animate-pulse",
  },
  returning: {
    label: "Returning",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    dot: "bg-sky-400",
  },
  maintenance: {
    label: "Maintenance",
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    dot: "bg-orange-500",
  },
  off_duty: {
    label: "Off duty",
    chip: "border-slate-700 bg-slate-800/60 text-slate-400",
    dot: "bg-slate-600",
  },
};

const ROLE_LABEL: Record<string, string> = {
  officer: "Officer",
  driver: "Driver",
  firefighter: "Firefighter",
  paramedic: "Paramedic",
  technician: "Technician",
  rescuer: "Rescuer",
};

export const UnitsTab: React.FC<UnitsTabProps> = ({
  units,
  stats,
  activeDispatches,
  loading,
  onSetStatus,
  onSetCrewDuty,
  onDispatchStatus,
}) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "resting" | "committed">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return units.filter((u) => {
      if (filter === "resting" && u.status !== "available") return false;
      if (
        filter === "committed" &&
        !["dispatched", "on_scene", "returning"].includes(u.status)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        u.unitCode.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.crew.some((c) => c.name.toLowerCase().includes(q))
      );
    });
  }, [units, query, filter]);

  const dispatchByUnit = useMemo(() => {
    const m = new Map<string, DispatchRecord>();
    for (const d of activeDispatches) {
      const uid = typeof d.unitId === "string" ? d.unitId : d.unitId._id;
      m.set(uid, d);
    }
    return m;
  }, [activeDispatches]);

  return (
    <div className="flex flex-col gap-5">
      {/* Readiness at a glance */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Ready to go"
          value={stats?.available ?? 0}
          icon={ShieldCheck}
          accent={stats?.available ? "good" : "critical"}
          hint={`of ${stats?.total ?? 0} units`}
          loading={loading && !stats}
        />
        <StatTile
          label="Committed"
          value={(stats?.dispatched ?? 0) + (stats?.onScene ?? 0)}
          icon={Siren}
          accent={
            (stats?.dispatched ?? 0) + (stats?.onScene ?? 0) > 0
              ? "important"
              : "neutral"
          }
          hint={`${stats?.onScene ?? 0} on scene`}
          loading={loading && !stats}
        />
        <StatTile
          label="Crew on duty"
          value={stats?.crew.onDuty ?? 0}
          icon={Users}
          accent="info"
          hint={`of ${stats?.crew.total ?? 0} personnel`}
          loading={loading && !stats}
        />
        <StatTile
          label="Out of service"
          value={(stats?.maintenance ?? 0) + (stats?.offDuty ?? 0)}
          icon={Wrench}
          accent={
            (stats?.maintenance ?? 0) + (stats?.offDuty ?? 0) > 0
              ? "important"
              : "good"
          }
          hint="Maintenance or off duty"
          loading={loading && !stats}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by unit, vehicle or crew member…"
            className={`${inputClass} pl-9`}
            aria-label="Search units"
          />
        </div>

        <div className="flex gap-0.5 rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
          {(
            [
              ["all", "All"],
              ["resting", "Resting"],
              ["committed", "Committed"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors",
                filter === key
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Unit board */}
      {filtered.length === 0 ? (
        <Panel title="Response units" icon={Truck} bodyClassName="p-0">
          <EmptyState
            icon={Truck}
            title={loading ? "Loading units…" : "No units match"}
            message={
              units.length === 0
                ? "No response units are registered for this station yet."
                : "Try clearing the search or filter."
            }
          />
        </Panel>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((unit) => (
            <UnitCard
              key={unit._id}
              unit={unit}
              dispatch={dispatchByUnit.get(unit._id)}
              expanded={expanded === unit._id}
              onToggle={() =>
                setExpanded((id) => (id === unit._id ? null : unit._id))
              }
              onSetStatus={onSetStatus}
              onSetCrewDuty={onSetCrewDuty}
              onDispatchStatus={onDispatchStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Unit card ────────────────────────────────────────────────────────────────

const UnitCard: React.FC<{
  unit: Unit;
  dispatch?: DispatchRecord;
  expanded: boolean;
  onToggle: () => void;
  onSetStatus: UnitsTabProps["onSetStatus"];
  onSetCrewDuty: UnitsTabProps["onSetCrewDuty"];
  onDispatchStatus: UnitsTabProps["onDispatchStatus"];
}> = ({
  unit,
  dispatch,
  expanded,
  onToggle,
  onSetStatus,
  onSetCrewDuty,
  onDispatchStatus,
}) => {
  const type = UNIT_TYPE_META[unit.type] ?? UNIT_TYPE_META.engine;
  const status = UNIT_STATUS_META[unit.status] ?? UNIT_STATUS_META.off_duty;
  const TypeIcon = type.icon;

  const assignment =
    unit.currentAlertId && typeof unit.currentAlertId === "object"
      ? unit.currentAlertId
      : null;

  const committed = ["dispatched", "on_scene", "returning"].includes(
    unit.status,
  );

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-slate-900/60 transition-colors",
        unit.status === "on_scene"
          ? "border-red-500/40"
          : unit.status === "dispatched"
            ? "border-amber-500/30"
            : "border-slate-800",
      )}
    >
      {/* Header row */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              committed
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-slate-700 bg-slate-800/60",
            )}
          >
            <TypeIcon
              size={19}
              className={committed ? "text-amber-400" : "text-slate-400"}
            />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                {unit.unitCode}
              </h3>
              <span className="text-xs text-slate-500">{unit.name}</span>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  status.chip,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>

            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Users size={10} /> {unit.crewOnDuty}/{unit.crewTotal} on duty
              </span>
              {unit.registration && <span>{unit.registration}</span>}
              {unit.waterCapacityL > 0 && (
                <span>{unit.waterCapacityL.toLocaleString()} L water</span>
              )}
              {unit.ladderReachM > 0 && <span>{unit.ladderReachM} m reach</span>}
            </p>

            {unit.note && (
              <p className="mt-1 text-[11px] italic text-orange-400/80">
                {unit.note}
              </p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {unit.status === "available" && (
            <>
              <button
                onClick={() => onSetStatus(unit._id, "maintenance")}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-slate-800"
              >
                Maintenance
              </button>
              <button
                onClick={() => onSetStatus(unit._id, "off_duty")}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-slate-800"
              >
                Off duty
              </button>
            </>
          )}

          {["maintenance", "off_duty"].includes(unit.status) && (
            <button
              onClick={() => onSetStatus(unit._id, "available")}
              className="rounded-lg border border-emerald-700/60 bg-emerald-600/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-600/20"
            >
              Return to service
            </button>
          )}

          {dispatch && dispatch.status === "assigned" && (
            <button
              onClick={() => onDispatchStatus(dispatch._id, "en_route")}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-amber-500"
            >
              Mark rolling
            </button>
          )}
          {dispatch && dispatch.status === "en_route" && (
            <button
              onClick={() => onDispatchStatus(dispatch._id, "on_scene")}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-red-500"
            >
              Arrived
            </button>
          )}
          {dispatch && ["on_scene", "en_route"].includes(dispatch.status) && (
            <button
              onClick={() => onDispatchStatus(dispatch._id, "cleared")}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              Clear
            </button>
          )}

          <button
            onClick={onToggle}
            aria-expanded={expanded}
            className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            Crew
            <ChevronDown
              size={12}
              className={cn("transition-transform", expanded && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* Current assignment */}
      {assignment && (
        <div className="border-t border-slate-800 bg-slate-950/40 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Flame size={12} className="shrink-0 text-red-400" />
            <Link
              href={`/notifications/${assignment._id}`}
              className="truncate text-xs font-medium text-slate-200 hover:text-sky-300"
            >
              {assignment.title}
            </Link>
            <span className="truncate text-[11px] text-slate-500">
              {assignment.location}
            </span>
            {dispatch?.etaMinutes != null && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-amber-400">
                <Clock size={10} /> ETA {dispatch.etaMinutes} min
                {dispatch.distanceKm != null && ` · ${dispatch.distanceKm} km`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Crew roster */}
      {expanded && (
        <div className="border-t border-slate-800 px-4 py-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Crew roster — {unit.crewOnDuty} of {unit.crewTotal} on duty
          </p>

          {unit.crew.length === 0 ? (
            <p className="text-xs text-slate-500">
              No crew assigned to this unit.
            </p>
          ) : (
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {unit.crew.map((member) => (
                <CrewRow
                  key={member._id ?? member.name}
                  member={member}
                  onToggleDuty={(next) =>
                    member._id
                      ? onSetCrewDuty(unit._id, member._id, next)
                      : Promise.resolve()
                  }
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
};

const CrewRow: React.FC<{
  member: CrewMember;
  onToggleDuty: (next: boolean) => Promise<unknown>;
}> = ({ member, onToggleDuty }) => (
  <li
    className={cn(
      "rounded-lg border px-3 py-2.5",
      member.onDuty
        ? "border-slate-800 bg-slate-950/40"
        : "border-slate-800/60 bg-slate-950/20 opacity-60",
    )}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-200">
          {member.name}
        </p>
        <p className="truncate text-[11px] text-slate-500">
          {member.rank} · {ROLE_LABEL[member.role] ?? member.role}
        </p>
      </div>

      <ToggleSwitch
        checked={member.onDuty}
        onChange={(next) => {
          void onToggleDuty(next);
          toast.success(
            `${member.name} marked ${next ? "on duty" : "off duty"}`,
          );
        }}
        label={member.onDuty ? "On duty" : "Off"}
        className="shrink-0 scale-90"
      />
    </div>

    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
      {member.phone && (
        <a
          href={`tel:${member.phone}`}
          className="flex items-center gap-1 hover:text-sky-400"
        >
          <Phone size={9} /> {member.phone}
        </a>
      )}
      {member.bloodGroup && (
        <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-semibold text-red-400">
          {member.bloodGroup}
        </span>
      )}
      <span>{member.yearsOfService} yr service</span>
    </div>

    {member.certifications.length > 0 && (
      <div className="mt-1.5 flex flex-wrap gap-1">
        {member.certifications.map((c) => (
          <span
            key={c}
            className="rounded border border-slate-700 px-1.5 py-0.5 text-[9px] text-slate-400"
          >
            {c}
          </span>
        ))}
      </div>
    )}
  </li>
);
