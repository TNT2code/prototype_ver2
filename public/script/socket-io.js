import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

export const socket = io();

export let isHost = false;
export let roomId = prompt("ルームIDを入力してください", "room1");

socket.on("assign-role", (role) => {
  isHost = role === "host";
  console.log("🧩 あなたの役割は:", isHost ? "ホスト" : "ゲスト");
});

// 初期接続後にルーム参加
socket.emit("join-room", roomId);
