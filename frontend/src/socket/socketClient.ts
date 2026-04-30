import { io, Socket } from "socket.io-client";
import { store } from "@/redux/store";
import { addAlert, updateAlert } from "@/redux/slices/alertSlice";
import { AlertResponse } from "@/api/alertApi";
import { toast } from "sonner";

let socket: Socket;
const shownAlerts = new Set<string>();

export const connectSocket = () => {
  if (socket?.connected) return;

  socket = io("http://localhost:8080", {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 3000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("alert:new", (alert: AlertResponse) => {
    store.dispatch(addAlert(alert));

    if (!alert.read && !shownAlerts.has(alert.id)) {
      toast(`${alert.title} - ${alert.message}`, {
        position: "top-center",
        duration: 5000,
        action: {
          label: "×",
          onClick: () => toast.dismiss(),
        },
      });

      shownAlerts.add(alert.id);
    }
  });

  socket.on("alert:update", (alert: AlertResponse) => {
    store.dispatch(updateAlert(alert));
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.error("❌ Socket error:", error.message);
  });
};

export const getSocket = () => socket;
