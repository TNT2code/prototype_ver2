import { renderHand, hand, setSelectedInstanceID } from "./hand.js";
import { returnToDeck, mainDeck, mercDeck } from "./deck.js";
import { createCardElement } from "./utils.js";

const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalList = document.getElementById("modal-list");
const modalClose = document.getElementById("modal-close");

modalClose.addEventListener("click", () => {
  modalOverlay.style.display = "none";
});

export function showModal(zone, cards) {
  console.log("モーダルを開いたゾーン:", zone);
  console.log("モーダル内のカードリスト:", cards);

  const localCards = [...cards];

  // 💬 タイトルと属性アイコンを一緒に表示
const titleWrap = document.createElement("div");
titleWrap.className = "modal-title-wrap"; // ← CSSで display: flex にしておくと横並び

const titleText = document.createElement("div");
titleText.textContent = `${zone} (${localCards.length}枚)`;

// 属性アイコンエリア
const attrIcons = document.createElement("div");
attrIcons.className = "attr-icons-inline";

const attrMap = {
  "力": "attr-power",
  "知": "attr-wisdom",
  "生": "attr-life",
  "魂": "attr-soul",
  "速": "attr-speed",
  "技": "attr-tech"
};

// ゾーンに含まれるカードの属性を一意に集める
const uniqueAttrs = new Set();
localCards.forEach(card => {
  if (card.属性1) uniqueAttrs.add(card.属性1);
  if (card.属性2) uniqueAttrs.add(card.属性2);
});

// 属性ごとに丸アイコン生成
Array.from(uniqueAttrs).forEach(attr => {
  const className = attrMap[attr];
  if (className) {
    const dot = document.createElement("div");
    dot.className = `attr-icon ${className}`;
    attrIcons.appendChild(dot);
  }
});

titleWrap.appendChild(titleText);
titleWrap.appendChild(attrIcons);
modalTitle.innerHTML = "";
modalTitle.appendChild(titleWrap);

  modalList.innerHTML = "";

  if (localCards.length === 0) {
    modalList.innerHTML = "<li>空です</li>";
    modalOverlay.style.display = "flex";
    return;
  }

localCards.forEach((card) => {
  const li = createCardElement(card, "deck-card", "deck");

    // ドラッグ用に追加で閉じる処理
    li.addEventListener("dragstart", (e) => {
      setSelectedInstanceID(card.instanceID);
      e.dataTransfer.setData("application/json", JSON.stringify({
        instanceID: card.instanceID,
        source: "deck"
      }));
      modalOverlay.style.display = "none";
    });

    // タッチ操作サポート
    let dragged = false;
    li.addEventListener("touchstart", () => { dragged = false; }, { passive: true });
    li.addEventListener("touchmove", (e) => {
      if (!dragged) {
        dragged = true;
        e.preventDefault();
        setSelectedInstanceID(card.instanceID);
        modalOverlay.style.display = "none";
      }
    }, { passive: false });

    if (zone !== "deck") {
      li.addEventListener("click", () => {
        setSelectedInstanceID(card.instanceID);
        renderHand();
      });
    }

    modalList.appendChild(li);
  });

  modalOverlay.style.display = "flex";
}

export function showCardDetail(card) {
  modalTitle.textContent = `《${card.カード名}》`;
  modalList.innerHTML = "";
  const details = [
    `属性1: ${card.属性1 ?? "なし"}`,
    `属性2: ${card.属性2 ?? "なし"}`,
    `クラス1: ${card.クラス1 ?? "なし"}`,
    `クラス2: ${card.クラス2 ?? "なし"}`,
    `コスト: ${card.コスト ?? "不明"}`,
    `戦意: ${card.戦意 ?? "不明"}`,
    `パワー: ${card.パワー ?? "不明"}`,
    `フォース: ${card.フォース ?? "不明"}`,
    `効果: ${card.効果 ?? "効果なし"}`,
  ];
  details.forEach((d) => {
    const li = document.createElement("li");
    li.textContent = d;
    modalList.appendChild(li);
  });
  modalOverlay.style.display = "flex";
}

export function attachDetailListeners(elem, card) {
  elem.addEventListener("dblclick", () => {
    showCardDetail(card);
  });

  let lastTap = 0;
  elem.addEventListener("touchend", () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      showCardDetail(card);
    }
    lastTap = now;
  });

  elem.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showCardDetail(card);
  });
}

export function showDeckReturnDestination(card) {
  const modalOverlay = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalList = document.getElementById("modal-list");

  modalTitle.textContent = `《${card.カード名}》をどちらのデッキに戻しますか？`;
  modalList.innerHTML = "";

  const options = [
    { label: "メインデッキ", targetDeck: "main" },
    { label: "傭兵デッキ", targetDeck: "merc" }
  ];

  options.forEach((opt) => {
    const li = document.createElement("li");
    li.textContent = opt.label;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      if (opt.targetDeck === "main") {
        showDeckReturnOptions(card, opt.targetDeck);
      } else {
        returnToDeck(card, "bottom", "merc");
        modalOverlay.style.display = "none";
      }
    });
    modalList.appendChild(li);
  });

  modalOverlay.style.display = "flex";
}

export function showDeckReturnOptions(card, targetDeck) {
  const modalOverlay = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalList = document.getElementById("modal-list");

  modalTitle.textContent = `《${card.カード名}》をどう戻しますか？`;
  modalList.innerHTML = "";

  const options = [
    { label: "一番上に戻す", mode: "top" },
    { label: "一番下に戻す", mode: "bottom" },
    { label: "シャッフルして戻す", mode: "shuffle" },
  ];

  options.forEach((opt) => {
    const li = document.createElement("li");
    li.textContent = opt.label;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      returnToDeck(card, opt.mode, targetDeck);
      modalOverlay.style.display = "none";
    });
    modalList.appendChild(li);
  });

  modalOverlay.style.display = "flex";
}

export function showDeckChoiceModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalList = document.getElementById("modal-list");

  modalTitle.textContent = "表示するデッキを選んでください";
  modalList.innerHTML = "";

  const options = [
    { label: "メインデッキ", deck: mainDeck },
    { label: "傭兵デッキ", deck: mercDeck }
  ];

  options.forEach(opt => {
    const li = document.createElement("li");
    li.textContent = opt.label;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      showModal("deck", opt.deck);
    });
    modalList.appendChild(li);
  });

  modalOverlay.style.display = "flex";
}
