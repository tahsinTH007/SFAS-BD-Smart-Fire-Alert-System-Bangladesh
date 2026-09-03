"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/**
 * Three-way theme picker. `system` follows the operating system, which matters
 * in a control room that dims its screens at night.
 *
 * Renders a neutral placeholder until mounted: the active theme is only known
 * client-side, and rendering the wrong one first causes a hydration mismatch.
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-9 w-[132px] animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800",
          className,
        )}
      />
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex gap-0.5 rounded-lg border border-hairline bg-surface-raised p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={
              value === "system"
                ? `Follow system (currently ${resolvedTheme})`
                : label
            }
            onClick={() => setTheme(value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
              active
                ? "bg-brand text-white"
                : "text-subtle hover:bg-neutral-quaternary/40 hover:text-heading",
            )}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
};
