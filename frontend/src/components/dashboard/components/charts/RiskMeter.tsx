"use client";

import React from "react";
import { riskBand } from "./tokens";

interface RiskMeterProps {
  score: number;
  size?: number;
  /** Renders the band name under the number. */
  showLabel?: boolean;
}

/**
 * Radial meter for a single 0-100 fused risk score.
 *
 * The number is the primary channel; the arc and its colour reinforce it, and
 * the band name is spelled out so the state never depends on hue alone.
 */
export const RiskMeter: React.FC<RiskMeterProps> = ({
  score,
  size = 108,
  showLabel = true,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = riskBand(clamped);

  const stroke = 8;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // 270° sweep, opening at the bottom.
  const circumference = 2 * Math.PI * r;
  const arcFraction = 0.75;
  const dash = circumference * arcFraction;
  const filled = dash * (clamped / 100);

  return (
    <div
      className="flex flex-col items-center"
      role="img"
      aria-label={`Fire risk score ${clamped} out of 100, ${band.label}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(135deg)" }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={band.hex}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ transition: "stroke-dasharray 600ms ease-out" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none text-slate-50 tabular-nums">
            {clamped}
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-widest text-slate-500">
            / 100
          </span>
        </div>
      </div>

      {showLabel && (
        <span
          className="mt-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: band.hex }}
        >
          {band.label}
        </span>
      )}
    </div>
  );
};
