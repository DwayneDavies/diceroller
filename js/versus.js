import { rollVersus, sanitizeVersusSettings } from "./core.js";
import { playSoundForDie } from "./sound.js";
import { addVersusResultBox } from "./results.js";
import { loadSetting, saveSetting } from "./storage.js";
import { shake } from "./dice.js";

const FIELD_IDS = {
  nameA: "versus-name-a",
  modA: "versus-mod-a",
  nameB: "versus-name-b",
  modB: "versus-mod-b",
  sides: "versus-sides",
  tie: "versus-tie",
};

function field(key) {
  return document.getElementById(FIELD_IDS[key]);
}

function writeFields(settings) {
  for (const key of Object.keys(FIELD_IDS)) field(key).value = settings[key];
}

// Reads the form, corrects anything out of range (the form shows what was
// used) and remembers it for next time.
function readAndSave() {
  const raw = {};
  for (const key of Object.keys(FIELD_IDS)) raw[key] = field(key).value;
  const settings = sanitizeVersusSettings(raw);
  writeFields(settings);
  saveSetting("versus", settings);
  return settings;
}

// "Side A wins" reads better as the actual name.
function refreshTieLabels() {
  const nameA = field("nameA").value.trim() || "Side A";
  const nameB = field("nameB").value.trim() || "Side B";
  const select = field("tie");
  select.querySelector("option[value='a']").textContent = `${nameA} wins`;
  select.querySelector("option[value='b']").textContent = `${nameB} wins`;
}

export function rollVersusFromForm(event) {
  const s = readAndSave();
  refreshTieLabels();
  playSoundForDie(s.sides);
  if (event) shake(event.currentTarget);
  const result = rollVersus(s);
  addVersusResultBox(result, s.nameA, s.nameB, s.sides);
}

export function initVersus() {
  writeFields(sanitizeVersusSettings(loadSetting("versus", null)));
  refreshTieLabels();
  for (const key of Object.keys(FIELD_IDS)) {
    field(key).addEventListener("change", () => {
      readAndSave();
      refreshTieLabels();
    });
  }
  field("nameA").addEventListener("input", refreshTieLabels);
  field("nameB").addEventListener("input", refreshTieLabels);
  document.getElementById("roll-versus").addEventListener("click", rollVersusFromForm);
}
