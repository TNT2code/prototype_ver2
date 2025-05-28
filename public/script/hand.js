import { showCardDetail, attachDetailListeners } from "./modal.js";

export let hand = [];
export let selectedInstanceID = null;

export function setSelectedInstanceID(id) {
  selectedInstanceID = id;
}

export function renderHand() {
  let handArea = document.getElementById("hand");
  if (!handArea) {
    handArea = document.createElement("div");
    handArea.id = "hand";
    handArea.className = "hand-panel";
    document.body.appendChild(handArea);
  }

    handArea.innerHTML = "";

  hand.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "hand-card";
    div.dataset.id = card.ID;
    div.dataset.index = index;
    div.dataset.instanceId = card.instanceID;
    div.setAttribute("draggable", "true");





// カード画像の表示
const id = card.ID;
const folder = id.split("-")[0]; // "03-F002" → "03"
const img = document.createElement("img");
img.className = "card-image";
img.alt = card.カード名;

// ✅ onerror前に代替処理を準備
img.onerror = () => {
  img.onerror = null; // ループ防止
  const kind = (card.種類 || "unknown").toLowerCase();
  img.src = `images/placeholders/${kind}.webp`;
};

img.src = `images/${folder}/${id}.webp`; // onerrorより後にセット
div.appendChild(img);


    // ✅ ドラッグ処理
    div.addEventListener("dragstart", (e) => {
      /*const ghost = document.createElement("div");
      ghost.style.position = "absolute";
      ghost.style.top = "-9999px";
      ghost.textContent = card.カード名;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);

      e.dataTransfer.setData("text/plain", card.instanceID);

      const handEl = document.getElementById("hand");
      if (handEl) handEl.style.display = "none";*/

  setSelectedInstanceID(card.instanceID);
  setSelectedSource("hand");

  e.dataTransfer.setData("text/plain", card.instanceID);
  e.dataTransfer.setDragImage(img, 30, 40); // 元の画像を使う

    });

    // ✅ 選択中表示
    if (selectedInstanceID === card.instanceID) {
      div.style.outline = "2px solid #0f0";
    }

    // ✅ カード選択処理
    div.addEventListener("click", () => {
      setSelectedInstanceID(card.instanceID);
      renderHand();
    });

    attachDetailListeners(div, card);

    handArea.appendChild(div);
  });
}


//カードオブジェクト（手札内など）を取得する関数
export function getSelectedCard() {
  return hand.find(card => card.instanceID === selectedInstanceID) || null;
}


export let selectedSource = null;
export function setSelectedSource(source) {
  selectedSource = source;
}