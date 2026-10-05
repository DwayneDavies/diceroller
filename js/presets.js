import { rollDie, rollMany, formatExpr, sum } from "./core.js";
import { playSoundForDie } from "./sound.js";
import { addResultBox } from "./results.js";
import {
  loadSetting,
  saveSetting,
  loadPresets,
  savePresets,
  clearStoredPresets,
  MAX_PRESET_NAME,
} from "./storage.js";
import { rollExpression, readExprInputs } from "./dice.js";

const D20_MOD_IDS = {
  attack: "mod-attack",
  initiative: "mod-initiative",
  saving: "mod-saving",
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

// Attack, initiative and saving throw share one roll: a d20 plus that
// roll's modifier.
const D20_ROLLS = {
  attack: { title: "Attack Roll", className: "result-attack" },
  initiative: { title: "Initiative", className: "result-initiative" },
  saving: { title: "Saving Throw", className: "result-saving" },
};

function rollD20Check(kind) {
  playSoundForDie(20);
  const { title, className } = D20_ROLLS[kind];
  const mod = getD20PresetMod(kind);
  const roll = rollDie(20);
  addResultBox(`${title}:`, [roll], roll + mod, className, {
    sides: 20,
    rollKind: kind,
    mod,
  });
}

export const rollAttack = () => rollD20Check("attack");
export const rollInitiative = () => rollD20Check("initiative");
export const rollSavingThrow = () => rollD20Check("saving");

export function rollAbilityScore() {
  playSoundForDie(6);
  const rolls = rollMany(4, 6);
  const sorted = [...rolls].sort((a, b) => a - b);
  const total = sum(sorted.slice(1));
  addResultBox("Ability Score (best of 4d6):", rolls, total, "result-ability", {
    breakdownRolls: sorted.slice(1),
  });
}

// --- Preset editor ---
let messageTimer = null;
function showPresetMessage(text, isError = false) {
  const el = document.getElementById("preset-message");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("is-error", isError);
  clearTimeout(messageTimer);
  if (text) messageTimer = setTimeout(() => (el.textContent = ""), 4000);
}

export function addPreset() {
  const nameEl = document.getElementById("preset-name");
  const name = nameEl.value.trim().slice(0, MAX_PRESET_NAME);
  if (!name) {
    showPresetMessage("Enter a name for the preset first.", true);
    nameEl.focus();
    return;
  }
  const { times, sides, mod } = readExprInputs("preset-times", "preset-sides", "preset-mod");
  const presets = loadPresets();
  presets.push({ name, times, sides, mod });
  savePresets(presets);
  nameEl.value = "";
  renderPresets();
  showPresetMessage(`Added "${name}" (${formatExpr(times, sides, mod)}).`);
}

export function deletePreset(index) {
  const presets = loadPresets();
  const [removed] = presets.splice(index, 1);
  if (!removed) return;
  savePresets(presets);
  renderPresets();
  showPresetMessage(`Deleted "${removed.name}".`);
}

// "Clear All" asks twice: the first click arms the button, a second click
// within a few seconds confirms. (Browser confirm() popups can be blocked.)
let clearTimer = null;
function disarmClearButton() {
  const btn = document.getElementById("clear-presets");
  clearTimeout(clearTimer);
  clearTimer = null;
  if (btn) {
    btn.textContent = "Clear All Presets";
    btn.classList.remove("is-armed");
  }
}

export function clearPresets() {
  const btn = document.getElementById("clear-presets");
  const count = loadPresets().length;
  if (count === 0) {
    showPresetMessage("There are no presets to clear.");
    return;
  }
  if (clearTimer === null) {
    if (btn) {
      btn.textContent = `Click again to delete ${count}`;
      btn.classList.add("is-armed");
    }
    showPresetMessage("This removes every saved preset.", true);
    clearTimer = setTimeout(disarmClearButton, 4000);
    return;
  }
  disarmClearButton();
  clearStoredPresets();
  renderPresets();
  showPresetMessage("All presets cleared.");
}

export function initPresetEditor() {
  document.getElementById("add-preset").addEventListener("click", addPreset);
  document.getElementById("clear-presets").addEventListener("click", clearPresets);
  document.getElementById("preset-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addPreset();
  });
  document.getElementById("preset-list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-index]");
    if (btn) deletePreset(Number(btn.dataset.deleteIndex));
  });
}

export function renderPresets() {
  const presets = loadPresets();

  // Buttons on the main page
  const container = document.querySelector(".preset-row");
  container.querySelectorAll(".custom-preset").forEach((el) => el.remove());
  presets.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "preset-btn custom-preset";
    btn.textContent = p.name;
    btn.title = formatExpr(p.times, p.sides, p.mod);
    btn.onclick = () => {
      playSoundForDie(p.sides);
      rollExpression(`${p.name}:`, p.times, p.sides, p.mod);
    };
    container.appendChild(btn);
  });

  // Saved presets listed in Settings, each with its own delete button
  const list = document.getElementById("preset-list");
  if (!list) return;
  list.replaceChildren();
  if (presets.length === 0) {
    const empty = document.createElement("li");
    empty.className = "preset-empty";
    empty.textContent = "No saved presets yet.";
    list.appendChild(empty);
  }
  presets.forEach((p, i) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${p.name} (${formatExpr(p.times, p.sides, p.mod)})`;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "preset-delete";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete preset ${p.name}`);
    del.dataset.deleteIndex = String(i);
    li.append(label, del);
    list.appendChild(li);
  });
}
