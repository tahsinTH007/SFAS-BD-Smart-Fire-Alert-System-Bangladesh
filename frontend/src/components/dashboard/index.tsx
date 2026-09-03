"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Flame, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useSelector } from "react-redux";
import { selectActiveStation } from "@/redux/slices/sessionSlice";
import { useDashboard } from "./hooks/useDashboard";
import { TabNav } from "./components/TabNav";
import { OverviewTab } from "./components/OverviewTab";
import { TelemetryTab } from "./components/TelemetryTab";
import { UnitsTab } from "./components/UnitsTab";
import { SummaryTab } from "./components/SummaryTab";
import { DevicesTable } from "./components/DevicesTable";
import { BuildingsTable } from "./components/BuildingsTable";
import { StationsTable } from "./components/StationsTable";

const Dashboard = () => {
  const d = useDashboard();
  const station = useSelector(selectActiveStation);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-red-600/20">
              <Flame size={20} className="text-orange-400" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-50">
                System Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                {station
                  ? `${station.stationCode} — ${station.name}`
                  : "OGNIBORMO units, buildings and station coverage"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
                d.socketConnected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 bg-slate-900 text-slate-500"
              }`}
            >
              {d.socketConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {d.socketConnected ? "Live" : "Offline"}
            </span>

            <button
              onClick={() => void d.refresh()}
              disabled={d.loading}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={d.loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <Link
              href="/"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              Live map
            </Link>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
        {d.error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-300">
                Cannot reach the API
              </p>
              <p className="mt-0.5 text-xs text-red-400/80">{d.error}</p>
            </div>
          </div>
        )}

        <TabNav
          activeTab={d.activeTab}
          onTabChange={d.setActiveTab}
          counts={{
            devices: d.devices.length,
            buildings: d.buildings.length,
            stations: d.stations.length,
            telemetry: d.telemetry.length,
            units: d.units.length,
          }}
        />

        {d.activeTab === "overview" && (
          <OverviewTab
            alertStats={d.alertStats}
            deviceStats={d.deviceStats}
            buildingStats={d.buildingStats}
            timeseries={d.timeseries}
            topDevices={d.topDevices}
            health={d.health}
            trendHours={d.trendHours}
            onTrendHoursChange={d.setTrendHours}
            socketConnected={d.socketConnected}
            loading={d.loading}
          />
        )}

        {d.activeTab === "units" && (
          <UnitsTab
            units={d.units}
            stats={d.unitStats}
            activeDispatches={d.activeDispatches}
            loading={d.loading}
            onSetStatus={d.setUnitStatus}
            onSetCrewDuty={d.setCrewDuty}
            onDispatchStatus={d.setDispatchStatus}
          />
        )}

        {d.activeTab === "summary" && (
          <SummaryTab
            summary={d.summary}
            days={d.summaryDays}
            onDaysChange={d.setSummaryDays}
            loading={d.loading}
          />
        )}

        {d.activeTab === "telemetry" && (
          <TelemetryTab
            telemetry={d.telemetry}
            history={d.history}
            socketConnected={d.socketConnected}
            loading={d.loading}
          />
        )}

        {d.activeTab === "devices" && (
          <DevicesTable
            devices={d.devices}
            buildings={d.buildings}
            stations={d.stations}
            loading={d.loading}
            onCreate={d.createDevice}
            onUpdate={d.updateDevice}
            onDelete={d.deleteDevice}
          />
        )}

        {d.activeTab === "buildings" && (
          <BuildingsTable
            buildings={d.buildings}
            stations={d.stations}
            loading={d.loading}
            onCreate={d.createBuilding}
            onUpdate={d.updateBuilding}
            onDelete={d.deleteBuilding}
          />
        )}

        {d.activeTab === "stations" && (
          <StationsTable
            stations={d.stations}
            loading={d.loading}
            onCreate={d.createStation}
            onUpdate={d.updateStation}
            onDelete={d.deleteStation}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
