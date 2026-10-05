import { loadSetting } from "./storage.js";
import { SOUND_DEFAULT } from "./sound.js";
import { redrawDistribution } from "./stats.js";

export const THEMES = ["dark", "parchment", "neon"];

// --- Theme & display ---
export function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = "dark";
  document.body.classList.remove(...THEMES.map((t) => "theme-" + t));
  document.body.classList.add("theme-" + theme);
  // The chart is drawn on a canvas, so it has to be repainted in the new colors.
  redrawDistribution();
  return theme;
}
// "Dice only" hides the whole Preset Actions panel (modifiers, presets and
// Versus Roll); "Presets only" hides the Dice Buttons panel.
export function applyDisplayMode(mode) {
  document.getElementById("dice-panel").classList.toggle("hidden", mode === "presets");
  document.getElementById("preset-panel").classList.toggle("hidden", mode === "dice");
}
export function applySettings() {
  const soundEnabled = loadSetting("soundEnabled", SOUND_DEFAULT);
  document.getElementById("sound-toggle").checked = soundEnabled;
  document.getElementById("theme-select").value = applyTheme(loadSetting("theme", "dark"));
  const showPercentages = loadSetting("showPercentages", true);
  document.getElementById("percent-toggle").checked = showPercentages;
  const displayMode = loadSetting("displayMode", "both");
  document.querySelectorAll("input[name='display-mode']").forEach(r => {
    r.checked = (r.value === displayMode);
  });
  applyDisplayMode(displayMode);
}

// --- Settings modal ---
const FOCUSABLE =
  "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

export function initSettingsModal() {
  const gear = document.getElementById("settings-gear");
  const popup = document.getElementById("settings-popup");
  const closeBtn = document.getElementById("close-settings");
  const dialog = popup.querySelector(".settings-content");
  let opener = null;

  const isOpen = () => !popup.classList.contains("hidden");

  function open() {
    opener = document.activeElement;
    popup.classList.remove("hidden");
    closeBtn.focus();
  }

  function close() {
    popup.classList.add("hidden");
    // Put keyboard focus back where it was before the dialog opened.
    (opener && opener.isConnected ? opener : gear).focus();
  }

  gear.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  popup.addEventListener("click", (e) => {
    if (e.target === popup) close();
  });

  // Safety net: if focus lands outside the open dialog, bring it back.
  document.addEventListener("focusin", (e) => {
    if (isOpen() && !dialog.contains(e.target)) closeBtn.focus();
  });

  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      // Keep Tab / Shift+Tab inside the dialog while it is open.
      // Tab only stops on the checked radio of a group, so count just those.
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null && (el.type !== "radio" || el.checked)
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
