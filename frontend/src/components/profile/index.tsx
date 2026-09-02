"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  Clock,
  Cpu,
  Flame,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Radio,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
} from "lucide-react";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  selectActiveStation,
  updateOperator,
  type OperatorProfile,
} from "@/redux/slices/sessionSlice";
import { fetchTelemetry } from "@/redux/slices/telemetrySlice";
import { fetchAlerts } from "@/redux/slices/alertSlice";
import { Panel, Field, inputClass, StatTile } from "@/components/dashboard/components/Primitives";

const SHIFTS: { value: OperatorProfile["shift"]; label: string }[] = [
  { value: "day", label: "Day (08:00 – 20:00)" },
  { value: "night", label: "Night (20:00 – 08:00)" },
  { value: "rotating", label: "Rotating" },
];

const ProfilePage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const operator = useSelector((s: RootState) => s.session.operator);
  const station = useSelector(selectActiveStation);
  const alerts = useSelector((s: RootState) => s.alerts.alerts);
  const telemetry = useSelector((s: RootState) => s.telemetry.devices);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<OperatorProfile>(operator);

  // The dashboard normally loads these; the profile page is reachable directly.
  const stationId = useSelector((s: RootState) => s.session.stationId);
  useEffect(() => {
    if (!stationId) return;
    void dispatch(fetchTelemetry());
    void dispatch(fetchAlerts());
  }, [dispatch, stationId]);

  // Work actually done by this operator, from the alert records themselves.
  const activity = useMemo(() => {
    const acked = alerts.filter((a) => a.acknowledgedBy === operator.name).length;
    const resolved = alerts.filter((a) => a.resolvedBy === operator.name).length;
    const notes = alerts.reduce(
      (n, a) => n + a.comments.filter((c) => c.author === operator.name).length,
      0,
    );
    return { acked, resolved, notes };
  }, [alerts, operator.name]);

  const recent = useMemo(
    () =>
      alerts
        .filter(
          (a) =>
            a.acknowledgedBy === operator.name || a.resolvedBy === operator.name,
        )
        .slice(0, 6),
    [alerts, operator.name],
  );

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    dispatch(updateOperator({ ...form, name: form.name.trim() }));
    setEditing(false);
    toast.success("Profile updated");
  };

  const initials = operator.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/25 to-red-600/25 text-xl font-bold text-orange-300">
                {initials || "OP"}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
                  {operator.name}
                </h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                  <span>{operator.rank}</span>
                  {operator.badgeId && operator.badgeId !== "—" && (
                    <>
                      <span className="text-slate-700">·</span>
                      <span className="flex items-center gap-1">
                        <BadgeCheck size={11} /> {operator.badgeId}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setForm(operator);
                  setEditing((v) => !v);
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                <Pencil size={13} /> {editing ? "Cancel" : "Edit profile"}
              </button>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                <SettingsIcon size={13} /> Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
        {/* Activity */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile
            label="Acknowledged"
            value={activity.acked}
            icon={ShieldCheck}
            accent="important"
            hint="Alerts you took on"
          />
          <StatTile
            label="Resolved"
            value={activity.resolved}
            icon={Flame}
            accent="good"
            hint="Incidents you closed"
          />
          <StatTile
            label="Log notes"
            value={activity.notes}
            icon={Pencil}
            accent="info"
            hint="Written on incidents"
          />
          <StatTile
            label="Units watched"
            value={telemetry.length}
            icon={Cpu}
            accent="neutral"
            hint="In this station"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Details / edit form */}
          <Panel
            title="Operator details"
            subtitle={editing ? "Editing" : "Shown against your actions"}
            icon={User}
            className="lg:col-span-2"
            action={
              editing ? (
                <button
                  onClick={save}
                  className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-500"
                >
                  Save
                </button>
              ) : undefined
            }
          >
            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <input
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Rank">
                  <input
                    className={inputClass}
                    value={form.rank}
                    onChange={(e) => setForm({ ...form, rank: e.target.value })}
                    placeholder="Station Officer"
                  />
                </Field>
                <Field label="Badge / service ID">
                  <input
                    className={inputClass}
                    value={form.badgeId}
                    onChange={(e) =>
                      setForm({ ...form, badgeId: e.target.value })
                    }
                    placeholder="FSCD-1042"
                  />
                </Field>
                <Field label="Shift">
                  <select
                    className={inputClass}
                    value={form.shift}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        shift: e.target.value as OperatorProfile["shift"],
                      })
                    }
                  >
                    {SHIFTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Phone">
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+8801XXXXXXXXX"
                  />
                </Field>
                <Field label="Email">
                  <input
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="operator@fscd.gov.bd"
                  />
                </Field>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Row label="Full name" value={operator.name} icon={User} />
                <Row label="Rank" value={operator.rank} icon={BadgeCheck} />
                <Row label="Badge / service ID" value={operator.badgeId} />
                <Row
                  label="Shift"
                  value={
                    SHIFTS.find((s) => s.value === operator.shift)?.label ?? "—"
                  }
                  icon={Clock}
                />
                <Row label="Phone" value={operator.phone} icon={Phone} />
                <Row label="Email" value={operator.email} icon={Mail} />
              </dl>
            )}

            <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
              This name is written onto every alert you acknowledge or resolve.
              It is stored in this browser only — there is no login yet, so it is
              a label, not an identity.
            </p>
          </Panel>

          {/* Posting */}
          <Panel title="Posting" subtitle="Your station" icon={Radio}>
            {station ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-lg font-bold text-slate-50">
                    {station.stationCode}
                  </p>
                  <p className="text-xs text-slate-400">{station.name}</p>
                </div>

                <dl className="flex flex-col gap-2 border-t border-slate-800 pt-3">
                  <MiniRow
                    icon={MapPin}
                    label="Area"
                    value={
                      [station.district, station.division]
                        .filter(Boolean)
                        .join(", ") || "—"
                    }
                  />
                  <MiniRow
                    icon={Building2}
                    label="Buildings"
                    value={String(station.buildingCount ?? 0)}
                  />
                  <MiniRow
                    icon={Cpu}
                    label="Sensor units"
                    value={String(station.deviceCount ?? 0)}
                  />
                  <MiniRow
                    icon={Phone}
                    label="Contact"
                    value={station.contactNumber ?? "—"}
                  />
                </dl>

                <Link
                  href="/settings"
                  className="mt-1 text-center text-[11px] font-semibold text-sky-400 transition-colors hover:text-sky-300"
                >
                  Change station →
                </Link>
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-slate-500">
                No station selected
              </p>
            )}
          </Panel>
        </div>

        {/* Recent actions */}
        <Panel
          title="Your recent actions"
          subtitle="Incidents you acknowledged or resolved"
          icon={Clock}
          bodyClassName="p-0"
        >
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-xs text-slate-500">
              Nothing yet. Alerts you acknowledge or resolve will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/notifications/${a.id}`}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-800/40 sm:px-5"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        a.status === "resolved"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {a.title}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {a.location ?? "—"} ·{" "}
                        {a.resolvedBy === operator.name
                          ? "resolved"
                          : "acknowledged"}{" "}
                        by you
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-600">
                      {a.timestamp}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </main>
    </div>
  );
};

const Row: React.FC<{
  label: string;
  value: string;
  icon?: React.ElementType;
}> = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
    <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
      {Icon && <Icon size={10} />} {label}
    </dt>
    <dd className="mt-0.5 truncate text-sm text-slate-200">{value || "—"}</dd>
  </div>
);

const MiniRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2">
    <Icon size={12} className="shrink-0 text-slate-600" />
    <span className="text-[11px] text-slate-500">{label}</span>
    <span className="ml-auto truncate text-xs font-medium text-slate-300">
      {value}
    </span>
  </div>
);

export default ProfilePage;
