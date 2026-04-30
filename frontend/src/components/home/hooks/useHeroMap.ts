import { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchAlerts } from "@/redux/slices/alertSlice";
import { MapAlert } from "../types/mapAlert";

function parseCoordinates(raw: any): [number, number] | null {
  if (!raw) return null;
  if (
    Array.isArray(raw) &&
    raw.length === 2 &&
    !isNaN(Number(raw[0])) &&
    !isNaN(Number(raw[1]))
  ) {
    return [Number(raw[0]), Number(raw[1])];
  }
  if (typeof raw === "string") {
    const parts = raw.split(",").map((s) => s.trim());
    if (
      parts.length === 2 &&
      !isNaN(Number(parts[0])) &&
      !isNaN(Number(parts[1]))
    ) {
      return [Number(parts[0]), Number(parts[1])];
    }
  }
  return null;
}

export const useHeroMap = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { alerts } = useSelector((state: RootState) => state.alerts);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sheetAlert, setSheetAlert] = useState<MapAlert | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusAlertId, setFocusAlertId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  const mapAlerts: MapAlert[] = useMemo(() => {
    return alerts.map((a: any) => ({
      id: String(a.id),
      priority: (a.priority || "info").toLowerCase(),
      title: a.title || "",
      location: a.location || "",
      timestamp: a.timestamp || "",
      coordinates: parseCoordinates(a.coordinates),
      type: a.type || "",
      message: a.message || "",
      reportedBy: a.reportedBy || "",
      contactNumber: a.contactNumber ?? "",
      acknowledged: Boolean(a.acknowledged),
      estimatedPeople: a.estimatedPeople || 0,
      temperature: a.temperature || "",
    }));
  }, [alerts]);

  const criticalCount = useMemo(
    () => mapAlerts.filter((a) => a.priority === "critical").length,
    [mapAlerts],
  );
  const importantCount = useMemo(
    () => mapAlerts.filter((a) => a.priority === "important").length,
    [mapAlerts],
  );
  const infoCount = useMemo(
    () => mapAlerts.filter((a) => a.priority === "info").length,
    [mapAlerts],
  );

  const handleMarkerClick = useCallback((alert: MapAlert) => {
    setSheetAlert(alert);
    setSheetOpen(true);
  }, []);

  // Clicking sidebar → pan/zoom map to that marker
  const handleSidebarClick = useCallback((id: string) => {
    // Reset to null first so clicking the same alert twice still triggers the effect
    setFocusAlertId(null);
    requestAnimationFrame(() => setFocusAlertId(id));
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setSheetAlert(null);
  }, []);

  return {
    alerts: mapAlerts,
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
  };
};
