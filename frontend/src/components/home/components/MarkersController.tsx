"use client";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { MapAlert } from "../types/mapAlert";
import { createMarkerIcon } from "../utilities/markerUtils";
import { createTooltipHtml } from "../utilities/tooltipUtils";

interface MarkersControllerProps {
  alerts: MapAlert[];
  hoveredId: string | null;
  focusAlertId: string | null;
  onHover: (id: string | null) => void;
  onMarkerClick: (alert: MapAlert) => void;
}

export const MarkersController: React.FC<MarkersControllerProps> = ({
  alerts,
  hoveredId,
  focusAlertId,
  onHover,
  onMarkerClick,
}) => {
  const map = useMap();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // ── Effect 1: rebuild all markers when alerts list or hover changes ──
  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    alerts.forEach((alert) => {
      if (!alert.coordinates) return;

      const latLng: L.LatLngTuple = [
        alert.coordinates[0],
        alert.coordinates[1],
      ];
      const isHovered = hoveredId === alert.id;
      const icon = createMarkerIcon(alert.priority, isHovered);

      const marker = L.marker(latLng, {
        icon,
        zIndexOffset: isHovered ? 1000 : 0,
      });

      const tooltip = L.tooltip({
        permanent: false,
        direction: "top",
        offset: [0, -10],
        className: "leaflet-tooltip-custom",
      }).setContent(createTooltipHtml(alert));

      marker
        .addTo(map)
        .bindTooltip(tooltip)
        .on("mouseover", () => onHover(alert.id))
        .on("mouseout", () => onHover(null))
        .on("click", () => onMarkerClick(alert));

      markersRef.current.set(alert.id, marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
    };
  }, [alerts, hoveredId, map, onHover, onMarkerClick]);

  // ── Effect 2: fly to marker when sidebar item is clicked ──
  useEffect(() => {
    if (!focusAlertId) return;

    const alert = alerts.find((a) => a.id === focusAlertId);
    if (!alert || !alert.coordinates) return;

    const latLng: L.LatLngTuple = [alert.coordinates[0], alert.coordinates[1]];

    // Fly smoothly to the marker and zoom in
    map.flyTo(latLng, 17, { animate: true, duration: 1.0 });

    // Open tooltip briefly so user sees which marker is focused
    const marker = markersRef.current.get(focusAlertId);
    if (marker) {
      setTimeout(() => {
        marker.openTooltip();
        setTimeout(() => marker.closeTooltip(), 2500);
      }, 1100); // wait for fly animation to finish first
    }
  }, [focusAlertId]); // ✅ ONLY depends on focusAlertId — not alerts/map

  return null;
};
