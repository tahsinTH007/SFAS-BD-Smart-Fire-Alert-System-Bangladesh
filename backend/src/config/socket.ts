import type { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { env } from "./env.js";
import { isOriginAllowed } from "./cors.js";
import { logger } from "../lib/logger.js";
import { registerAlertSocket } from "../modules/alerts/alert.socket.js";

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    path: env.SOCKET_PATH,
    pingInterval: Number(env.SOCKET_PING_INTERVAL),
    pingTimeout: Number(env.SOCKET_PING_TIMEOUT),
    // Alert payloads are ~1KB. Compressing them costs more latency than the
    // bytes are worth, and this is a life-safety notification path.
    perMessageDeflate: false,
    // Skip the HTTP long-poll handshake entirely where the browser supports it.
    transports: ["websocket", "polling"],
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === env.SOCKET_CORS_ORIGIN || isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed`), false);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    registerAlertSocket(socket, io!);

    socket.on("disconnect", (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIO = (): Server | null => io;

/** Broadcasts to every connected dashboard. No-op before initSocket runs. */
export function emitToAll(event: string, payload: unknown): void {
  io?.emit(event, payload);
}

/** Broadcasts to one room, e.g. `building:Building A`. */
export function emitToRoom(
  room: string,
  event: string,
  payload: unknown,
): void {
  io?.to(room).emit(event, payload);
}

export { io };
