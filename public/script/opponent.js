import { cardData } from './data.js';
import { createCardElement } from './utils.js';
import { zones } from './zones.js';
import { socket } from './socket-io.js';

// opponent.js - 相手プレイヤーのデッキと手札を管理
// opponent.js - 相手プレイヤーのデッキと手札を管理

export let opponentDeck = [];
export let opponentHand = [];

export function initOpponentDeck(cards) {
  opponentDeck = cards.map(card => ({ ...card, instanceID: crypto.randomUUID() }));
}

export function drawOpponentCards(count = 1) {
  for (let i = 0; i < count; i++) {
    if (opponentDeck.length === 0) return;
    const card = opponentDeck.shift();
    opponentHand.push(card);
  }
  updateOpponentHandCount();
}

export function updateOpponentHandCount() {
  const span = document.getElementById("opponent-hand-count");
  if (span) span.textContent = opponentHand.length;
}

export function getOpponentCardByInstanceID(id) {
  return opponentHand.find(c => c.instanceID === id) || opponentDeck.find(c => c.instanceID === id) || null;
}

// ✅ 相手のリソース／ステータスの更新関数
export function setOpponentStatus(id, value) {
  const elem = document.getElementById(`opponent-${id}`);
  if (elem) {
    elem.textContent = value;
  } else {
    console.warn(`ステータスIDが見つかりません: opponent-${id}`);
  }
}

export function incrementOpponentStatus(id, amount = 1) {
  const elem = document.getElementById(`opponent-${id}`);
  if (elem) {
    const current = parseInt(elem.textContent) || 0;
    elem.textContent = current + amount;
  }
}

export function decrementOpponentStatus(id, amount = 1) {
  incrementOpponentStatus(id, -amount);
}


function placeEnemyCard(cardID, cellID) {
  const card = cardData.find(c => c.ID === cardID);
  if (!card) return;

  const instance = { ...card, instanceID: crypto.randomUUID() };
  const elem = createCardElement(instance, "placed-card", "battle");

  const cell = document.getElementById(cellID);
  if (cell) {
    cell.innerHTML = ""; // 上書き配置
    cell.appendChild(elem);
    zones["battle-opponent"].push(instance);
  }
}

socket.on('opponent-drew-card', (card) => {
  opponentHand.push(card);
  updateOpponentHandUI(); // 枚数更新
});