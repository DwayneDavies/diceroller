import {
  copyLastRoll,
  showCopyToast,
  hasLastRoll,
  clearResults,
} from "./results.js";

export function initResultsMenu() {
  const resultsBox = document.getElementById("results");
  const menu = document.getElementById("results-menu");
  const copyItem = document.getElementById("copy-last-roll");
  const clearItem = document.getElementById("clear-results");

  if (!resultsBox || !menu || !copyItem || !clearItem) return;

  function updateCopyMenuItem() {
    copyItem.classList.toggle("menu-disabled", !hasLastRoll());
  }

  function openMenu(pageX, pageY) {
    updateCopyMenuItem();
    menu.style.top = pageY + "px";
    menu.style.left = pageX + "px";
    menu.style.display = "block";
  }

  resultsBox.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openMenu(e.pageX, e.pageY);
  });

  document.addEventListener("click", () => {
    menu.style.display = "none";
  });

  copyItem.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!hasLastRoll()) return;
    menu.style.display = "none";
    if (await copyLastRoll()) showCopyToast();
  });

  clearItem.addEventListener("click", () => {
    clearResults();
    menu.style.display = "none";
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      e.preventDefault();
      if (!hasLastRoll()) return;
      copyLastRoll().then((ok) => {
        if (ok) showCopyToast();
      });
    }
  });

  // Long-press opens the menu on touch screens. Moving the finger (scrolling)
  // cancels it, and the click that follows the press is swallowed so the
  // document click handler doesn't close the menu straight away.
  let pressTimer = null;
  let longPressed = false;
  const cancelPress = () => {
    clearTimeout(pressTimer);
    pressTimer = null;
  };
  resultsBox.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    longPressed = false;
    cancelPress();
    pressTimer = setTimeout(() => {
      longPressed = true;
      openMenu(touch.pageX, touch.pageY);
    }, 600);
  }, { passive: true });
  resultsBox.addEventListener("touchmove", cancelPress, { passive: true });
  resultsBox.addEventListener("touchcancel", cancelPress);
  resultsBox.addEventListener("touchend", (e) => {
    cancelPress();
    if (longPressed) e.preventDefault();
  });
}
