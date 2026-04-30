// "use client";

// import React from "react";
// import { MapContainer, TileLayer } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import { MapAlert } from "./types/mapAlert";
// import { MarkersController } from "./components/MarkersController";

// interface MapComponentProps {
//   alerts: MapAlert[];
//   hoveredId: string | null; // ✅ Accept null
//   onHover: (id: string | null) => void;
//   onMarkerClick: (alert: MapAlert) => void;
// }

// const MapComponent: React.FC<MapComponentProps> = ({
//   alerts,
//   hoveredId,
//   onHover,
//   onMarkerClick,
// }) => {
//   const uttaraCenter: [number, number] = [23.8746, 90.3983];

//   const uttaraBounds: [[number, number], [number, number]] = [
//     [23.85, 90.37],
//     [23.9, 90.43],
//   ];

//   return (
//     <MapContainer
//       center={uttaraCenter}
//       zoom={16}
//       minZoom={14}
//       maxZoom={18}
//       style={{ width: "100%", height: "100%" }}
//       zoomControl={true}
//       maxBounds={uttaraBounds}
//       maxBoundsViscosity={0.8}
//       worldCopyJump={false}
//       scrollWheelZoom={true}
//     >
//       <TileLayer
//         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//         url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//       />
//       <MarkersController
//         alerts={alerts}
//         hoveredId={hoveredId}
//         onHover={onHover}
//         onMarkerClick={onMarkerClick}
//       />
//     </MapContainer>
//   );
// };

// export default MapComponent;

"use client";

import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapAlert } from "./types/mapAlert";
import { MarkersController } from "./components/MarkersController";

interface MapComponentProps {
  alerts: MapAlert[];
  hoveredId: string | null;
  focusAlertId: string | null; // ✅ NEW
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
      // ✅ No minZoom, maxZoom, maxBounds — fully free pan & zoom
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
      scrollWheelZoom={true}
      worldCopyJump={false}
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
