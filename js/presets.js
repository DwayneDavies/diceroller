import { playSoundForDie, addResultBox, loadSetting, saveSetting } from "./settings.js";

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
  const r1 = Math.floor(Math.random() * 20) + 1;
  const r2 = Math.floor(Math.random() * 20) + 1;
  const kept = Math.max(r1, r2);
  addResultBox("Advantage:", [r1, r2], kept + mod, "result-advantage", {
    ...d20Opts("advantage", mod),
    breakdownRolls: [kept],
  });
}

export function rollDisadvantage() {
  playSoundForDie(20);
  const mod = getD20PresetMod("disadvantage");
  const r1 = Math.floor(Math.random() * 20) + 1;
  const r2 = Math.floor(Math.random() * 20) + 1;
  const kept = Math.min(r1, r2);
  addResultBox("Disadvantage:", [r1, r2], kept + mod, "result-disadvantage", {
    ...d20Opts("disadvantage", mod),
    breakdownRolls: [kept],
  });
}

export function rollAbilityScore() {
  playSoundForDie(6);
  let rolls = [];
  for (let i=0;i<4;i++) rolls.push(Math.floor(Math.random()*6)+1);
  const sorted = [...rolls].sort((a, b) => a - b);
  const total = sorted[1] + sorted[2] + sorted[3];
  addResultBox("Ability Score (best of 4d6):", rolls, total, "result-ability", {
    breakdownRolls: sorted.slice(1),
  });
}

export function rollInitiative() {
  playSoundForDie(20);
  const mod = getD20PresetMod("initiative");
  const roll = Math.floor(Math.random() * 20) + 1;
  addResultBox("Initiative:", [roll], roll + mod, "result-initiative", d20Opts("initiative", mod));
}

export function rollAttack() {
  playSoundForDie(20);
  const mod = getD20PresetMod("attack");
  const roll = Math.floor(Math.random() * 20) + 1;
  addResultBox("Attack Roll:", [roll], roll + mod, "result-attack", d20Opts("attack", mod));
}

export function rollSavingThrow() {
  playSoundForDie(20);
  const mod = getD20PresetMod("saving");
  const roll = Math.floor(Math.random() * 20) + 1;
  addResultBox("Saving Throw:", [roll], roll + mod, "result-saving", d20Opts("saving", mod));
}

// Preset editor
export function loadPresets() {
  const val = localStorage.getItem("presets");
  return val ? JSON.parse(val) : [];
}
export function savePresets(presets) {
  localStorage.setItem("presets", JSON.stringify(presets));
}
export function addPreset() {
  const name = document.getElementById("preset-name").value.trim();
  const times = parseInt(document.getElementById("preset-times").value) || 1;
  const sides = parseInt(document.getElementById("preset-sides").value) || 6;
  const mod = parseInt(document.getElementById("preset-mod").value) || 0;
  if (!name) return alert("Preset name required!");
  const presets = loadPresets();
  presets.push({ name, times, sides, mod });
  savePresets(presets);
  renderPresets();
}
export function clearPresets() {
  localStorage.removeItem("presets");
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
      let rolls = [], total = 0;
      for (let i=0;i<p.times;i++) {
        const r = Math.floor(Math.random()*p.sides)+1;
        total += r; rolls.push(r);
      }
      const opts =
        p.sides === 20
          ? { sides: 20, rollKind: "plain", mod: p.mod }
          : { mod: p.mod };
      addResultBox(`${p.name}:`, rolls, total + p.mod, `result-d${p.sides}`, opts);
    };
    container.appendChild(btn);
  });
}
