import { MapAlert } from "../types/mapAlert";
import { PRIORITY_META } from "../config/priorityMeta";

export function createTooltipHtml(alert: MapAlert): string {
  const priority = (alert.priority || "info").toLowerCase() as
    | "critical"
    | "important"
    | "info";
  const cfg = PRIORITY_META[priority] || PRIORITY_META["info"];

  const iconSvg = {
    critical:
      '<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    important:
      '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  };

  return `
    <div style="
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 3px solid ${cfg.markerColor};
      border-radius: 10px;
      padding: 10px 13px;
      min-width: 200px; max-width: 240px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
      font-family: 'Inter', sans-serif;
    ">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
        <span style="
          display:inline-flex; align-items:center; justify-content:center;
          width:18px; height:18px; border-radius:5px;
          background:${cfg.markerColor}18; border:1px solid ${cfg.markerColor}44;
        ">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${cfg.markerColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${iconSvg[priority]}
          </svg>
        </span>
        <span style="font-size:11px; font-weight:700; color:#1e293b; text-transform:uppercase; letter-spacing:0.06em;">
          ${cfg.label}
        </span>
        <span style="margin-left:auto; font-size:9px; color:#94a3b8;">${(alert.timestamp || "").replace("Today, ", "")}</span>
      </div>
      <p style="font-size:12px; font-weight:600; color:#0f172a; line-height:1.35; margin:0 0 4px;">
        ${(alert.title || "").replace(/^[\u{1F300}-\u{1FFFF}]\s*/u, "")}
      </p>
      <p style="font-size:10.5px; color:#475569; margin:0 0 6px; line-height:1.4;">
        ${alert.location || ""}
      </p>
      ${
        alert.estimatedPeople
          ? `
        <div style="display:flex; align-items:center; gap:4px; font-size:10px; color:#64748b;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          ~${alert.estimatedPeople} people at risk
        </div>
      `
          : ""
      }
      <div style="margin-top:6px; padding-top:5px; border-top:1px solid #e2e8f0; font-size:9.5px; color:#94a3b8; font-style:italic;">
        Click to open details →
      </div>
    </div>
  `;
}
