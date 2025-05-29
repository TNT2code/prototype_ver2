import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

export const socket = io();

export let isHost = false;
export let roomId = prompt("ルームIDを入力してください", "room1");

socket.on("connect", () => {
  console.log("🟢 Socket接続完了:", socket.id);
  socket.emit("join-room", roomId);  // ← 接続後に emit
});

socket.on("assign-role", (role) => {
  isHost = role === "host";
  console.log("🧩 あなたの役割は:", isHost ? "ホスト" : "ゲスト");
});


export function convertZoneForPerspective(zone, isHost) {
  if (typeof zone !== "string") {
    console.warn("❌ convertZoneForPerspective: 無効な zone 値:", zone);
    return zone; // 無効なときはそのまま返す
  }

  if (isHost) return zone;

  if (zone.includes("-player")) return zone.replace("-player", "-opponent");
  if (zone.includes("-opponent")) return zone.replace("-opponent", "-player");

  return zone;
}
