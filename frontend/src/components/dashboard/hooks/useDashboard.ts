"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  fetchDeviceStats,
  fetchTelemetry,
} from "@/redux/slices/telemetrySlice";
import { fetchAlertStats } from "@/redux/slices/alertSlice";
import { alertApi } from "@/api/alertApi";
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
} from "@/api/types";
import type { DashboardTab } from "../types";

export const useDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();

  const alertStats = useSelector((s: RootState) => s.alerts.stats);
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

  const [trendHours, setTrendHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Loading ────────────────────────────────────────────────────────────────

  const loadCore = useCallback(async () => {
    try {
      const [d, b, s, bs] = await Promise.all([
        deviceApi.list({ limit: 200 }),
        buildingApi.list({ limit: 200 }),
        stationApi.list({ limit: 200 }),
        buildingApi.stats(),
      ]);
      setDevices(d.items);
      setBuildings(b.items);
      setStations(s.items);
      setBuildingStats(bs);
      setError(null);
    } catch (err) {
      setError(toApiError(err).message);
    }
  }, []);

  const loadAnalytics = useCallback(async (hours: number) => {
    try {
      const [ts, top] = await Promise.all([
        alertApi.getTimeseries(hours),
        alertApi.getTopDevices(6),
      ]);
      setTimeseries(ts);
      setTopDevices(top);
    } catch {
      // Analytics are supplementary; the rest of the dashboard still renders.
    }
  }, []);

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
    ]);
    setLoading(false);
  }, [dispatch, loadAnalytics, loadCore, loadHealth, trendHours]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadAnalytics(trendHours);
  }, [trendHours, loadAnalytics]);

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

    buildingNameById,
    stationNameById,
  };
};
