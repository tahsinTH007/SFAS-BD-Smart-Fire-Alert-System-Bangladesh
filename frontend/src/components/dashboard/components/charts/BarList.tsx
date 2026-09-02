"use client";

import React from "react";
import { rampStep } from "./tokens";

export interface BarItem {
  label: string;
  value: number;
  /** Optional second line under the label. */
  sublabel?: string;
  /** Optional explicit colour; defaults to the sequential ramp by magnitude. */
  color?: string;
}

interface BarListProps {
  items: BarItem[];
  valueSuffix?: string;
  emptyMessage?: string;
  max?: number;
}

/**
 * Horizontal ranked bars. Magnitude is encoded by length *and* by a single-hue
 * sequential ramp, and every bar is directly labelled — no legend, no colour
 * lookup required.
 */
export const BarList: React.FC<BarListProps> = ({
  items,
  valueSuffix = "",
  emptyMessage = "Nothing to show yet",
  max,
}) => {
  if (!items.length) {
    return (
      <p className="py-8 text-center text-xs text-slate-500">{emptyMessage}</p>
    );
  }

  const ceiling = max ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const ratio = ceiling > 0 ? item.value / ceiling : 0;
        const color = item.color ?? rampStep(ratio);

        return (
          <li key={item.label} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-xs font-medium text-slate-300">
                {item.label}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-100">
                {item.value}
                {valueSuffix}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/70">
              {/* 4px rounded data-end, anchored to the baseline at left. */}
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.max(2, ratio * 100)}%`,
                  background: color,
                }}
              />
            </div>

            {item.sublabel && (
              <p className="mt-1 truncate text-[10px] text-slate-500">
                {item.sublabel}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
};
