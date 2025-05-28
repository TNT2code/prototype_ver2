function scaleBoardToFit() {
const board = document.querySelector(".board");
if (!board) return;
const scaleX = window.innerWidth / 360;
const scaleY = window.innerHeight / 640;
const scale = Math.min(scaleX, scaleY, 1);
board.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", scaleBoardToFit);
window.addEventListener("load", scaleBoardToFit);

function preventMobileScroll() {
const board = document.querySelector(".board");
if (!board) return;

board.addEventListener("touchmove", (e) => {
e.preventDefault();
}, { passive: false });
}
window.addEventListener("load", preventMobileScroll);