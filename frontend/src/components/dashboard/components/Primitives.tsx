"use client";

import React from "react";
import { LucideIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Panel ────────────────────────────────────────────────────────────────────

interface PanelProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}) => (
  <section
    className={cn(
      "rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm",
      className,
    )}
  >
    <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800/60">
            <Icon size={15} className="text-slate-400" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-100">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-[11px] text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>

    <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
  </section>
);

// ─── Stat tile ────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Small note under the value, e.g. "3 in last 24h". */
  hint?: string;
  /** Accent applies to the icon chip only — never to the value text. */
  accent?: "neutral" | "critical" | "important" | "info" | "good";
  loading?: boolean;
}

const ACCENTS: Record<
  NonNullable<StatTileProps["accent"]>,
  { chip: string; icon: string }
> = {
  neutral: { chip: "bg-slate-800/70 border-slate-700", icon: "text-slate-400" },
  critical: { chip: "bg-red-500/10 border-red-500/30", icon: "text-red-400" },
  important: {
    chip: "bg-amber-500/10 border-amber-500/30",
    icon: "text-amber-400",
  },
  info: { chip: "bg-sky-500/10 border-sky-500/30", icon: "text-sky-400" },
  good: {
    chip: "bg-emerald-500/10 border-emerald-500/30",
    icon: "text-emerald-400",
  },
};

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  icon: Icon,
  hint,
  accent = "neutral",
  loading,
}) => {
  const a = ACCENTS[accent];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border",
              a.chip,
            )}
          >
            <Icon size={13} className={a.icon} />
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-800" />
      ) : (
        <p className="mt-1.5 text-2xl font-bold leading-none text-slate-50">
          {value}
        </p>
      )}

      {hint && <p className="mt-1.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  description,
  onClose,
  footer,
  children,
  width = "md",
}) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Prevent the page behind from scrolling while the modal is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          "my-auto w-full rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl",
          widths[width],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X size={17} />
          </button>
        </header>

        <div className="sfas-scroll max-h-[65vh] overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

// ─── Form field ───────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  error,
  hint,
  required,
  children,
  className,
}) => (
  <label className={cn("flex flex-col gap-1.5", className)}>
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {label}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </span>
    {children}
    {error ? (
      <span className="text-[11px] text-red-400">{error}</span>
    ) : hint ? (
      <span className="text-[11px] text-slate-600">{hint}</span>
    ) : null}
  </label>
);

export const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-sky-600 focus:ring-1 focus:ring-sky-600/40";

// ─── Empty state ──────────────────────────────────────────────────────────────

export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, message, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
      <Icon size={20} className="text-slate-600" />
    </span>
    <p className="text-sm font-semibold text-slate-300">{title}</p>
    <p className="mt-1 max-w-sm text-xs text-slate-500">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
