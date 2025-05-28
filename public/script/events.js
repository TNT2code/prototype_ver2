import { drawCards, mainDeck, mercDeck } from './deck.js';
import { hand, renderHand } from './hand.js';
import { cardData } from './data.js';
import { showModal, showDeckChoiceModal, showDeckReturnDestination } from './modal.js';
import { zones } from './zones.js';
import { shuffle, generateInstanceID, createCardElement } from './utils.js';
import { socket } from './socket-io.js';

function findCardByInstanceID(id) {
  return (
    hand.find(c => c.instanceID === id) ||
    mainDeck.find(c => c.instanceID === id) ||
    mercDeck.find(c => c.instanceID === id) ||
    Object.values(zones).flat().find(c => c.instanceID === id) ||
    null
  );
}

function removeCardFromAllZones(instanceID) {
  const removeByID = (arr) => {
    const index = arr.findIndex(c => c.instanceID === instanceID);
    if (index !== -1) arr.splice(index, 1);
  };

  removeByID(hand);
  removeByID(mainDeck);
  removeByID(mercDeck);
  for (const zone in zones) {
    zones[zone] = zones[zone].filter(c => c.instanceID !== instanceID);
  }

  const placed = document.querySelector(`.placed-card[data-instance-id="${instanceID}"]`);
  if (placed) placed.remove();
}

export function bindAllEvents() {
  document.getElementById("draw-button")?.addEventListener("click", () => drawCards());

  document.querySelectorAll(".plus").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const valueElem = document.getElementById(targetId);
      valueElem.textContent = parseInt(valueElem.textContent) + 1;
      valueElem.textContent = newValue;

      // ✅ 相手に送信（自分の値を相手に知らせる）
      socket.emit("update-opponent-status", { id: targetId, value: newValue });
    });
  });

  document.querySelectorAll(".minus").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const valueElem = document.getElementById(targetId);
      const currentValue = parseInt(valueElem.textContent);
      valueElem.textContent = currentValue > 0 ? currentValue - 1 : 0;
            valueElem.textContent = newValue;

      // ✅ 相手に送信
      socket.emit("update-opponent-status", { id: targetId, value: newValue });
    });
  });

  document.querySelectorAll(".slot, .resource-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      const zone = slot.dataset.zone;
      if (zone && zones[zone]) {
        showModal(zone, zones[zone]);
      }
    });

    // ✅ ドロップ処理追加
    slot.addEventListener("dragover", (e) => e.preventDefault());
    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;

      let data;
      try {
        data = JSON.parse(dataStr);
      } catch (err) {
        console.warn("データが不正:", err);
        return;
      }

      if (!data.instanceID) return;
      const card = findCardByInstanceID(data.instanceID);
      if (!card) return;

      const zone = slot.dataset.zone;
      if (!zone || !zones[zone]) return;

      removeCardFromAllZones(data.instanceID);
      zones[zone].push(card);

      renderHand();
    });
  });

  document.querySelectorAll(".cell").forEach((cell) => {
    cell.addEventListener("dragover", (e) => e.preventDefault());

    cell.addEventListener("drop", (e) => {
      e.preventDefault();
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;

      let data;
      try {
        data = JSON.parse(dataStr);
      } catch (err) {
        console.warn("データが不正:", err);
        return;
      }

      if (!data.instanceID) return;
      const card = findCardByInstanceID(data.instanceID);
      if (!card) return;

      if (cell.querySelector(".placed-card")) {
        alert("このマスにはすでにカードがあります");
        return;
      }

      removeCardFromAllZones(data.instanceID);

const placedDiv = createCardElement(card, "placed-card", "battle");


      cell.innerHTML = "";
      cell.appendChild(placedDiv);
      renderHand();
    });
  });

    // ✅ 手札へのドロップ処理
  document.getElementById("hand")?.addEventListener("dragover", (e) => e.preventDefault());

  document.getElementById("hand")?.addEventListener("drop", (e) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData("application/json");
    if (!dataStr) return;

    let data;
    try {
      data = JSON.parse(dataStr);
    } catch (err) {
      console.warn("データが不正:", err);
      return;
    }

    if (!data.instanceID) return;
    const card = findCardByInstanceID(data.instanceID);
    if (!card) return;

    if (hand.some(c => c.instanceID === data.instanceID)) return;

    removeCardFromAllZones(data.instanceID);
    hand.push(card);
    renderHand();
  });

  // ✅ デッキスロットへのドロップ処理（→ 戻し方モーダル表示）
  document.querySelectorAll(".deck-slot").forEach((slot) => {
    slot.addEventListener("dragover", (e) => e.preventDefault());

    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;

      let data;
      try {
        data = JSON.parse(dataStr);
      } catch (err) {
        console.warn("データが不正:", err);
        return;
      }

      if (!data.instanceID) return;
      const card = findCardByInstanceID(data.instanceID);
      if (!card) return;

      removeCardFromAllZones(data.instanceID);
      showDeckReturnDestination(card);
      renderHand();
    });

    // クリックで選択モーダルを表示
    slot.addEventListener("click", () => {
      showDeckChoiceModal();
    });
  });

  // ✅ デッキインポート処理
  document.getElementById("import-deck-file")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const deckData = JSON.parse(reader.result);
        const importedMain = [];
        const importedMerc = [];

        for (const id in deckData.mainDeck || {}) {
          const card = cardData.find(c => c.ID === id);
          if (!card) continue;
          for (let i = 0; i < deckData.mainDeck[id]; i++) {
            importedMain.push({ ...card, instanceID: generateInstanceID() });
          }
        }

        for (const id in deckData.mercDeck || {}) {
          const card = cardData.find(c => c.ID === id);
          if (!card) continue;
          for (let i = 0; i < deckData.mercDeck[id]; i++) {
            importedMerc.push({ ...card, instanceID: generateInstanceID() });
          }
        }

        mainDeck.length = 0;
        mainDeck.push(...importedMain);
        shuffle(mainDeck);

        mercDeck.length = 0;
        mercDeck.push(...importedMerc);

        hand.length = 0;
        drawCards(5);
        alert(`デッキ「${deckData.name || "読み込み済み"}」をインポートしました`);
      } catch (err) {
        alert("無効なデッキファイルです");
      }
    };
    reader.readAsText(file);
  });
}
