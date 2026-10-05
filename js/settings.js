// --- Sound playback ---
export function playSoundForDie(sides) {
  if (!loadSetting("soundEnabled", true)) return;
  let soundId;
  switch (sides) {
    case 3: soundId = "sound-d3"; break;
    case 4: soundId = "sound-d4"; break;
    case 6: soundId = "sound-d6"; break;
    case 8: soundId = "sound-d8"; break;
    case 10: soundId = "sound-d10"; break;
    case 12: soundId = "sound-d12"; break;
    case 20: soundId = "sound-d20"; break;
    case 100: soundId = "sound-d100"; break;
    case "custom": case "stats": soundId = "sound-custom"; break;
    default: soundId = "sound-d6";
  }
  const sound = document.getElementById(soundId);
  if (sound) { sound.currentTime = 0; sound.play(); }
}

// --- d20 natural 1 / 20 ---
function dieValueClass(value, sides) {
  if (sides === 20) {
    if (value === 1) return "die-value d20-nat-1";
    if (value === 20) return "die-value d20-nat-20";
  }
  return "die-value";
}

function d20OutcomeBanner(rolls, result, sides, rollKind) {
  if (sides !== 20) return null;

  let face = null;
  if (rolls.length === 1) {
    face = rolls[0];
  } else if (rolls.length === 2 && rollKind === "advantage") {
    face = Math.max(rolls[0], rolls[1]);
  } else if (rolls.length === 2 && rollKind === "disadvantage") {
    face = Math.min(rolls[0], rolls[1]);
  }
  if (face !== 1 && face !== 20) return null;

  const isNat1 = face === 1;
  if (rollKind === "attack") {
    return { text: isNat1 ? "Critical fail!" : "Critical hit!", isNat1 };
  }
  return { text: isNat1 ? "Natural 1" : "Natural 20", isNat1 };
}

// --- Copy last roll ---
let lastRoll = null;

function copyLabel(labelText, rollKind) {
  const short = {
    attack: "Attack",
    initiative: "Initiative",
    saving: "Saving Throw",
    advantage: "Advantage",
    disadvantage: "Disadvantage",
  };
  if (short[rollKind]) return short[rollKind];
  return labelText.replace(/:$/, "").trim();
}

function formatBreakdown(rolls, mod) {
  let s = rolls.join("+");
  if (mod > 0) s += (s ? "+" : "") + mod;
  else if (mod < 0) s += mod;
  return s;
}

export function formatLastRollText() {
  if (!lastRoll) return null;
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

export function clearLastRoll() {
  lastRoll = null;
}

export function clearResults() {
  const resultsBox = document.getElementById("results");
  if (resultsBox) resultsBox.innerHTML = "";
  clearLastRoll();
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

export function showCopyToast() {
  const hint = document.getElementById("copy-last-hint");
  if (!hint) return;
  hint.classList.remove("hidden");
  clearTimeout(showCopyToast._timer);
  showCopyToast._timer = setTimeout(() => hint.classList.add("hidden"), 2000);
}

// --- Result box helper ---
export function addResultBox(labelText, rolls, result, typeClass = "", options = {}) {
  const sides = options.sides;
  const rollKind = options.rollKind || "plain";

  const resultsBox = document.getElementById("results");
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

  const banner = d20OutcomeBanner(rolls, result, sides, rollKind);
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

  resultsBox.appendChild(div);

  lastRoll = {
    labelText,
    rolls,
    result,
    mod: options.mod || 0,
    rollKind,
    banner: banner ? banner.text : null,
    breakdownRolls: options.breakdownRolls,
  };
}

// --- Settings persistence ---
export function saveSetting(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
export function loadSetting(key, defaultValue) {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaultValue;
}

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
