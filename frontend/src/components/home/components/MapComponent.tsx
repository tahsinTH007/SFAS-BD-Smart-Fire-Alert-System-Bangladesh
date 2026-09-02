"use client";

import React, { useId, useMemo } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapAlert } from "../types/mapAlert";
import { MarkersController } from "./MarkersController";
import { MapResizeHandler } from "./MapResizeHandler";

interface MapComponentProps {
  alerts: MapAlert[];
  hoveredId: string | null;
  focusAlertId: string | null;
  onHover: (id: string | null) => void;
  onMarkerClick: (alert: MapAlert) => void;
}

/** Dhaka, used until we have alerts to fit the view around. */
const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125];

const MapComponent: React.FC<MapComponentProps> = ({
  alerts,
  hoveredId,
  focusAlertId,
  onHover,
  onMarkerClick,
}) => {
  // Centre on the mean of real alert positions so the first paint is useful.
  const center = useMemo<[number, number]>(() => {
    const points = alerts
      .map((a) => a.coordinates)
      .filter((c): c is [number, number] => !!c && (c[0] !== 0 || c[1] !== 0));

    if (!points.length) return DEFAULT_CENTER;

    const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
    const lng = points.reduce((s, p) => s + p[1], 0) / points.length;
    return [lat, lng];
  }, [alerts]);

  // React 19's dev-mode double-mount re-runs this component against the same
  // DOM node, and Leaflet throws "Map container is being reused by another
  // instance". A key unique to each mount hands it a fresh container.
  const instanceKey = useId();

  return (
    <MapContainer
      key={instanceKey}
      center={center}
      zoom={12}
      minZoom={5}
      maxZoom={18}
      style={{ width: "100%", height: "100%", background: "#0b1120" }}
      zoomControl={false}
      scrollWheelZoom
      worldCopyJump
    >
      {/*
        OpenStreetMap's own tiles: free and key-less. The previous CartoDB
        basemap endpoint now requires an API key and was rendering an
        "API KEY REQUIRED" watermark across every tile.

        `sfas-dark-tiles` (globals.css) inverts them into a dark basemap that
        matches the console UI, so no paid dark-tile provider is needed.
      */}
      <TileLayer
        className="sfas-dark-tiles"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <MapResizeHandler />

      <ZoomControl position="bottomright" />

      <MarkersController
        alerts={alerts}
        hoveredId={hoveredId}
        focusAlertId={focusAlertId}
        onHover={onHover}
        onMarkerClick={onMarkerClick}
      />
    </MapContainer>
  );
};

export default MapComponent;
