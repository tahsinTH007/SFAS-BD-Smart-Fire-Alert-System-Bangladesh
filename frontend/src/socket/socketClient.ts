import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { store } from "@/redux/store";
import {
  alertReceived,
  alertRemoved,
  alertUpdated,
} from "@/redux/slices/alertSlice";
import {
  readingReceived,
  socketStatusChanged,
  type LiveReading,
} from "@/redux/slices/telemetrySlice";
import { SOCKET_URL } from "@/lib/config";
import type { AlertResponse } from "@/api/types";

let socket: Socket | null = null;
const announced = new Set<string>();

/** Short attention tone for critical alerts. Silently no-ops if blocked. */
function playAlertTone() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.36);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
    osc.onended = () => void ctx.close();
  } catch {
    // Autoplay policy or no audio device — not worth surfacing.
  }
}

export const connectSocket = (): Socket => {
  if (socket?.connected) return socket;
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 15000,
  });

  socket.on("connect", () => {
    store.dispatch(socketStatusChanged(true));
  });

  socket.on("disconnect", () => {
    store.dispatch(socketStatusChanged(false));
  });

  socket.on("connect_error", () => {
    store.dispatch(socketStatusChanged(false));
  });

  // ── Alerts ────────────────────────────────────────────────────────────────
  socket.on("alert:new", (alert: AlertResponse) => {
    store.dispatch(alertReceived(alert));

    if (announced.has(alert.id)) return;
    announced.add(alert.id);

    const isCritical = alert.priority === "critical";
    if (isCritical) playAlertTone();

    const body = [alert.location, alert.riskScore ? `risk ${alert.riskScore}/100` : null]
      .filter(Boolean)
      .join(" · ");

    const show = isCritical ? toast.error : toast.warning;
    show(alert.title, {
      description: body || alert.message.split("\n")[0],
      duration: isCritical ? 12000 : 6000,
      position: "top-right",
      action: {
        label: "View",
        onClick: () => {
          window.location.href = `/notifications/${alert.id}`;
        },
      },
    });
  });

  socket.on("alert:update", (alert: AlertResponse) => {
    store.dispatch(alertUpdated(alert));
  });

  socket.on("alert:delete", ({ id }: { id: string }) => {
    store.dispatch(alertRemoved(id));
  });

  // ── Live sensor telemetry ─────────────────────────────────────────────────
  socket.on("telemetry:reading", (reading: LiveReading) => {
    store.dispatch(readingReceived(reading));
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const joinBuilding = (building: string) =>
  socket?.emit("alert:join-building", building);

export const joinDevice = (deviceId: string) =>
  socket?.emit("alert:join-device", deviceId);
