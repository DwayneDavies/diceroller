import { formatBreakdown } from "./core.js";

// --- d20 natural 1 / 20 ---
function dieValueClass(value, sides) {
  if (sides === 20) {
    if (value === 1) return "die-value d20-nat-1";
    if (value === 20) return "die-value d20-nat-20";
  }
  return "die-value";
}

// The natural 1 / natural 20 banner looks at the d20 that counts: the only
// die, or the kept one when rolling with advantage or disadvantage.
export function d20OutcomeBanner(rolls, sides, rollKind, mode = "normal") {
  if (sides !== 20) return null;

  let face = null;
  if (rolls.length === 1) {
    face = rolls[0];
  } else if (rolls.length === 2 && mode === "advantage") {
    face = Math.max(rolls[0], rolls[1]);
  } else if (rolls.length === 2 && mode === "disadvantage") {
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

function copyLabel(labelText, rollKind, mode) {
  const short = {
    attack: "Attack",
    initiative: "Initiative",
    saving: "Saving Throw",
  };
  if (!short[rollKind]) return labelText.replace(/:$/, "").trim();
  const suffix = mode === "advantage" ? " (Advantage)" : mode === "disadvantage" ? " (Disadvantage)" : "";
  return short[rollKind] + suffix;
}

export function formatLastRollText() {
  if (!lastRoll) return null;
  const { labelText, rolls, result, mod, banner, rollKind, mode, breakdownRolls } =
    lastRoll;
  const name = copyLabel(labelText, rollKind, mode);
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

  const mode = options.mode || "normal";
  const banner = d20OutcomeBanner(rolls, sides, rollKind, mode);
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
    mode,
    banner: banner ? banner.text : null,
    breakdownRolls: options.breakdownRolls,
  };
}
