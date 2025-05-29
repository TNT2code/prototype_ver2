import { attachDetailListeners } from "./modal.js";
import { zones } from './zones.js';


export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

//instanceID を自動で作る関数
export function generateInstanceID() {
  return crypto.randomUUID();
}




// IDから画像パスを生成（例: images/01/01-S0001.webp）
function getImagePathFromID(cardID) {
  const folder = cardID.split("-")[0];  // 例: "01"
  return `images/${folder}/${cardID}.webp`;
}

export function createCardElement(card, className = "placed-card", source = "battle") {
  const div = document.createElement("div");
  div.className = className;
  div.dataset.name = card.カード名;
  div.dataset.instanceId = card.instanceID;
  div.setAttribute("draggable", "true");

  // 画像要素の作成
const img = document.createElement("img");

img.alt = card.カード名;
img.className = "card-image";

img.onerror = () => {
  img.onerror = null;
  const kind = (card.種類 || "unknown").toLowerCase();
  img.src = `images/placeholders/${kind}.webp`;
};

img.src = getImagePathFromID(card.ID); // ★ これを onerror の後にする！
div.appendChild(img);

  // dragstart イベント
  div.addEventListener("dragstart", (e) => {
    console.log("🔥 dragstart 発火:", card.instanceID);
    console.log("🔥 dragstart source:", source);

    window.__draggingInstanceID = card.instanceID;
    window.__draggingSource = source;

    e.dataTransfer.setData("application/json", JSON.stringify({
      source: source,
      instanceID: card.instanceID
    }));
  });

  //attachDetailListeners(div, card);
  return div;
}

// バリケード要素を作成
export function createBarricadeElement(power = 0) {
  const div = document.createElement("div");
  div.className = "placed-card";
  div.setAttribute("draggable", "true");
  div.dataset.barricade = "true";
  div.dataset.power = power;

  // ✅ 画像
  const img = document.createElement("img");
  img.src = "images/placeholders/barricade.webp";
  img.alt = "バリケード";
  img.className = "card-image";
  div.appendChild(img);

  // ✅ パワーラベル
  const powerLabel = document.createElement("div");
  powerLabel.className = "barricade-label";
  powerLabel.textContent = ` ${power}`;
  div.appendChild(powerLabel);

  // ✅ ドラッグ処理
div.addEventListener("dragstart", (e) => {
  window.__draggingBarricade = true;
  window.__draggingBarricadePower = power;
});

// ✅ モバイル対応（重要！）
div.addEventListener("touchstart", (e) => {
  e.preventDefault(); // スクロール防止
  window.__draggingBarricade = true;
  window.__draggingBarricadePower = power;
}, { passive: false });


  // ✅ 長押しで削除
// ✅ 長押しで削除
let pressTimer;
const startPress = () => {
  pressTimer = setTimeout(() => {
    // ✅ グローバルフラグを解除
    if (window.__draggingBarricade !== undefined) {
      delete window.__draggingBarricade;
      delete window.__draggingBarricadePower;
    }
    div.remove();
  }, 600);
};
const cancelPress = () => clearTimeout(pressTimer);

div.addEventListener("mousedown", startPress);
div.addEventListener("mouseup", cancelPress);
div.addEventListener("mouseleave", cancelPress);
div.addEventListener("touchstart", startPress, { passive: true });
div.addEventListener("touchend", cancelPress);
div.addEventListener("touchcancel", cancelPress);

  return div;
}



function getSlotAttributes(cards) {
  const attrs = new Set();
  cards.forEach(card => {
    if (card.属性1) attrs.add(card.属性1);
    if (card.属性2) attrs.add(card.属性2);
  });
  return Array.from(attrs);
}

const attributeClassMap = {
  "力": "attr-power",
  "知": "attr-wisdom",
  "生": "attr-life",
  "魂": "attr-soul",
  "速": "attr-speed",
  "技": "attr-tech"
};


export function updateSlotLabels() {
  const slotElements = document.querySelectorAll(".slot, .resource-slot");
  slotElements.forEach(slot => {
    const zone = slot.dataset.zone;
    const cards = zones[zone] ?? [];
    const count = cards.length;

    const label = slot.querySelector(".slot-label");
    if (label) label.textContent = `${count}`;

    // 共通クラス削除
    slot.classList.remove(
      "is-grave", "is-memorial", "is-strategy", "is-resource",
      ...Object.values(attributeClassMap)
    );

    // ゾーン種別
    if (zone.includes("graveyard")) slot.classList.add("is-grave");
    else if (zone.includes("memorial")) slot.classList.add("is-memorial");
    else if (zone.includes("strategy")) slot.classList.add("is-strategy");
    else if (zone.includes("resource")) slot.classList.add("is-resource");

// 例：より細かく制御する（任意）
if (zone.includes("resource1")) {
  slot.classList.add("is-resource1");
} else if (zone.includes("resource2")) {
  slot.classList.add("is-resource2");
}


  });
}

// utils.js の最後あたりに追加
export function removeCardByInstanceID(instanceID) {
  const elem = document.querySelector(`[data-instance-id="${instanceID}"]`);
  if (elem) elem.remove();
}
