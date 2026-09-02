import { Socket, Server } from "socket.io";
import { logger } from "../../lib/logger.js";

/**
 * Room membership for a deployed console.
 *
 * The product is one console per fire station, so a browser joins
 * `station:<id>` and receives only that station's incidents. Building and
 * device rooms narrow it further for focused views.
 */
export const registerAlertSocket = (socket: Socket, _io: Server) => {
  socket.on("station:join", (stationId: string) => {
    if (typeof stationId !== "string" || !stationId) return;

    // Leave any previously joined station, so switching stations in Settings
    // does not leave the console subscribed to both.
    for (const room of socket.rooms) {
      if (room.startsWith("station:")) socket.leave(room);
    }

    socket.join(`station:${stationId}`);
    logger.debug(`Socket ${socket.id} joined station:${stationId}`);
    socket.emit("station:joined", { stationId });
  });

  socket.on("alert:join-building", (building: string) => {
    if (typeof building === "string" && building) {
      socket.join(`building:${building}`);
    }
  });

  socket.on("alert:join-device", (deviceId: string) => {
    if (typeof deviceId === "string" && deviceId) {
      socket.join(`device:${deviceId}`);
    }
  });

  /** Lets the console measure round-trip latency and show link quality. */
  socket.on("ping:check", (sentAt: number, ack?: (t: number) => void) => {
    if (typeof ack === "function") ack(sentAt);
  });
};
