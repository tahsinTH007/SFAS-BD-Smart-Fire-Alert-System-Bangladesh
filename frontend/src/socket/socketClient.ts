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
let joinedStation: string | null = null;

// ─── Audio ────────────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

/**
 * Reuses one AudioContext. Creating one per alert is slow and browsers cap how
 * many can exist, which is exactly the wrong failure mode for an alarm tone.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Two-tone alarm for critical, single blip for important. */
export function playAlertTone(kind: "critical" | "important" = "critical") {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const beeps =
      kind === "critical"
        ? [
            { f: 950, t: 0, d: 0.18 },
            { f: 700, t: 0.2, d: 0.18 },
            { f: 950, t: 0.4, d: 0.18 },
            { f: 700, t: 0.6, d: 0.22 },
          ]
        : [{ f: 780, t: 0, d: 0.16 }];

    for (const b of beeps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(b.f, now + b.t);
      gain.gain.setValueAtTime(0.0001, now + b.t);
      gain.gain.exponentialRampToValueAtTime(0.09, now + b.t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + b.t + b.d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + b.t);
      osc.stop(now + b.t + b.d + 0.02);
    }
  } catch {
    /* autoplay policy — the visual banner still fires */
  }
}

/** Call from a click handler once, so later alarm tones are allowed to play. */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") void ctx.resume();
}

// ─── Desktop notifications ────────────────────────────────────────────────────

function showDesktopNotification(alert: AlertResponse) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const n = new Notification(alert.title, {
      body: `${alert.location ?? "Unknown location"} — risk ${alert.riskScore}/100`,
      tag: alert.id,
      requireInteraction: alert.priority === "critical",
    });
    n.onclick = () => {
      window.focus();
      window.location.href = `/notifications/${alert.id}`;
    };
  } catch {
    /* ignore */
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

// ─── Connection ───────────────────────────────────────────────────────────────

const PRIORITY_RANK = { info: 0, important: 1, critical: 2 } as const;

function shouldNotify(alert: AlertResponse): boolean {
  const { prefs, stationId } = store.getState().session;

  // Defence in depth: the server already scopes by room, but a stray broadcast
  // must never surface another station's incident on this console.
  if (stationId && alert.stationId && alert.stationId !== stationId) {
    return false;
  }

  return (
    PRIORITY_RANK[alert.priority] >= PRIORITY_RANK[prefs.minPriority]
  );
}

export const connectSocket = (): Socket => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    // WebSocket only on the first try: skips the HTTP long-poll handshake and
    // shaves a round-trip off first-alert latency.
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 8000,
  });

  socket.on("connect", () => {
    store.dispatch(socketStatusChanged(true));
    // Re-join on every (re)connect — rooms do not survive a reconnect.
    const stationId = store.getState().session.stationId;
    if (stationId) {
      socket!.emit("station:join", stationId);
      joinedStation = stationId;
    }
  });

  socket.on("disconnect", () => store.dispatch(socketStatusChanged(false)));
  socket.on("connect_error", () => store.dispatch(socketStatusChanged(false)));

  // ── Alerts ────────────────────────────────────────────────────────────────
  socket.on("alert:new", (alert: AlertResponse) => {
    if (!shouldNotify(alert)) return;

    store.dispatch(alertReceived(alert));

    if (announced.has(alert.id)) return;
    announced.add(alert.id);

    const { prefs } = store.getState().session;
    const isCritical = alert.priority === "critical";

    if (prefs.sound) playAlertTone(isCritical ? "critical" : "important");
    if (prefs.desktop) showDesktopNotification(alert);

    // Critical alerts get the full-screen banner instead of a toast; anything
    // less shows a toast so it does not interrupt the operator.
    if (isCritical && prefs.criticalBanner) return;

    const show = isCritical ? toast.error : toast.warning;
    show(alert.title, {
      description: `${alert.location ?? "Unknown location"} · risk ${alert.riskScore}/100`,
      duration: isCritical ? 15000 : 7000,
      action: {
        label: "Open",
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

/** Switches the console to a different station's feed. */
export const joinStation = (stationId: string) => {
  if (!socket || joinedStation === stationId) return;
  socket.emit("station:join", stationId);
  joinedStation = stationId;
  announced.clear();
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
  joinedStation = null;
};

/** Round-trip latency in ms, for the connection-quality indicator. */
export const measureLatency = (): Promise<number | null> =>
  new Promise((resolve) => {
    if (!socket?.connected) return resolve(null);
    const sent = Date.now();
    const timer = setTimeout(() => resolve(null), 3000);
    socket.emit("ping:check", sent, () => {
      clearTimeout(timer);
      resolve(Date.now() - sent);
    });
  });
