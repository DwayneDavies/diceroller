import { formatBreakdown, formatVersusText, versusVerdict } from "./core.js";
import { MAX_RESULTS, appendRecord, sanitizeRecords } from "./history.js";
import { loadSetting, saveSetting } from "./storage.js";

// --- d20 natural 1 / 20 ---
function dieValueClass(value, sides) {
  if (sides === 20) {
    if (value === 1) return "die-value d20-nat-1";
    if (value === 20) return "die-value d20-nat-20";
  }
  return "die-value";
}

// Natural 1 / natural 20 banner for a single d20 roll.
export function d20OutcomeBanner(rolls, sides, rollKind) {
  if (sides !== 20 || rolls.length !== 1) return null;

  const face = rolls[0];
  if (face !== 1 && face !== 20) return null;

  const isNat1 = face === 1;
  if (rollKind === "attack") {
    return { text: isNat1 ? "Critical fail!" : "Critical hit!", isNat1 };
  }
  return { text: isNat1 ? "Natural 1" : "Natural 20", isNat1 };
}

// --- Roll history ---
// Rolls are stored as plain records (oldest first, see history.js), drawn
// newest first, saved so they survive a reload, and capped at MAX_RESULTS.
let records = [];
let lastRoll = null;
let undoSnapshot = null;
let undoTimer = null;

function notifyChange() {
  document.dispatchEvent(new CustomEvent("resultschange"));
}

function persist() {
  saveSetting("results", records);
}

// --- Copy last roll ---
function copyLabel(labelText, rollKind) {
  const short = {
    attack: "Attack",
    initiative: "Initiative",
    saving: "Saving Throw",
  };
  if (short[rollKind]) return short[rollKind];
  return labelText.replace(/:$/, "").trim();
}

function lastRollFor(record) {
  if (record.kind === "versus") {
    return { copyText: formatVersusText(record.result, record.nameA, record.nameB) };
  }
  const banner = d20OutcomeBanner(record.rolls, record.sides, record.rollKind);
  return {
    labelText: record.labelText,
    rolls: record.rolls,
    result: record.result,
    mod: record.mod,
    rollKind: record.rollKind,
    banner: banner ? banner.text : null,
    breakdownRolls: record.breakdownRolls,
  };
}

export function formatLastRollText() {
  if (!lastRoll) return null;
  if (lastRoll.copyText) return lastRoll.copyText;
  const { labelText, rolls, result, mod, banner, rollKind, breakdownRolls } =
    lastRoll;
  const name = copyLabel(labelText, rollKind);
  const breakdown = formatBreakdown(breakdownRolls ?? rolls, mod);
  let text = `${name}: ${result} (${breakdown})`;
  if (banner) text += ` — ${banner}`;
  return text;
}

export function hasLastRoll() {
  return lastRoll !== null;
}

export function hasResults() {
  return records.length > 0;
}

export async function copyLastRoll() {
  const text = formatLastRollText();
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

function showToast(id, ms) {
  const hint = document.getElementById(id);
  if (!hint) return;
  hint.classList.remove("hidden");
  clearTimeout(hint._timer);
  hint._timer = setTimeout(() => hint.classList.add("hidden"), ms);
}

function hideToast(id) {
  const hint = document.getElementById(id);
  if (!hint) return;
  clearTimeout(hint._timer);
  hint.classList.add("hidden");
}

export function showCopyToast() {
  showToast("copy-last-hint", 2000);
}

// --- Drawing ---
function buildRollBox(record) {
  const { labelText, rolls, result, typeClass, sides, rollKind } = record;
  const div = document.createElement("div");
  div.className = "result-box" + (typeClass ? " " + typeClass : "");

  const label = document.createElement("span");
  label.className = "result-label";
  label.textContent = labelText;
  div.appendChild(label);

  rolls.forEach((r) => {
    const die = document.createElement("span");
    die.className = dieValueClass(r, sides);
    die.textContent = r;
    if (sides === 20 && (r === 1 || r === 20)) {
      die.title = r === 1 ? "Natural 1" : "Natural 20";
    }
    div.appendChild(die);
  });

  const banner = d20OutcomeBanner(rolls, sides, rollKind);
  if (banner) {
    const badge = document.createElement("span");
    badge.className =
      "d20-outcome-banner " + (banner.isNat1 ? "nat-fail" : "nat-success");
    badge.textContent = banner.text;
    div.appendChild(badge);
  }

  const total = document.createElement("span");
  total.className = "result-total";
  total.textContent = `Result: ${result}`;
  div.appendChild(total);
  return div;
}

function versusSideElement(name, side, sides, isWinner) {
  const el = document.createElement("div");
  el.className = "versus-side" + (isWinner ? " is-winner" : "");

  const nameEl = document.createElement("span");
  nameEl.className = "versus-name";
  nameEl.textContent = name;

  const die = document.createElement("span");
  die.className = dieValueClass(side.roll, sides);
  die.textContent = side.roll;
  if (sides === 20 && (side.roll === 1 || side.roll === 20)) {
    die.title = side.roll === 1 ? "Natural 1" : "Natural 20";
  }

  const total = document.createElement("span");
  total.className = "versus-total";
  const modText = side.mod > 0 ? `+${side.mod} ` : side.mod < 0 ? `${side.mod} ` : "";
  total.textContent = `${modText}= ${side.total}`;

  el.append(nameEl, die, total);
  return el;
}

function buildVersusBox(record) {
  const { result, nameA, nameB, sides } = record;
  const div = document.createElement("div");
  div.className = "result-box result-versus";

  const vs = document.createElement("span");
  vs.className = "versus-vs";
  vs.textContent = "vs";

  const verdict = document.createElement("span");
  verdict.className = "versus-verdict";
  verdict.textContent = versusVerdict(result, nameA, nameB);

  div.append(
    versusSideElement(nameA, result.a, sides, result.winner === "a"),
    vs,
    versusSideElement(nameB, result.b, sides, result.winner === "b"),
    verdict
  );
  return div;
}

// Draws one record at the top of the list (newest first).
function drawRecord(record) {
  const resultsBox = document.getElementById("results");
  if (!resultsBox) return;
  resultsBox.prepend(record.kind === "versus" ? buildVersusBox(record) : buildRollBox(record));
  while (resultsBox.children.length > MAX_RESULTS) resultsBox.lastElementChild.remove();
}

function drawAll() {
  const resultsBox = document.getElementById("results");
  if (resultsBox) resultsBox.replaceChildren();
  records.forEach(drawRecord);
  lastRoll = records.length ? lastRollFor(records[records.length - 1]) : null;
}

function addRecord(record) {
  // A new roll after "Clear" means the cleared rolls can no longer come back.
  undoSnapshot = null;
  hideToast("undo-hint");
  records = appendRecord(records, record);
  drawRecord(record);
  lastRoll = lastRollFor(record);
  persist();
  notifyChange();
}

// --- Public: adding, restoring, clearing ---
export function addResultBox(labelText, rolls, result, typeClass = "", options = {}) {
  addRecord({
    kind: "roll",
    labelText,
    rolls,
    result,
    typeClass,
    sides: options.sides,
    rollKind: options.rollKind || "plain",
    mod: options.mod || 0,
    breakdownRolls: options.breakdownRolls,
  });
}

export function addVersusResultBox(result, nameA, nameB, sides) {
  addRecord({ kind: "versus", nameA, nameB, sides, result });
}

// Called once at startup: brings back the rolls saved by the last visit.
export function restoreResults() {
  records = sanitizeRecords(loadSetting("results", []));
  drawAll();
  notifyChange();
}

export function clearResults() {
  if (records.length === 0) return;
  undoSnapshot = records;
  records = [];
  drawAll();
  persist();
  notifyChange();
  showToast("undo-hint", 8000);
}

export function undoClear() {
  if (!undoSnapshot) return false;
  records = undoSnapshot;
  undoSnapshot = null;
  hideToast("undo-hint");
  drawAll();
  persist();
  notifyChange();
  return true;
}
