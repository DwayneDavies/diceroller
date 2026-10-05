import {
  copyLastRoll,
  showCopyToast,
  hasLastRoll,
  hasResults,
  clearResults,
  undoClear,
} from "./results.js";

export function initResultsMenu() {
  const resultsBox = document.getElementById("results");
  const menu = document.getElementById("results-menu");
  const copyItem = document.getElementById("copy-last-roll");
  const clearItem = document.getElementById("clear-results");

  if (!resultsBox || !menu || !copyItem || !clearItem) return;

  // Visible buttons that do the same as the menu items and Alt+C
  const copyBtn = document.getElementById("copy-last-btn");
  const clearBtn = document.getElementById("clear-results-btn");
  const undoBtn = document.getElementById("undo-clear");

  function refreshToolbar() {
    if (copyBtn) copyBtn.disabled = !hasLastRoll();
    if (clearBtn) clearBtn.disabled = !hasResults();
  }
  document.addEventListener("resultschange", refreshToolbar);
  refreshToolbar();

  async function copyAndToast() {
    if (!hasLastRoll()) return;
    if (await copyLastRoll()) showCopyToast();
  }
  if (copyBtn) copyBtn.addEventListener("click", copyAndToast);
  if (clearBtn) clearBtn.addEventListener("click", clearResults);
  if (undoBtn) undoBtn.addEventListener("click", undoClear);

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

  // Alt+C copies the last roll. (Ctrl+Shift+C is the browser's "inspect
  // element" shortcut, so it is left alone.) Skipped while typing, where
  // Option+C types a character on a Mac.
  document.addEventListener("keydown", (e) => {
    const typing = e.target.closest?.("input, textarea, select, [contenteditable]");
    if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === "KeyC" && !typing) {
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
