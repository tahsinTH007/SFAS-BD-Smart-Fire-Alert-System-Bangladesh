"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { List, X } from "lucide-react";
import { useHeroMap } from "./hooks/useHeroMap";
import { StatusBar } from "./components/StatusBar";
import { SidebarPanel } from "./components/SidebarPanel";
import { HoverInfoBadge } from "./components/HoverInfoBadge";
import { AlertSheet } from "./components/AlertSheet";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./Sheet";

const DynamicMap = dynamic(
  () => import("./components/MapComponent").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-500" />
          <span className="text-sm">Loading map…</span>
        </div>
      </div>
    ),
  },
);

const HeroSection = () => {
  const {
    alerts,
    hoveredId,
    setHoveredId,
    sheetAlert,
    sheetOpen,
    setSheetOpen,
    criticalCount,
    importantCount,
    infoCount,
    handleMarkerClick,
    handleSidebarClick,
    focusAlertId,
  } = useHeroMap();

  // On phones the alert list is a drawer over the map rather than a column
  // beside it — a 320px sidebar leaves no usable map on a 375px screen.
  const [listOpen, setListOpen] = useState(false);

  const hoveredAlert = hoveredId
    ? alerts.find((a) => a.id === hoveredId)
    : null;

  const onSidebarClick = (id: string) => {
    handleSidebarClick(id);
    setListOpen(false);
  };

  return (
    <section className="relative flex w-full flex-col bg-slate-950 text-slate-100"
      // Fills the viewport below the 3.5rem navbar. A flex column lets the
      // status bar take whatever height it needs (it wraps differently per
      // breakpoint) while the map takes the rest.
      style={{ height: "calc(100dvh - 3.5rem)" }}
    >
      <StatusBar criticalCount={criticalCount} />

      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <div className="hidden w-80 shrink-0 lg:flex">
          <SidebarPanel
            alerts={alerts}
            criticalCount={criticalCount}
            importantCount={importantCount}
            infoCount={infoCount}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onSidebarClick={onSidebarClick}
          />
        </div>

        {/* Map */}
        <div className="relative flex-1">
          <DynamicMap
            alerts={alerts}
            hoveredId={hoveredId}
            focusAlertId={focusAlertId}
            onHover={setHoveredId}
            onMarkerClick={handleMarkerClick}
          />

          {hoveredAlert && <HoverInfoBadge alert={hoveredAlert} />}

          {/* Mobile: counts strip + open-list button */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[900] flex items-start justify-between gap-2 p-3 lg:hidden">
            <div className="pointer-events-auto flex gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-2.5 py-2 backdrop-blur-sm">
              <Count label="CRIT" value={criticalCount} className="text-red-400" />
              <span className="w-px bg-slate-800" />
              <Count label="IMP" value={importantCount} className="text-amber-400" />
              <span className="w-px bg-slate-800" />
              <Count label="INFO" value={infoCount} className="text-sky-400" />
            </div>

            <button
              onClick={() => setListOpen(true)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 text-[11px] font-semibold text-slate-200 backdrop-blur-sm"
            >
              <List size={13} />
              Alerts
              <span className="rounded-full bg-slate-800 px-1.5 text-[10px] tabular-nums">
                {alerts.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile alert drawer */}
      {listOpen && (
        <div className="fixed inset-0 z-[9000] lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setListOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex h-[78%] flex-col overflow-hidden rounded-t-2xl border-t border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">
                Live alerts
                <span className="ml-2 text-[11px] font-normal text-slate-500">
                  tap to locate
                </span>
              </p>
              <button
                onClick={() => setListOpen(false)}
                aria-label="Close alert list"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
              >
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <SidebarPanel
                alerts={alerts}
                criticalCount={criticalCount}
                importantCount={importantCount}
                infoCount={infoCount}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSidebarClick={onSidebarClick}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {/* Alert detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-full border-slate-800 bg-slate-950 p-0 shadow-2xl shadow-black/40 sm:w-[440px]"
          style={{ zIndex: 10000 }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Alert details</SheetTitle>
            <SheetDescription>
              View detailed information about this alert
            </SheetDescription>
          </SheetHeader>
          {sheetAlert && (
            <AlertSheet alert={sheetAlert} onClose={() => setSheetOpen(false)} />
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
};

const Count: React.FC<{
  label: string;
  value: number;
  className: string;
}> = ({ label, value, className }) => (
  <div className="px-1.5 text-center">
    <p className={`text-base font-bold leading-none tabular-nums ${className}`}>
      {value}
    </p>
    <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-slate-600">
      {label}
    </p>
  </div>
);

export default HeroSection;
