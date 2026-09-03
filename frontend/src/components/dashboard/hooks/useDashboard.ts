"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  fetchDeviceStats,
  fetchTelemetry,
  seedHistory,
} from "@/redux/slices/telemetrySlice";
import { fetchAlertStats } from "@/redux/slices/alertSlice";
import { alertApi } from "@/api/alertApi";
import { analyticsApi, unitApi } from "@/api/unitApi";
import {
  buildingApi,
  deviceApi,
  stationApi,
  systemApi,
} from "@/api/systemApi";
import { toApiError } from "@/lib/axiosClient";
import type {
  Building,
  BuildingStats,
  Device,
  HealthReport,
  Station,
  TimeseriesPoint,
  TopDevice,
  Unit,
  UnitStats,
  UnitStatus,
  DispatchRecord,
  AnalyticsSummary,
} from "@/api/types";
import type { DashboardTab } from "../types";

export const useDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();

  const alertStats = useSelector((s: RootState) => s.alerts.stats);
  const stationId = useSelector((s: RootState) => s.session.stationId);
  const { devices: telemetry, stats: deviceStats, history, connected } =
    useSelector((s: RootState) => s.telemetry);

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const [devices, setDevices] = useState<Device[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [buildingStats, setBuildingStats] = useState<BuildingStats | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [topDevices, setTopDevices] = useState<TopDevice[]>([]);
  const [health, setHealth] = useState<HealthReport | null>(null);

  const [units, setUnits] = useState<Unit[]>([]);
  const [unitStats, setUnitStats] = useState<UnitStats | null>(null);
  const [activeDispatches, setActiveDispatches] = useState<DispatchRecord[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [summaryDays, setSummaryDays] = useState(30);

  const [trendHours, setTrendHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Loading ────────────────────────────────────────────────────────────────

  const loadCore = useCallback(async () => {
    try {
      // Devices and buildings are scoped to this console's station; the station
      // list itself stays unscoped so Settings can offer the others.
      const scope = stationId ?? undefined;
      const [d, b, s, bs] = await Promise.all([
        deviceApi.list({ limit: 200, stationId: scope }),
        buildingApi.list({ limit: 200, stationId: scope }),
        stationApi.list({ limit: 200 }),
        buildingApi.stats(scope),
      ]);
      setDevices(d.items);
      setBuildings(b.items);
      setStations(s.items);
      setBuildingStats(bs);
      setError(null);
    } catch (err) {
      setError(toApiError(err).message);
    }
  }, [stationId]);

  const loadAnalytics = useCallback(
    async (hours: number) => {
    try {
      const [ts, top] = await Promise.all([
        alertApi.getTimeseries(hours, stationId ?? undefined),
        alertApi.getTopDevices(6, stationId ?? undefined),
      ]);
      setTimeseries(ts);
      setTopDevices(top);
    } catch {
      // Analytics are supplementary; the rest of the dashboard still renders.
    }
    },
    [stationId],
  );

  const loadUnits = useCallback(async () => {
    try {
      const scope = stationId ?? undefined;
      const [u, us, ad] = await Promise.all([
        unitApi.list({ stationId: scope }),
        unitApi.stats(scope),
        unitApi.activeDispatches(scope),
      ]);
      setUnits(u);
      setUnitStats(us);
      setActiveDispatches(ad);
    } catch {
      // The unit board is one tab; a failure here must not blank the dashboard.
    }
  }, [stationId]);

  const loadSummary = useCallback(
    async (days: number) => {
      try {
        setSummary(await analyticsApi.summary(stationId ?? undefined, days));
      } catch {
        setSummary(null);
      }
    },
    [stationId],
  );

  const loadHealth = useCallback(async () => {
    try {
      setHealth(await systemApi.health());
    } catch {
      setHealth(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadCore(),
      loadAnalytics(trendHours),
      loadHealth(),
      dispatch(fetchTelemetry()),
      dispatch(fetchDeviceStats()),
      dispatch(fetchAlertStats()),
      dispatch(seedHistory()),
      loadUnits(),
      loadSummary(summaryDays),
    ]);
    setLoading(false);
  }, [dispatch, loadAnalytics, loadCore, loadHealth, loadUnits, loadSummary, summaryDays, trendHours]);

  // Reload everything whenever the console is pointed at another station.
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  useEffect(() => {
    void loadAnalytics(trendHours);
  }, [trendHours, loadAnalytics]);

  useEffect(() => {
    void loadSummary(summaryDays);
  }, [summaryDays, loadSummary]);

  // Poll the pieces the socket does not push (stats, health).
  useEffect(() => {
    const id = setInterval(() => {
      void dispatch(fetchAlertStats());
      void dispatch(fetchDeviceStats());
      void loadHealth();
    }, 30_000);
    return () => clearInterval(id);
  }, [dispatch, loadHealth]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const wrap = useCallback(
    async <T,>(
      run: () => Promise<T>,
      successMsg: string,
    ): Promise<T | null> => {
      try {
        const result = await run();
        toast.success(successMsg);
        await loadCore();
        void dispatch(fetchTelemetry());
        void dispatch(fetchDeviceStats());
        return result;
      } catch (err) {
        const e = toApiError(err);
        const detail = e.details?.map((d) => `${d.field}: ${d.message}`).join(", ");
        toast.error(e.message, { description: detail });
        return null;
      }
    },
    [dispatch, loadCore],
  );

  const createDevice = useCallback(
    (body: Record<string, unknown>) =>
      wrap(() => deviceApi.create(body), "Device registered"),
    [wrap],
  );

  const updateDevice = useCallback(
    (id: string, body: Record<string, unknown>) =>
      wrap(() => deviceApi.update(id, body), "Device updated"),
    [wrap],
  );

  const deleteDevice = useCallback(
    (id: string) => wrap(() => deviceApi.remove(id), "Device removed"),
    [wrap],
  );

  const createBuilding = useCallback(
    (body: Record<string, unknown>) =>
      wrap(() => buildingApi.create(body), "Building added"),
    [wrap],
  );

  const updateBuilding = useCallback(
    (id: string, body: Record<string, unknown>) =>
      wrap(() => buildingApi.update(id, body), "Building updated"),
    [wrap],
  );

  const deleteBuilding = useCallback(
    (id: string) => wrap(() => buildingApi.remove(id), "Building removed"),
    [wrap],
  );

  const createStation = useCallback(
    (body: Record<string, unknown>) =>
      wrap(() => stationApi.create(body), "Station added"),
    [wrap],
  );

  const updateStation = useCallback(
    (id: string, body: Record<string, unknown>) =>
      wrap(() => stationApi.update(id, body), "Station updated"),
    [wrap],
  );

  const deleteStation = useCallback(
    (id: string) => wrap(() => stationApi.remove(id), "Station removed"),
    [wrap],
  );

  const setUnitStatus = useCallback(
    async (id: string, status: UnitStatus, note?: string) => {
      const res = await wrap(
        () => unitApi.setStatus(id, status, note),
        "Unit status updated",
      );
      await loadUnits();
      return res;
    },
    [wrap, loadUnits],
  );

  const setCrewDuty = useCallback(
    async (unitId: string, crewId: string, onDuty: boolean) => {
      try {
        await unitApi.updateCrew(unitId, crewId, { onDuty });
        await loadUnits();
      } catch (err) {
        toast.error(toApiError(err).message);
      }
    },
    [loadUnits],
  );

  const setDispatchStatus = useCallback(
    async (dispatchId: string, status: DispatchRecord["status"]) => {
      const res = await wrap(
        () => unitApi.setDispatchStatus(dispatchId, status),
        "Dispatch updated",
      );
      await loadUnits();
      return res;
    },
    [wrap, loadUnits],
  );

  // ── Derived ────────────────────────────────────────────────────────────────

  const buildingNameById = useMemo(() => {
    const m = new Map<string, string>();
    buildings.forEach((b) => m.set(b._id, b.name));
    return m;
  }, [buildings]);

  const stationNameById = useMemo(() => {
    const m = new Map<string, string>();
    stations.forEach((s) => m.set(s._id, `${s.stationCode} — ${s.name}`));
    return m;
  }, [stations]);

  /** Highest-risk units first — what an operator wants at the top. */
  const rankedTelemetry = useMemo(
    () =>
      [...telemetry].sort(
        (a, b) => b.readings.riskScore - a.readings.riskScore,
      ),
    [telemetry],
  );

  return {
    activeTab,
    setActiveTab,

    devices,
    buildings,
    stations,
    units,
    unitStats,
    activeDispatches,
    summary,
    summaryDays,
    setSummaryDays,
    telemetry: rankedTelemetry,
    history,

    alertStats,
    deviceStats,
    buildingStats,
    timeseries,
    topDevices,
    health,

    trendHours,
    setTrendHours,

    loading,
    error,
    socketConnected: connected,

    refresh,

    createDevice,
    updateDevice,
    deleteDevice,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    createStation,
    updateStation,
    deleteStation,

    setUnitStatus,
    setCrewDuty,
    setDispatchStatus,
    reloadUnits: loadUnits,

    buildingNameById,
    stationNameById,
  };
};
