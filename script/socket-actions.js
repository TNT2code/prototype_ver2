// socket-actions.js
// 各種同期用の共通イベント定義
import { socket } from './socket-io.js';
import { createBarricadeElement, createCardElement } from './utils.js';
import { zones } from './zones.js';
import { attachDetailListeners } from './modal.js';

// 🔰 バリケード設置イベント受信処理
socket.on("place-barricade", ({ zone, power }) => {
  const barricade = createBarricadeElement(power);
  const target = document.querySelector(`[data-zone="${zone}"]`);
  if (target) target.appendChild(barricade);
});

// 🔰 リソース更新（相手の）
socket.on("update-opponent-status", ({ id, value }) => {
  const elem = document.getElementById(`opponent-${id}`);
  if (elem) elem.textContent = value;
});

// 🪪 プレイヤーの識別（仮実装）
let isHost = false;
socket.on("assign-role", (role) => {
  isHost = role === "host";
});

// 🧩 カード移動イベント受信（相手の操作）
socket.on("move-card", ({ card, toZone }) => {
  if (!zones[toZone]) return;
  zones[toZone].push(card);

  const target = document.querySelector(`[data-zone="${toZone}"]`);
  if (target) {
    const elem = createCardElement(card);
    attachDetailListeners(elem, card);
    target.appendChild(elem);
  }
});

  // カード削除の同期
  socket.on("remove-card", ({ instanceID }) => {
    if (!instanceID) return;

    for (const zone in zones) {
      const index = zones[zone].findIndex(c => c.instanceID === instanceID);
      if (index !== -1) zones[zone].splice(index, 1);
    }

    const elem = document.querySelector(`[data-instance-id="${instanceID}"]`);
    if (elem) elem.remove();
  });



export { isHost };