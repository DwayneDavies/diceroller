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

  resultsBox.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    updateCopyMenuItem();
    menu.style.top = e.pageY + "px";
    menu.style.left = e.pageX + "px";
    menu.style.display = "block";
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

  let pressTimer;
  resultsBox.addEventListener("touchstart", () => {
    pressTimer = setTimeout(() => {
      resultsBox.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    }, 600);
  });
  resultsBox.addEventListener("touchend", () => clearTimeout(pressTimer));
}
