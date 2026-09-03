"use client";

import React from "react";
import {
  AlertTriangle,
  Building2,
  Clock,
  Cpu,
  Flame,
  Gauge,
  MapPin,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Panel, StatTile } from "./Primitives";
import { BarList } from "./charts/BarList";
import { AreaChart, type AreaPoint } from "./charts/AreaChart";
import { CHART, rampStep } from "./charts/tokens";
import type { AnalyticsSummary } from "@/api/types";

interface SummaryTabProps {
  summary: AnalyticsSummary | null;
  days: number;
  onDaysChange: (days: number) => void;
  loading: boolean;
}

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const TYPE_LABEL: Record<string, string> = {
  fire: "Fire",
  smoke: "Smoke",
  gas: "Gas leak",
  heat: "Heat",
  normal: "Other",
};

export const SummaryTab: React.FC<SummaryTabProps> = ({
  summary,
  days,
  onDaysChange,
  loading,
}) => {
  const hourly: AreaPoint[] =
    summary?.hourly.map((h) => ({
      label: `${String(h.hour).padStart(2, "0")}`,
      value: h.total,
    })) ?? [];

  const busiestHour = summary?.hourly.reduce(
    (best, h) => (h.total > (best?.total ?? -1) ? h : best),
    summary.hourly[0],
  );

  const topArea = summary?.areas[0];
  const topCause = summary?.causes[0];
  const topType = summary?.types[0];

  const rangePicker = (
    <div className="flex gap-0.5 rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.days}
          onClick={() => onDaysChange(r.days)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            days === r.days
              ? "bg-slate-800 text-slate-100"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Headline findings, in words */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Busiest area"
          value={topArea?.area ?? "—"}
          icon={MapPin}
          accent="critical"
          hint={
            topArea
              ? `${topArea.total} alerts · ${topArea.critical} critical`
              : "No data yet"
          }
          loading={loading && !summary}
        />
        <StatTile
          label="Most common"
          value={topType ? (TYPE_LABEL[topType.type] ?? topType.type) : "—"}
          icon={Flame}
          accent="important"
          hint={topType ? `${topType.total} of the last ${days} days` : "—"}
          loading={loading && !summary}
        />
        <StatTile
          label="Leading cause"
          value={topCause?.label.split(" ")[0] ?? "—"}
          icon={AlertTriangle}
          accent="info"
          hint={topCause ? `${topCause.label} · ${topCause.total}×` : "—"}
          loading={loading && !summary}
        />
        <StatTile
          label="Peak hour"
          value={
            busiestHour ? `${String(busiestHour.hour).padStart(2, "0")}:00` : "—"
          }
          icon={Clock}
          accent="neutral"
          hint={busiestHour ? `${busiestHour.total} alerts in that hour` : "—"}
          loading={loading && !summary}
        />
      </div>

      {/* Where */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Where alerts come from"
          subtitle={`By sector, last ${days} days`}
          icon={MapPin}
          action={rangePicker}
        >
          <BarList
            items={(summary?.areas ?? []).map((a) => ({
              label: a.area,
              value: a.total,
              sublabel: `${a.critical} critical · avg risk ${a.avgRisk}/100 · ${a.buildingCount} building(s)`,
            }))}
            emptyMessage="No alerts recorded in this window"
          />
        </Panel>

        <Panel
          title="Buildings raising most alerts"
          subtitle="Candidates for an inspection visit"
          icon={Building2}
        >
          <BarList
            items={(summary?.buildings ?? []).map((b) => ({
              label: b.building,
              value: b.total,
              sublabel: `${b.sector ?? "—"} · ${b.critical} critical · avg risk ${b.avgRisk}/100`,
            }))}
            emptyMessage="No building data yet"
          />
        </Panel>
      </div>

      {/* What and why */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="What kind of alert"
          subtitle="By incident type"
          icon={Flame}
        >
          {(summary?.types.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              Nothing recorded yet
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {summary!.types.map((t) => {
                const total = summary!.types.reduce((n, x) => n + x.total, 0);
                const pct = total ? (t.total / total) * 100 : 0;
                return (
                  <li key={t.type}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-slate-300">
                        {TYPE_LABEL[t.type] ?? t.type}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-slate-100">
                        {t.total}
                        <span className="ml-1.5 text-[10px] font-normal text-slate-500">
                          {pct.toFixed(0)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800/70">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${Math.max(2, pct)}%`,
                          background: rampStep(pct / 100),
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-600">
                      {t.critical} critical · avg fused risk {t.avgRisk}/100
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="What triggered them"
          subtitle="Sensors that contributed to each alert"
          icon={Gauge}
        >
          <BarList
            items={(summary?.causes ?? []).map((c) => ({
              label: c.label,
              value: c.total,
              sublabel: `${c.critical} of these were critical`,
            }))}
            emptyMessage="No cause data yet"
          />
          <p className="mt-4 border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500">
            One alert can have several causes — these are the individual sensors
            that agreed. A cause appearing far more often than the others is
            usually worth investigating at source.
          </p>
        </Panel>
      </div>

      {/* When and how fast */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="When alerts happen"
          subtitle="By hour of day"
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          <AreaChart
            data={hourly}
            height={200}
            seriesName="Alerts"
            emptyMessage="No alerts recorded in this window"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            Hours are local time. A consistent peak is a staffing signal.
          </p>
        </Panel>

        <Panel title="Response times" subtitle="Station performance" icon={Timer}>
          <ul className="flex flex-col gap-3">
            <Metric
              label="Average to acknowledge"
              value={
                summary?.response.avgAckMinutes != null
                  ? `${summary.response.avgAckMinutes} min`
                  : "—"
              }
              hint={`${summary?.response.acknowledged ?? 0} acknowledged`}
            />
            <Metric
              label="Slowest acknowledgement"
              value={
                summary?.response.slowestAckMinutes != null
                  ? `${summary.response.slowestAckMinutes} min`
                  : "—"
              }
              hint="Worst case in this window"
            />
            <Metric
              label="Average to resolve"
              value={
                summary?.response.avgResolveMinutes != null
                  ? `${summary.response.avgResolveMinutes} min`
                  : "—"
              }
              hint={`${summary?.response.resolvedCount ?? 0} resolved`}
            />
            <Metric
              label="Actual travel time"
              value={
                summary?.response.avgActualTravelMinutes != null
                  ? `${summary.response.avgActualTravelMinutes} min`
                  : "—"
              }
              hint={
                summary?.response.avgEstimatedEtaMinutes != null
                  ? `vs ${summary.response.avgEstimatedEtaMinutes} min estimated`
                  : "No arrivals recorded yet"
              }
            />
            <Metric
              label="Average distance"
              value={
                summary?.response.avgDistanceKm != null
                  ? `${summary.response.avgDistanceKm} km`
                  : "—"
              }
              hint={`${summary?.response.dispatchesArrived ?? 0} arrivals`}
            />
          </ul>
        </Panel>
      </div>

      {/* Devices */}
      <Panel
        title="Units raising most alerts"
        subtitle="Frequent triggers may need calibration or investigation"
        icon={Cpu}
      >
        <BarList
          items={(summary?.devices ?? []).map((d) => ({
            label: d.deviceCode,
            value: d.total,
            sublabel: `${d.building ?? "—"} · ${d.critical} critical · ${d.resolved} resolved · avg risk ${d.avgRisk}`,
          }))}
          emptyMessage="No device data yet"
        />
      </Panel>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; hint: string }> = ({
  label,
  value,
  hint,
}) => (
  <li className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <p className="mt-0.5 text-lg font-bold leading-none text-slate-100 tabular-nums">
      {value}
    </p>
    <p className="mt-1 text-[10px] text-slate-600">{hint}</p>
  </li>
);
