import { formatBreakdown, formatVersusText, versusVerdict } from "./core.js";

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

// --- Copy last roll ---
let lastRoll = null;

function copyLabel(labelText, rollKind) {
  const short = {
    attack: "Attack",
    initiative: "Initiative",
    saving: "Saving Throw",
  };
  if (short[rollKind]) return short[rollKind];
  return labelText.replace(/:$/, "").trim();
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

// --- Versus result box ---
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

export function addVersusResultBox(result, nameA, nameB, sides) {
  const resultsBox = document.getElementById("results");
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
  resultsBox.appendChild(div);

  lastRoll = { copyText: formatVersusText(result, nameA, nameB) };
}
