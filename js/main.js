import { rollDice, customRoll } from "./dice.js";
import {
  rollAbilityScore,
  rollInitiative,
  rollAttack,
  rollSavingThrow,
  renderPresets,
  initPresetEditor,
  initD20PresetModifiers,
} from "./presets.js";
import { findRollStats, redrawDistribution } from "./stats.js";
import { initVersus } from "./versus.js";
import {
  applySettings,
  initSettingsModal,
  applyDisplayMode,
  applyTheme,
} from "./settings.js";
import { saveSetting } from "./storage.js";
import { initResultsMenu } from "./results-menu.js";

// Expose handlers used by inline onclick attributes in index.html
Object.assign(window, {
  customRoll,
  rollAbilityScore,
  rollInitiative,
  rollAttack,
  rollSavingThrow,
  findRollStats,
});

document.addEventListener("DOMContentLoaded", () => {
  applySettings();
  renderPresets();
  initD20PresetModifiers();
  initPresetEditor();
  initVersus();
  initSettingsModal();
  initResultsMenu();

  document.querySelector(".dice-row").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sides]");
    if (btn) rollDice(Number(btn.dataset.sides), btn);
  });

  document.querySelectorAll("input[name='display-mode']").forEach((r) => {
    r.addEventListener("change", (e) => {
      saveSetting("displayMode", e.target.value);
      applyDisplayMode(e.target.value);
    });
  });

  document.getElementById("sound-toggle").addEventListener("change", (e) => {
    saveSetting("soundEnabled", e.target.checked);
  });

  document.getElementById("theme-select").addEventListener("change", (e) => {
    saveSetting("theme", e.target.value);
    applyTheme(e.target.value);
  });

  document.getElementById("percent-toggle").addEventListener("change", (e) => {
    saveSetting("showPercentages", e.target.checked);
    redrawDistribution();
  });
});
