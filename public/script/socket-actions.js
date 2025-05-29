// socket-actions.js
// 各種同期用の共通イベント定義
import { socket } from './socket-io.js';
import { createBarricadeElement, createCardElement } from './utils.js';
import { zones } from './zones.js';
import { attachDetailListeners } from './modal.js';
import { convertZoneForPerspective } from './socket-io.js';

console.log("✅ JS読込: socket-actions.js");

socket.on("connect", () => {
  console.log("🟢 Socket接続完了:", socket.id);
});




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



// 🧩 カード移動イベント受信
socket.on("move-card", ({ card, toZone, cellId }) => {
  console.log("📥 move-card受信:", card, toZone, cellId);

   const convertedZone = convertZoneForPerspective(toZone, isHost); // ←ここ修正
  removeCardByInstanceID(card.instanceID);  // 重複カード削除
  if (!zones[convertedZone]) return;
  zones[convertedZone].push(card);

  // ✅ スロット or 手札ゾーンへの追加（data-zone 対応）
  const slotTarget = document.querySelector(`[data-zone="${convertedZone}"]`);
  if (slotTarget) {
    const elem = createCardElement(card, "zone-card");
    elem.setAttribute("data-instance-id", card.instanceID);
    attachDetailListeners(elem, card);
    //slotTarget.appendChild(elem);
    return;
  }

  // ✅ 戦地セルへの追加（cellId 指定 or fallback）
  const cell = cellId
    ? document.getElementById(cellId)
    : document.querySelector(`#${zoneToCellId(convertedZone)}`);

  if (cell) {
    const elem = createCardElement(card, "placed-card", "battle");
    elem.setAttribute("data-instance-id", card.instanceID);

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
    console.warn(`❌ 対象cellが見つかりません: ${cellId ?? zoneToCellId(convertedZone)}`);
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

function removeCardByInstanceID(instanceID) {
  for (const zone in zones) {
    const index = zones[zone].findIndex(c => c.instanceID === instanceID);
    if (index !== -1) {
      zones[zone].splice(index, 1); // ゾーンから削除
      break;
    }
  }

  const elem = document.querySelector(`[data-instance-id="${instanceID}"]`);
  if (elem) elem.remove(); // DOMから削除
}



socket.on("assign-role", (role) => {
  const isGuest = role === "guest";
  isHost = role === "host";

  if (isGuest) {
    document.body.classList.add("guest");

    // 🧩 スロットゾーンの位置を入れ替え
    const board = document.querySelector(".board");

    const topLeft = document.querySelector(".side-zone-top-left");
    const bottomRight = document.querySelector(".side-zone-bottom-right");
    const topRight = document.querySelector(".resource-zone-top-right");
    const bottomLeft = document.querySelector(".resource-zone-bottom-left");

    if (board && topLeft && bottomRight && topRight && bottomLeft) {
      board.insertBefore(bottomRight, topLeft); // プレイヤーゾーンを上に
      board.insertBefore(bottomLeft, topRight); // プレイヤーリソースも上に
      board.insertBefore(topLeft, board.children[board.children.length - 1]); // 敵ゾーンを下に
      board.insertBefore(topRight, board.children[board.children.length - 1]); // 敵リソースも下に
    }
  } else {
    document.body.classList.add("host");
  }
});

