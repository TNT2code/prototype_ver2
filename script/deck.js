import { shuffle, generateInstanceID, updateSlotLabels } from "./utils.js";
import { cardData } from "./data.js";
import { renderHand, hand } from "./hand.js";
import { zones } from "./zones.js";
import { socket } from './socket-io.js';

// 単一デッキ（後方互換）
export let deck = [];

// 分割デッキ
export let mainDeck = [];
export let mercDeck = [];

// デッキ初期化（シャッフル込み）
export function initDeck() {
  deck = cardData.map(card => ({
    ...card,
    instanceID: generateInstanceID()
  }));
  shuffle(deck);
}

// ✅ 種類で分類しつつ instanceID を付ける
export function classifyDeck(cards) {
  mainDeck = [];
  mercDeck = [];
  deck = [];

  cards.forEach(card => {
    const instance = { ...card, instanceID: generateInstanceID() };
    const type = card.種類?.toLowerCase();
    if (type === "mercenary" || type === "m.tactics") {
      mercDeck.push(instance);
    } else {
      mainDeck.push(instance);
    }
    deck.push(instance);
  });
  shuffle(mainDeck);
}

// メインデッキから引く
export function drawCards(count = 1) {
  for (let i = 0; i < count; i++) {
    if (mainDeck.length === 0) {
      alert("メインデッキが空です");
      return;
    }
    const drawn = mainDeck.shift();
    hand.push(drawn);
    socket.emit('draw-card', card); // 送信！
    renderHand();
    updateSlotLabels(); // ←追加
  }
}

export function returnToDeck(card, mode = "top", target = "main") {
  if (!card || !card.instanceID) return;

  // 除去（手札、デッキ、ゾーン、DOM）
  const handIndex = hand.findIndex(c => c.instanceID === card.instanceID);
  if (handIndex !== -1) hand.splice(handIndex, 1);

  const mainIndex = mainDeck.findIndex(c => c.instanceID === card.instanceID);
  if (mainIndex !== -1) mainDeck.splice(mainIndex, 1);

  const mercIndex = mercDeck.findIndex(c => c.instanceID === card.instanceID);
  if (mercIndex !== -1) mercDeck.splice(mercIndex, 1);

  for (const zone in zones) {
    zones[zone] = zones[zone].filter(c => c.instanceID !== card.instanceID);
  }

  const placed = document.querySelector(`.placed-card[data-instance-id="${card.instanceID}"]`);
  if (placed) placed.remove();

  // 対象デッキの選定と戻し
  const targetDeck = target === "merc" ? mercDeck : mainDeck;

  if (mode === "top") {
    targetDeck.unshift(card);
  } else if (mode === "bottom") {
    targetDeck.push(card);
  } else if (mode === "shuffle") {
    targetDeck.push(card);
    shuffle(targetDeck);
  }

  renderHand();
}
