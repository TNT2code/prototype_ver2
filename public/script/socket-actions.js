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


// 🔁 ゾーン名 → セルID の変換
function zoneToCellId(zone) {
  switch (zone) {
    case "battle-player": return "player-cell";
    case "battle-opponent": return "enemy-cell";
    case "battle-center": return "center-cell";
    default: return "";
  }
}


// 🧩 カード移動イベント受信（相手の操作）
// socket-actions.js
socket.on("move-card", ({ card, toZone }) => {
  console.log("📥 move-card受信:", card, toZone);

  if (!zones[toZone]) {
    console.warn("❌ 無効なゾーン:", toZone);
    return;
  }

  zones[toZone].push(card); // 受信側のzone情報に追加

  const target = document.querySelector(`[data-zone="${toZone}"]`);

  if (target) {
    // 通常スロットや手札ゾーンに表示
    const elem = createCardElement(card);
    attachDetailListeners(elem, card);
    target.appendChild(elem);
  } else {
    // たとえば戦地（battle系）は cell ID にマッピングされる
    const cell = document.querySelector(`#${zoneToCellId(toZone)}`);
    if (cell) {
      const elem = createCardElement(card, "placed-card", "battle");

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
    } else {
      console.warn(`❌ 対象DOMが見つかりません: ${toZone}`);
    }
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