"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  /** Hides the visible label but keeps it for screen readers. */
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * The house toggle. Markup follows the shared component spec exactly — a
 * visually-hidden peer checkbox driving a styled track, with the knob animated
 * via `peer-checked:after:translate-x-full`.
 *
 * The `brand` / `neutral-quaternary` / `heading` tokens it references are
 * declared in globals.css and follow the active theme.
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  className,
}) => {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-center cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="relative w-9 h-5 bg-neutral-quaternary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-soft dark:peer-focus:ring-brand-soft rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-buffer after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand" />
      {label !== undefined && (
        <span
          className={cn(
            "select-none ms-3 text-sm font-medium text-heading",
            hideLabel && "sr-only",
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
};
