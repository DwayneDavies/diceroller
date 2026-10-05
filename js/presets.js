import { rollDie, rollMany, sum } from "./core.js";
import { playSoundForDie } from "./sound.js";
import { addResultBox } from "./results.js";
import { loadSetting, saveSetting, loadPresets, savePresets, clearStoredPresets } from "./storage.js";
import { rollExpression, readExprInputs } from "./dice.js";

const D20_MOD_IDS = {
  attack: "mod-attack",
  initiative: "mod-initiative",
  saving: "mod-saving",
  advantage: "mod-advantage",
  disadvantage: "mod-disadvantage",
};

export function getD20PresetMod(key) {
  const el = document.getElementById(D20_MOD_IDS[key]);
  if (el) return parseInt(el.value, 10) || 0;
  const mods = loadSetting("d20PresetMods", {});
  return parseInt(mods[key], 10) || 0;
}

export function loadD20PresetMods() {
  const mods = loadSetting("d20PresetMods", {});
  for (const [key, id] of Object.entries(D20_MOD_IDS)) {
    const el = document.getElementById(id);
    if (el) el.value = mods[key] ?? 0;
  }
}

export function saveD20PresetModsFromInputs() {
  const mods = {};
  for (const [key, id] of Object.entries(D20_MOD_IDS)) {
    const el = document.getElementById(id);
    mods[key] = el ? parseInt(el.value, 10) || 0 : 0;
  }
  saveSetting("d20PresetMods", mods);
}

export function initD20PresetModifiers() {
  loadD20PresetMods();
  for (const id of Object.values(D20_MOD_IDS)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener("change", saveD20PresetModsFromInputs);
  }
}

function d20Opts(rollKind, mod) {
  return { sides: 20, rollKind, mod };
}

export function rollAdvantage() {
  playSoundForDie(20);
  const mod = getD20PresetMod("advantage");
  const r1 = rollDie(20);
  const r2 = rollDie(20);
  const kept = Math.max(r1, r2);
  addResultBox("Advantage:", [r1, r2], kept + mod, "result-advantage", {
    ...d20Opts("advantage", mod),
    breakdownRolls: [kept],
  });
}

export function rollDisadvantage() {
  playSoundForDie(20);
  const mod = getD20PresetMod("disadvantage");
  const r1 = rollDie(20);
  const r2 = rollDie(20);
  const kept = Math.min(r1, r2);
  addResultBox("Disadvantage:", [r1, r2], kept + mod, "result-disadvantage", {
    ...d20Opts("disadvantage", mod),
    breakdownRolls: [kept],
  });
}

export function rollAbilityScore() {
  playSoundForDie(6);
  const rolls = rollMany(4, 6);
  const sorted = [...rolls].sort((a, b) => a - b);
  const total = sum(sorted.slice(1));
  addResultBox("Ability Score (best of 4d6):", rolls, total, "result-ability", {
    breakdownRolls: sorted.slice(1),
  });
}

export function rollInitiative() {
  playSoundForDie(20);
  const mod = getD20PresetMod("initiative");
  const roll = rollDie(20);
  addResultBox("Initiative:", [roll], roll + mod, "result-initiative", d20Opts("initiative", mod));
}

export function rollAttack() {
  playSoundForDie(20);
  const mod = getD20PresetMod("attack");
  const roll = rollDie(20);
  addResultBox("Attack Roll:", [roll], roll + mod, "result-attack", d20Opts("attack", mod));
}

export function rollSavingThrow() {
  playSoundForDie(20);
  const mod = getD20PresetMod("saving");
  const roll = rollDie(20);
  addResultBox("Saving Throw:", [roll], roll + mod, "result-saving", d20Opts("saving", mod));
}

// Preset editor
export function addPreset() {
  const name = document.getElementById("preset-name").value.trim();
  if (!name) return alert("Preset name required!");
  const { times, sides, mod } = readExprInputs("preset-times", "preset-sides", "preset-mod");
  const presets = loadPresets();
  presets.push({ name, times, sides, mod });
  savePresets(presets);
  renderPresets();
}
export function clearPresets() {
  clearStoredPresets();
  renderPresets();
}
export function renderPresets() {
  const container = document.querySelector(".preset-row");
  container.querySelectorAll(".custom-preset").forEach(el => el.remove());
  const presets = loadPresets();
  presets.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "preset-btn custom-preset";
    btn.textContent = p.name;
    btn.onclick = () => {
      playSoundForDie(p.sides);
      rollExpression(`${p.name}:`, p.times, p.sides, p.mod);
    };
    container.appendChild(btn);
  });
}
