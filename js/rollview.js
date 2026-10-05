// Where and how new rolls are shown. Three independent options (Settings >
// Roll Results):
//   - Show results above or below the dice (the whole results area moves).
//   - A pinned "latest roll" bar that appears when the results are scrolled
//     out of view.
//   - Scroll to the results after each roll.
import { normalizeResultsPosition } from "./core.js";
import { loadSetting, saveSetting } from "./storage.js";
import { hasLastRoll, latestRollSummary } from "./results.js";

const $ = (id) => document.getElementById(id);
const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initRollView() {
  const section = $("results-section");
  const resultsBox = $("results");
  const dicePanel = $("dice-panel");
  const customPanel = $("custom-panel");
  const select = $("results-position");
  const barToggle = $("latest-bar-toggle");
  const scrollToggle = $("scroll-toggle");
  const bar = $("latest-bar");
  const barText = $("latest-text");
  if (!section || !resultsBox || !dicePanel || !customPanel || !select || !bar) return;

  let position = normalizeResultsPosition(loadSetting("resultsPosition", "top"));
  let barEnabled = loadSetting("latestBar", false) === true;
  let scrollEnabled = loadSetting("scrollToResults", false) === true;
  let resultsOutOfView = false;

  // --- Above or below the dice ---
  function place() {
    document.body.dataset.results = position;
    if (position === "bottom") customPanel.before(section);
    else dicePanel.before(section);
  }

  // --- Pinned latest-roll bar ---
  // Shown only when it helps: the results area has scrolled off screen.
  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          resultsOutOfView = !entry.isIntersecting;
          syncBar();
        })
      : null;
  if (observer) observer.observe(resultsBox);

  function syncBar() {
    barText.textContent = latestRollSummary();
    const visible = barEnabled && hasLastRoll() && (observer ? resultsOutOfView : true);
    bar.classList.toggle("hidden", !visible);
  }

  $("latest-bar-btn").addEventListener("click", () => {
    resultsBox.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  });

  // --- Scroll to the results after each roll ---
  document.addEventListener("rolladded", () => {
    if (scrollEnabled) resultsBox.scrollIntoView({ block: "nearest" });
  });
  document.addEventListener("resultschange", syncBar);

  // --- Settings controls ---
  select.value = position;
  barToggle.checked = barEnabled;
  scrollToggle.checked = scrollEnabled;

  select.addEventListener("change", () => {
    position = normalizeResultsPosition(select.value);
    saveSetting("resultsPosition", position);
    place();
  });
  barToggle.addEventListener("change", () => {
    barEnabled = barToggle.checked;
    saveSetting("latestBar", barEnabled);
    syncBar();
  });
  scrollToggle.addEventListener("change", () => {
    scrollEnabled = scrollToggle.checked;
    saveSetting("scrollToResults", scrollEnabled);
  });

  place();
  syncBar();
}
