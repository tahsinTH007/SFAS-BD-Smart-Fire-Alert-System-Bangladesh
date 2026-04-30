import { Server } from "socket.io";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";
import { registerAlertSocket } from "../modules/alerts/alert.socket.js";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info("Client connected:", socket.id);

    // Register module-specific sockets
    registerAlertSocket(socket, io);

    socket.on("disconnect", () => {
      logger.info("Client disconnected:", socket.id);
    });
  });

  return io;
};

export { io };
