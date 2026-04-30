import L from "leaflet";
import { Priority } from "../types/mapAlert";
import { PRIORITY_META } from "../config/priorityMeta";

export function createMarkerIcon(
  priority: string,
  isHovered: boolean,
): L.DivIcon {
  const priorityT: Priority =
    priority === "critical" || priority === "important" || priority === "info"
      ? priority
      : ("critical" as Priority);

  const cfg = PRIORITY_META[priorityT];
  const size = isHovered ? 36 : 28;
  const inner = isHovered ? 14 : 10;
  const pulse =
    priority === "critical"
      ? `
    <span style="
      position:absolute; inset:0; border-radius:50%;
      background:${cfg.markerColor}; opacity:0.3;
      animation: ping 1.8s cubic-bezier(0,0,0.2,1) infinite;
    "></span>
  `
      : "";

  return new L.DivIcon({
    className: "",
    html: `
      <div style="
        position:relative; width:${size}px; height:${size}px;
        display:flex; align-items:center; justify-content:center;
      ">
        ${pulse}
        <div style="
          position:relative; z-index:1;
          width:${size}px; height:${size}px; border-radius:50%;
          background:${cfg.outerRing};
          border: 3px solid ${cfg.markerColor};
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 0 ${isHovered ? 14 : 6}px ${cfg.markerGlow}55,
                      0 2px 8px rgba(0,0,0,0.5);
          transition: all 0.25s ease;
        ">
          <div style="
            width:${inner}px; height:${inner}px; border-radius:50%;
            background:${cfg.markerColor};
            box-shadow: 0 0 6px ${cfg.markerGlow}88;
          "></div>
        </div>
      </div>
      <style>
        @keyframes ping {
          0%  { transform: scale(1);    opacity:0.4; }
          100%{ transform: scale(2.2);  opacity:0; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 6],
  });
}
