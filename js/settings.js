import { loadSetting } from "./storage.js";

// --- Theme & display ---
export function applyTheme(theme) {
  document.body.classList.remove("theme-dark","theme-parchment","theme-neon");
  document.body.classList.add("theme-" + theme);
}
export function applyDisplayMode(mode) {
  const diceRow = document.querySelector(".dice-row");
  const presetRow = document.querySelector(".preset-row");
  diceRow.classList.remove("hidden");
  presetRow.classList.remove("hidden");
  if (mode === "dice") presetRow.classList.add("hidden");
  else if (mode === "presets") diceRow.classList.add("hidden");
}
export function applySettings() {
  const soundEnabled = loadSetting("soundEnabled", true);
  document.getElementById("sound-toggle").checked = soundEnabled;
  const theme = loadSetting("theme", "dark");
  document.getElementById("theme-select").value = theme;
  applyTheme(theme);
  const showPercentages = loadSetting("showPercentages", true);
  document.getElementById("percent-toggle").checked = showPercentages;
  const displayMode = loadSetting("displayMode", "both");
  document.querySelectorAll("input[name='display-mode']").forEach(r => {
    r.checked = (r.value === displayMode);
  });
  applyDisplayMode(displayMode);
}

// --- Settings modal ---
export function initSettingsModal() {
  const gear = document.getElementById("settings-gear");
  const popup = document.getElementById("settings-popup");
  const closeBtn = document.getElementById("close-settings");

  gear.addEventListener("click", () => popup.classList.remove("hidden"));
  closeBtn.addEventListener("click", () => popup.classList.add("hidden"));
  popup.addEventListener("click", (e) => {
    if (e.target === popup) popup.classList.add("hidden");
  });
}
