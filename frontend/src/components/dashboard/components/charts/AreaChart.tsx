"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { CHART } from "./tokens";

export interface AreaPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: AreaPoint[];
  height?: number;
  /** Series name — shown in the tooltip; the card title names it otherwise. */
  seriesName?: string;
  valueSuffix?: string;
  emptyMessage?: string;
}

const PAD = { top: 12, right: 12, bottom: 24, left: 34 };

/**
 * Single-series area + line with a crosshair tooltip.
 *
 * One series by design, so no legend is needed and no colour pair has to be
 * told apart (see ./tokens.ts for why priority is not stacked here).
 */
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 200,
  seriesName = "Alerts",
  valueSuffix = "",
  emptyMessage = "No activity in this window",
}) => {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(640);

  React.useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.max(240, entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geom = useMemo(() => {
    const innerW = width - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const max = Math.max(1, ...data.map((d) => d.value));
    // Round the axis top to something readable.
    const step = max <= 5 ? 1 : max <= 20 ? 5 : max <= 100 ? 20 : 50;
    const top = Math.ceil(max / step) * step;

    const x = (i: number) =>
      data.length <= 1
        ? PAD.left + innerW / 2
        : PAD.left + (i / (data.length - 1)) * innerW;

    const y = (v: number) => PAD.top + innerH - (v / top) * innerH;

    const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
    const area =
      data.length > 0
        ? `${PAD.left},${PAD.top + innerH} ${line} ${x(data.length - 1)},${PAD.top + innerH}`
        : "";

    const ticks = [0, top / 2, top];

    return { innerW, innerH, top, x, y, line, area, ticks };
  }, [data, width, height]);

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const ratio = (px - PAD.left) / Math.max(1, geom.innerW);
    const idx = Math.round(ratio * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const active = hover !== null ? data[hover] : null;

  // Label every nth tick so they never collide.
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${seriesName} over time`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.series} stopOpacity="0.32" />
            <stop offset="100%" stopColor={CHART.series} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Recessive gridlines + value axis */}
        {geom.ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={geom.y(t)}
              y2={geom.y(t)}
              stroke={CHART.gridline}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={geom.y(t) + 3}
              textAnchor="end"
              fontSize={9}
              fill={CHART.inkMuted}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {Math.round(t)}
            </text>
          </g>
        ))}

        <polygon points={geom.area} fill={`url(#${gradientId})`} />

        <polyline
          points={geom.line}
          fill="none"
          stroke={CHART.series}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Time axis */}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={d.label}
              x={geom.x(i)}
              y={height - 8}
              textAnchor="middle"
              fontSize={9}
              fill={CHART.inkMuted}
            >
              {d.label}
            </text>
          ) : null,
        )}

        {/* Crosshair */}
        {active && hover !== null && (
          <g pointerEvents="none">
            <line
              x1={geom.x(hover)}
              x2={geom.x(hover)}
              y1={PAD.top}
              y2={PAD.top + geom.innerH}
              stroke={CHART.baseline}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {/* 2px surface ring so the marker reads over the fill */}
            <circle
              cx={geom.x(hover)}
              cy={geom.y(active.value)}
              r={5}
              fill={CHART.series}
              stroke={CHART.surface}
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {active && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur-sm"
          style={{
            left: Math.min(Math.max(geom.x(hover) - 60, 0), width - 130),
            top: Math.max(0, geom.y(active.value) - 56),
          }}
        >
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            {active.label}
          </p>
          <p className="text-sm font-semibold text-slate-100 tabular-nums">
            {active.value}
            {valueSuffix} {seriesName.toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
};
