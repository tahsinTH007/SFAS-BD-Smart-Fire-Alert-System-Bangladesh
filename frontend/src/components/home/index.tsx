"use client";

import React from "react";
import dynamic from "next/dynamic";
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

// ✅ MUST import from ./components/MapComponent — NOT ./Mapcomponent
const DynamicMap = dynamic(
  () => import("./components/MapComponent").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-600 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-500 rounded-full animate-spin" />
          <span className="text-sm">Loading map...</span>
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
    closeSheet,
  } = useHeroMap();

  const hoveredAlert = hoveredId
    ? alerts.find((a) => a.id === hoveredId)
    : null;

  return (
    <section
      className="relative w-full bg-slate-950 text-slate-100"
      style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}
    >
      <StatusBar criticalCount={criticalCount} />

      <div className="flex" style={{ height: "calc(100vh - 40px)" }}>
        <SidebarPanel
          alerts={alerts}
          criticalCount={criticalCount}
          importantCount={importantCount}
          infoCount={infoCount}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onSidebarClick={handleSidebarClick}
        />

        <div className="flex-1 relative">
          <DynamicMap
            alerts={alerts}
            hoveredId={hoveredId}
            focusAlertId={focusAlertId}
            onHover={setHoveredId}
            onMarkerClick={handleMarkerClick}
          />
          {hoveredAlert && <HoverInfoBadge alert={hoveredAlert} />}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-[440px] max-w-full p-0 bg-slate-950 border-slate-800 shadow-2xl shadow-black/40"
          style={{ zIndex: 10000 }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Alert Details</SheetTitle>
            <SheetDescription>
              View detailed information about this alert
            </SheetDescription>
          </SheetHeader>
          {sheetAlert && (
            <AlertSheet
              alert={sheetAlert}
              onClose={() => setSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default HeroSection;
