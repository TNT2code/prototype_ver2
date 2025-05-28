// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// サーバーの初期化
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 静的ファイル（index.htmlなど）を配信
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('✅ ユーザー接続:', socket.id);

  // メッセージ受信
  socket.on('message', (data) => {
    console.log('📨 受信:', data);
    // 全クライアントに中継
    socket.broadcast.emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ ユーザー切断:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 サーバー起動中 http://localhost:${PORT}`);
});

io.on("connection", (socket) => {
  console.log("🟢 新しいクライアントが接続");

  socket.on("message", (msg) => {
    console.log("📩 受信メッセージ:", msg);
    // 全クライアントに中継
    socket.broadcast.emit("message", msg);
  });
});
