"use client";

import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapAlert } from "../types/mapAlert";
import { MarkersController } from "./MarkersController";

interface MapComponentProps {
  alerts: MapAlert[];
  hoveredId: string | null;
  focusAlertId: string | null;
  onHover: (id: string | null) => void;
  onMarkerClick: (alert: MapAlert) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  alerts,
  hoveredId,
  focusAlertId,
  onHover,
  onMarkerClick,
}) => {
  return (
    <MapContainer
      center={[23.8746, 90.3983]}
      zoom={14}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
      scrollWheelZoom={true}
      // ✅ No minZoom / maxZoom / maxBounds — fully free
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
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
