"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  Info,
  Radio,
  TrendingUp,
  Usb,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Panel, StatTile, EmptyState } from "./Primitives";
import { AreaChart, type AreaPoint } from "./charts/AreaChart";
import { BarList } from "./charts/BarList";
import { STATUS } from "./charts/tokens";
import type {
  AlertStats,
  BuildingStats,
  DeviceStats,
  HealthReport,
  TimeseriesPoint,
  TopDevice,
} from "@/api/types";

interface OverviewTabProps {
  alertStats: AlertStats | null;
  deviceStats: DeviceStats | null;
  buildingStats: BuildingStats | null;
  timeseries: TimeseriesPoint[];
  topDevices: TopDevice[];
  health: HealthReport | null;
  trendHours: number;
  onTrendHoursChange: (hours: number) => void;
  socketConnected: boolean;
  loading: boolean;
}

const RANGES = [
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
  { label: "30d", hours: 720 },
];

/** Formats a bucket key ("2026-09-02T15:00" or "2026-09-02") for the axis. */
function formatBucket(bucket: string, hours: number): string {
  if (hours > 72) {
    const [, m, d] = bucket.split("-");
    return `${d}/${m}`;
  }
  const time = bucket.split("T")[1] ?? bucket;
  return time.slice(0, 5);
}

const PRIORITY_ROWS = [
  { key: "critical" as const, icon: Flame, help: "Flame confirmed or fused score ≥ 70" },
  { key: "important" as const, icon: AlertTriangle, help: "Fused score 40–69" },
  { key: "info" as const, icon: Info, help: "Logged, below alert threshold" },
];

export const OverviewTab: React.FC<OverviewTabProps> = ({
  alertStats,
  deviceStats,
  buildingStats,
  timeseries,
  topDevices,
  health,
  trendHours,
  onTrendHoursChange,
  socketConnected,
  loading,
}) => {
  // One series: total alerts per bucket. See charts/tokens.ts for why priority
  // is not stacked here.
  const trend: AreaPoint[] = timeseries.map((p) => ({
    label: formatBucket(p.bucket, trendHours),
    value: p.critical + p.important + p.info,
  }));

  const priorityTotal =
    (alertStats?.byPriority.critical ?? 0) +
    (alertStats?.byPriority.important ?? 0) +
    (alertStats?.byPriority.info ?? 0);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Headline stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Active Critical"
          value={alertStats?.byStatus.active ?? 0}
          icon={Flame}
          accent={alertStats?.byStatus.active ? "critical" : "good"}
          hint={`${alertStats?.last24h ?? 0} alerts in last 24h`}
          loading={loading && !alertStats}
        />
        <StatTile
          label="Units Online"
          value={
            deviceStats ? `${deviceStats.online}/${deviceStats.total}` : "—"
          }
          icon={Cpu}
          accent={
            deviceStats && deviceStats.offline > 0 ? "important" : "good"
          }
          hint={
            deviceStats?.offline
              ? `${deviceStats.offline} not reporting`
              : "All units reporting"
          }
          loading={loading && !deviceStats}
        />
        <StatTile
          label="Unacknowledged"
          value={alertStats?.unacknowledged ?? 0}
          icon={Bell}
          accent={alertStats?.unacknowledged ? "important" : "good"}
          hint={`${alertStats?.unread ?? 0} unread`}
          loading={loading && !alertStats}
        />
        <StatTile
          label="People Covered"
          value={buildingStats?.totalPeople.toLocaleString() ?? "—"}
          icon={Users}
          accent="info"
          hint={`${buildingStats?.total ?? 0} buildings monitored`}
          loading={loading && !buildingStats}
        />
      </div>

      {/* ── Trend + priority ───────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="Alert activity"
          subtitle={`Total alerts raised, last ${trendHours >= 24 ? `${trendHours / 24} day(s)` : `${trendHours} hours`}`}
          icon={TrendingUp}
          className="lg:col-span-2"
          action={
            <div className="flex gap-0.5 rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.hours}
                  onClick={() => onTrendHoursChange(r.hours)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    trendHours === r.hours
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        >
          <AreaChart
            data={trend}
            height={210}
            seriesName="Alerts"
            emptyMessage="No alerts recorded in this window"
          />
        </Panel>

        <Panel
          title="By priority"
          subtitle="All recorded alerts"
          icon={AlertTriangle}
        >
          {priorityTotal === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No alerts recorded yet
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {PRIORITY_ROWS.map(({ key, icon: Icon, help }) => {
                const count = alertStats?.byPriority[key] ?? 0;
                const pct = priorityTotal ? (count / priorityTotal) * 100 : 0;
                const meta = STATUS[key];

                return (
                  <li key={key}>
                    <div className="mb-1.5 flex items-center gap-2">
                      {/* Icon + text label, so hue is never the only channel. */}
                      <Icon size={13} className={meta.text} />
                      <span className="text-xs font-medium text-slate-300">
                        {meta.label}
                      </span>
                      <span className="ml-auto text-xs font-semibold tabular-nums text-slate-100">
                        {count}
                      </span>
                      <span className="w-10 text-right text-[10px] tabular-nums text-slate-500">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${Math.max(2, pct)}%`,
                          background: meta.hex,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-600">{help}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* ── Devices + health ───────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="Most active units"
          subtitle="Ranked by alerts raised"
          icon={Activity}
          className="lg:col-span-2"
        >
          <BarList
            items={topDevices.map((d) => ({
              label: d.deviceCode,
              value: d.alerts,
              sublabel: `${d.critical} critical · avg risk ${d.avgRisk}/100`,
            }))}
            emptyMessage="No unit has raised an alert yet"
          />
        </Panel>

        <Panel title="System health" subtitle="Live dependencies" icon={Database}>
          <ul className="flex flex-col gap-2.5">
            <HealthRow
              label="MongoDB"
              up={health?.dependencies.mongodb.up ?? false}
              required
              detail="Alert and device storage"
            />
            <HealthRow
              label="Redis cache"
              up={health?.dependencies.redis.up ?? false}
              detail="Caching + rate limiting"
            />
            <HealthRow
              label="Serial link"
              up={health?.dependencies.serial.up ?? false}
              detail={
                health?.dependencies.serial.port
                  ? `Arduino on ${health.dependencies.serial.port}`
                  : "Arduino sensor bridge"
              }
            />
            <HealthRow
              label="Live socket"
              up={socketConnected}
              detail="Real-time push to this browser"
            />
          </ul>

          <div className="mt-4 border-t border-slate-800 pt-3">
            <Link
              href="/notifications"
              className="flex items-center justify-between text-xs text-slate-400 transition-colors hover:text-slate-200"
            >
              <span>Open alert console</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
};

const HealthRow: React.FC<{
  label: string;
  up: boolean;
  detail: string;
  required?: boolean;
}> = ({ label, up, detail, required }) => (
  <li className="flex items-start gap-2.5">
    {/* Icon carries the state; colour only reinforces it. */}
    {up ? (
      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
    ) : required ? (
      <WifiOff size={14} className="mt-0.5 shrink-0 text-red-400" />
    ) : (
      <WifiOff size={14} className="mt-0.5 shrink-0 text-slate-500" />
    )}
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-200">{label}</span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            up ? "text-emerald-400" : required ? "text-red-400" : "text-slate-500"
          }`}
        >
          {up ? "Up" : required ? "Down" : "Offline"}
        </span>
      </div>
      <p className="truncate text-[10px] text-slate-600">{detail}</p>
    </div>
  </li>
);
