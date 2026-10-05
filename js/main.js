import { rollDice, customRoll } from "./dice.js";
import {
  rollAdvantage,
  rollDisadvantage,
  rollAbilityScore,
  rollInitiative,
  rollAttack,
  rollSavingThrow,
  renderPresets,
  addPreset,
  clearPresets,
  initD20PresetModifiers,
} from "./presets.js";
import { findRollStats } from "./stats.js";
import {
  applySettings,
  initSettingsModal,
  saveSetting,
  applyDisplayMode,
  applyTheme,
} from "./settings.js";
import { initResultsMenu } from "./results-menu.js";

// Expose handlers used by inline onclick attributes in index.html
Object.assign(window, {
  rollDice,
  customRoll,
  rollAdvantage,
  rollDisadvantage,
  rollAbilityScore,
  rollInitiative,
  rollAttack,
  rollSavingThrow,
  findRollStats,
  addPreset,
  clearPresets,
});

document.addEventListener("DOMContentLoaded", () => {
  applySettings();
  renderPresets();
  initD20PresetModifiers();
  initSettingsModal();
  initResultsMenu();

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
  });
});
