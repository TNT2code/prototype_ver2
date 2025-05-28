// ✅ interact-setup.js - event.targetの安全処理 + zone推定の改善 + deck-card対応

import interact from 'https://cdn.jsdelivr.net/npm/interactjs/+esm';
import {
  hand,
  renderHand,
  setSelectedInstanceID,
  setSelectedSource
} from './hand.js';
import { zones } from './zones.js';
import { attachDetailListeners } from './modal.js';
import { deck, mainDeck, mercDeck } from './deck.js';
import { createCardElement, updateSlotLabels } from './utils.js';
import { socket } from './socket-io.js'; // ✅ 追加
import { isHost, socket } from './socket-io.js';

function findCardByInstanceID(id) {
  return (
    hand.find(c => c.instanceID === id) ||
    deck.find(c => c.instanceID === id) ||
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
  removeByID(deck);
  removeByID(mainDeck);
  removeByID(mercDeck);
  for (const zone in zones) {
    zones[zone] = zones[zone].filter(c => c.instanceID !== instanceID);
  }

 // ✅ DOM から削除（カード）
const placed = document.querySelector(`.placed-card[data-instance-id="${instanceID}"]`);
if (placed) {
  placed.remove(); // ✅ 該当カードだけを削除
}
  updateSlotLabels(); // ←追加

    // ✅ 相手にも通知（カード除去）
  socket.emit("remove-card", { instanceID });
}

function guessZoneFromCellId(cellId) {
  const trimmedId = cellId?.trim() || "";
  if (trimmedId.startsWith("player")) return "battle-player";
  if (trimmedId.startsWith("enemy")) return "battle-opponent";
  if (trimmedId.startsWith("center")) return "battle-center";
  return null;
}

export function setupInteract() {
  interact('.hand-card, .placed-card, .zone-card, .deck-card').draggable({
    listeners: {
      start(event) {
        const instanceID = event.target.dataset.instanceId;
        const source =
          event.target.classList.contains('hand-card') ? 'hand' :
          event.target.classList.contains('placed-card') ? 'battle' :
          event.target.classList.contains('zone-card') ? 'zone' :
          event.target.classList.contains('deck-card') ? 'deck' :
          null;

        setSelectedInstanceID(instanceID);
        setSelectedSource(source);

        window.__draggingInstanceID = instanceID;
        window.__draggingSource = source;

          // 🛑 スクロール無効
  const handPanel = document.getElementById("hand");
  if (handPanel) handPanel.classList.add("no-scroll");


      },
      move(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      },
      end(event) {
        event.target.style.transform = '';
        event.target.removeAttribute('data-x');
        event.target.removeAttribute('data-y');
        const handEl = document.getElementById("hand");
        if (handEl)  {
  handEl.classList.remove("no-scroll"); // スクロール戻す
  handEl.style.display = "flex"; // ← これは元々のコード
}
      }
    }
  });

  function handleDrop(target, onCardDrop) {
    const instanceID = window.__draggingInstanceID;
    const source = window.__draggingSource;
    window.__draggingInstanceID = null;
    window.__draggingSource = null;

    console.log("🎯 dropで取得した instanceID:", instanceID);
    console.log("📦 source:", source);

    if (!instanceID) {
      console.warn("❌ instanceIDが取得できません");
      return;
    }

    const card = findCardByInstanceID(instanceID);
    if (!card) {
      console.warn("❌ カードが見つかりません");
      return;
    }

    removeCardFromAllZones(instanceID);
    onCardDrop(card, instanceID, target);
  }

  interact('.cell').dropzone({
    ondragenter(e) { e.currentTarget.classList.add('drop-hover'); },
    ondragleave(e) { e.currentTarget.classList.remove('drop-hover'); },
ondrop(event) {
  const cell = event.currentTarget;
  cell.classList.remove('drop-hover');

  // ✅ バリケード処理を先に実行
  if (window.__draggingBarricade) {
    const power = window.__draggingBarricadePower ?? 0;
    
    delete window.__draggingBarricade;
    delete window.__draggingBarricadePower;

    import('./utils.js').then(utils => {
      const barricade = utils.createBarricadeElement(power);
      cell.appendChild(barricade);

    });
    return;
  }

  // ⬇ 通常カード処理
  const instanceID = window.__draggingInstanceID;
  const source = window.__draggingSource;
  window.__draggingInstanceID = null;
  window.__draggingSource = null;

  if (!instanceID) return;
  const card = findCardByInstanceID(instanceID);
  if (!card) return;

  removeCardFromAllZones(instanceID);

  // 💡 マスを空にする前に innerHTML = "" で一括初期化
  //cell.innerHTML = "";

  // 📌 カードDOMの生成と配置
  const placedDiv = createCardElement(card, "placed-card", "battle");
  cell.appendChild(placedDiv);

if (card) {
  // ⚡ パワー表示
  const powerLabel = document.createElement("div");
  powerLabel.className = "power-label";
  powerLabel.textContent = `⚡${card.パワー ?? "?"}`;
  placedDiv.appendChild(powerLabel); // ← 変更点！
  //cell.appendChild(powerLabel);

  // ✨ フォース表示
  const forceLabel = document.createElement("div");
  forceLabel.className = "force-label";
  forceLabel.textContent = `✨${card.フォース ?? "?"}`;
  placedDiv.appendChild(forceLabel); // ← 変更点！
  //cell.appendChild(forceLabel);
}


  // 📌 ゾーン情報に追加
  const guessedZone = guessZoneFromCellId(cell.id);
  if (guessedZone && zones[guessedZone]) {
    zones[guessedZone].push(card);
  }

  renderHand();
 if (isHost) {
        socket.emit("move-card", {
          card,
          toZone: guessedZone
        });
      }
  
}


  });

  interact('.slot, .resource-slot').dropzone({
    ondragenter(e) { e.currentTarget.classList.add('drop-hover'); },
    ondragleave(e) { e.currentTarget.classList.remove('drop-hover'); },
    ondrop(event) {
      const zone = event.currentTarget.dataset.zone;
      if (!zone || !zones[zone]) return;

      handleDrop(event.currentTarget, (card, instanceID) => {
        zones[zone].push(card);
        renderHand();
        updateSlotLabels(); // ←追加

              // ✅ 相手に送信
      socket.emit("move-card", {
        card: selectedCard,
        toZone: zone
      });
      });
    }
  });

  interact('#hand').dropzone({
    ondragenter(e) { e.currentTarget.classList.add('drop-hover'); },
    ondragleave(e) { e.currentTarget.classList.remove('drop-hover'); },
    ondrop(event) {
      handleDrop(event.currentTarget, (card, instanceID) => {
        if (hand.some(c => c.instanceID === instanceID)) return;
        hand.push(card);
        renderHand();
        updateSlotLabels(); // ←追加

              // ✅ 相手に送信
      socket.emit("move-card", {
        card: selectedCard,
        toZone: zone
      });
      });
    }
  });

  interact('.deck-slot').dropzone({
    ondragenter(e) { e.currentTarget.classList.add('drop-hover'); },
    ondragleave(e) { e.currentTarget.classList.remove('drop-hover'); },
    ondrop(event) {
      event.currentTarget.classList.remove('drop-hover');

      handleDrop(event.currentTarget, (card, instanceID) => {
        import('./modal.js').then(modal => {
          modal.showDeckReturnDestination(card);
        });
        renderHand();
        updateSlotLabels(); // ←追加

              // ✅ 相手に送信
      socket.emit("move-card", {
        card: selectedCard,
        toZone: zone
      });
      });
    }
  });
}
