// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const rooms = {}; // ルームごとにプレイヤー管理

// 静的ファイルを配信する
app.use(express.static('public'));


io.on("connection", (socket) => {
  console.log("🟢 ユーザー接続:", socket.id);

  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) rooms[roomId] = [];

    const playerCount = rooms[roomId].length;
    if (playerCount >= 2) {
      socket.emit("room-full");
      return;
    }

    socket.join(roomId);
    rooms[roomId].push(socket.id);

    const role = playerCount === 0 ? "host" : "guest";
    socket.emit("assign-role", role);

    console.log(`🔵 ${socket.id} が ${roomId} に ${role} として参加`);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    console.log("🔴 ユーザー切断:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("✅ Socket.IO サーバー起動中（ポート3000）");
});
