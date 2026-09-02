"use client";

import React, { useId, useMemo } from "react";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Draws a dashed threshold rule, e.g. the smoke alert threshold. */
  threshold?: number;
  ariaLabel?: string;
}

/**
 * Tiny single-series trend line. No axes, no legend — it sits beside a labelled
 * value that carries the number, so it only has to show shape.
 */
export const Sparkline: React.FC<SparklineProps> = ({
  values,
  width = 120,
  height = 32,
  color = "#3987e5",
  threshold,
  ariaLabel = "Recent trend",
}) => {
  const gid = useId();

  const geom = useMemo(() => {
    if (values.length < 2) return null;

    const min = Math.min(...values, threshold ?? Infinity);
    const max = Math.max(...values, threshold ?? -Infinity);
    const span = max - min || 1;
    const pad = 3;

    const x = (i: number) => (i / (values.length - 1)) * width;
    const y = (v: number) =>
      pad + (1 - (v - min) / span) * (height - pad * 2);

    return {
      line: values.map((v, i) => `${x(i)},${y(v)}`).join(" "),
      area: `0,${height} ${values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} ${width},${height}`,
      lastX: x(values.length - 1),
      lastY: y(values[values.length - 1]),
      thresholdY: threshold !== undefined ? y(threshold) : null,
    };
  }, [values, width, height, threshold]);

  if (!geom) {
    return (
      <div
        className="flex items-center text-[10px] text-slate-600"
        style={{ width, height }}
      >
        awaiting data
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <polygon points={geom.area} fill={`url(#${gid})`} />

      {geom.thresholdY !== null && (
        <line
          x1={0}
          x2={width}
          y1={geom.thresholdY}
          y2={geom.thresholdY}
          stroke="#64748b"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      )}

      <polyline
        points={geom.line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Surface ring keeps the head visible where it crosses the fill. */}
      <circle
        cx={geom.lastX}
        cy={geom.lastY}
        r={2.5}
        fill={color}
        stroke="#0f172a"
        strokeWidth={1.5}
      />
    </svg>
  );
};
