// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { readFileSync } from "fs";

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


  socket.on("move-card", ({ roomId, card, toZone }) => {
  socket.to(roomId).emit("move-card", { card, toZone });
});


  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    console.log("🔴 ユーザー切断:", socket.id);
  });
  
});

// 🆕 デッキをシャッフルして生成する関数
function generateShuffledDeck() {
  const sampleCard = (id) => ({
    id: `00-S000${id}`,
    名前: `カード${id}`,
    パワー: 3 + (id % 3),
    フォース: 1 + (id % 2),
    instanceID: `uuid-${Date.now()}-${Math.random().toString(16).slice(2)}`
  });

  const deck = Array.from({ length: 30 }, (_, i) => sampleCard(i + 1));
  return deck.sort(() => Math.random() - 0.5);
}


server.listen(3000, () => {
  console.log("✅ Socket.IO サーバー起動中（ポート3000）");
});

