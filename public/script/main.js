// ✅ 動作確認済み main.js（fetch + 初期化 + エラーハンドリング）

import { setCardData } from './data.js';
import { drawCards, classifyDeck, mainDeck } from './deck.js';
import { bindAllEvents } from './events.js';
import { setupInteract } from './interact-setup.js';
import { createBarricadeElement } from './utils.js';
import { shuffle } from "./utils.js";
import { renderHand, hand } from "./hand.js";
import { initOpponentDeck, drawOpponentCards } from './opponent.js';
import { socket, isHost } from './socket-io.js'; // ✅ 追加
import './socket-actions.js';


// カードリストを読み込んで初期化処理を開始
fetch("card_list.json")
  .then(res => {
    if (!res.ok) throw new Error("カードデータの読み込みに失敗しました");
    return res.json();
  })
  .then(data => {
    setCardData(data);
    classifyDeck(data);
    drawCards(5);
      // 👇 相手デッキの初期化と手札のドロー
  initOpponentDeck(data);
 requestAnimationFrame(() => {
  drawOpponentCards(5);
});
    setupInteract();
    bindAllEvents();
  })
  .catch(err => {
    console.error("カード初期化エラー:", err);
    alert("カードデータの読み込みに失敗しました。JSONファイルの配置を確認してください。");
  });

//メニュー関連
 const menuButton = document.getElementById("menu-button");
const menuList = document.getElementById("menu-list");

// 拡張しやすい定義
const menuItems = [
  {
    label: "バリケード",
    action: () => {
      const input = prompt("バリケードのパワーを入力してください", "1");
      if (input === null) return;  // キャンセル時
      const power = parseInt(input);
      if (isNaN(power) || power < 0) {
        alert("数値を入力してください");
        return;
      }

      const temp = createBarricadeElement(power);
      temp.style.position = "absolute";
      temp.style.top = "50px";
      temp.style.left = "50px";
      document.body.appendChild(temp);

            // ✅ サーバーに通知（仮：zone を later 修正）
      socket.emit("place-barricade", { zone: "center-2", power });
    }
  },
  {
  label: "コイントス",
  action: () => {
    const result = Math.random() < 0.5 ? "表です" : "裏です";
    alert(`コイントスの結果：${result}`);
  }
},
 {
  label: "サイコロ",
  action: () => {
    const input = prompt("サイコロの最大値を入力してください（例：6）", "6");
    if (input === null) return;
    const max = parseInt(input);
    if (isNaN(max) || max <= 0) {
      alert("正の整数を入力してください");
      return;
    }
    const result = Math.floor(Math.random() * max) + 1;
    alert(`🎲 サイコロの結果：${result}`);
  }
},
{
  label: "シャッフル",
  action: () => {
    const confirmed = confirm("メインデッキをシャッフルしますか？");
    if (!confirmed) return;

    shuffle(mainDeck);
    alert("シャッフル完了");
    renderHand();
  }
}

];

// メニューの生成
menuItems.forEach(item => {
  const li = document.createElement("li");
  li.textContent = item.label;
  li.addEventListener("click", () => {
    item.action();
    menuList.classList.remove("show");
  });
  menuList.appendChild(li);
});

// トグル表示
menuButton.addEventListener("click", () => {
  menuList.classList.toggle("show");
});

// 背景クリックでメニューを閉じる
menuList.addEventListener("click", (event) => {
  // 背景部分（#menu-list）をクリックしたときのみ閉じる
  if (event.target === menuList) {
    menuList.classList.remove("show");
  }
});

// ドラッグ中のバリケードを管理
document.addEventListener("touchend", () => {
  if (window.__draggingBarricade !== undefined) {
    delete window.__draggingBarricade;
    delete window.__draggingBarricadePower;
  }
}, { passive: true });


// 初期配布枚数
const INITIAL_HAND_COUNT = 5;

window.addEventListener('DOMContentLoaded', () => {
  if (isHost) {
    // ホストが両者分のカードを引く
    const myCards = [];
    const opponentCards = [];
    for (let i = 0; i < INITIAL_HAND_COUNT; i++) {
      const myCard = drawCards(1, false); // false で emit しない
      if (myCard) myCards.push(myCard);
      const oppCard = drawCards(1, false);
      if (oppCard) opponentCards.push(oppCard);
    }

    // 自分の手札描画
    hand.push(...myCards);
    renderHand();

    // ゲストにカード送信
    socket.emit("init-hands", opponentCards);
  }
});
