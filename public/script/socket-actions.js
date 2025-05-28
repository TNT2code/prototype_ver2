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

function zoneToCellId(zone) {
  if (zone === "battle-player") return "player-0-0"; // 仮。実際のマスに合わせて変える
  if (zone === "battle-opponent") return "enemy-0-0";
  if (zone === "battle-center") return "center-0-0";
  return null;
}


// 🧩 カード移動イベント受信（相手の操作）
// socket-actions.js
socket.on("move-card", ({ card, toZone }) => {
  if (!zones[toZone]) return;
  zones[toZone].push(card);

  const cell = document.querySelector(`#${zoneToCellId(toZone)}`);
  if (cell) {
    const elem = createCardElement(card, "placed-card", "battle");
    
    // パワー・フォース表示
    const powerLabel = document.createElement("div");
    powerLabel.className = "power-label";
    powerLabel.textContent = `⚡${card.パワー ?? "?"}`;
    elem.appendChild(powerLabel);

    const forceLabel = document.createElement("div");
    forceLabel.className = "force-label";
    forceLabel.textContent = `✨${card.フォース ?? "?"}`;
    elem.appendChild(forceLabel);

    attachDetailListeners(elem, card);
    cell.appendChild(elem);
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