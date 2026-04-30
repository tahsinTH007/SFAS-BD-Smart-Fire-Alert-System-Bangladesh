import { Socket, Server } from "socket.io";

export const registerAlertSocket = (socket: Socket, io: Server) => {
  console.log("Alert socket registered:", socket.id);

  // Join building room
  socket.on("alert:join-building", (building: string) => {
    socket.join(`building:${building}`);
    console.log(`Socket ${socket.id} joined room building:${building}`);
  });

  // Join device room
  socket.on("alert:join-device", (deviceId: string) => {
    socket.join(`device:${deviceId}`);
    console.log(`Socket ${socket.id} joined room device:${deviceId}`);
  });
};
