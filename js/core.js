// Pure helpers with no DOM access, so they can be tested under Node.

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollMany(times, sides) {
  const rolls = [];
  for (let i = 0; i < times; i++) rolls.push(rollDie(sides));
  return rolls;
}

export function sum(values) {
  return values.reduce((a, b) => a + b, 0);
}

export function formatBreakdown(rolls, mod) {
  let s = rolls.join("+");
  if (mod > 0) s += (s ? "+" : "") + mod;
  else if (mod < 0) s += mod;
  return s;
}

// Allowed ranges for xdy + z inputs; index.html mirrors these as min/max.
export const LIMITS = {
  times: [1, 100],
  sides: [2, 1000],
  mod: [-100, 100],
};

export function clampInt(value, defaultValue, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return defaultValue;
  return Math.min(Math.max(n, min), max);
}

export function formatExpr(times, sides, mod) {
  let s = `${times}d${sides}`;
  if (mod > 0) s += `+${mod}`;
  else if (mod < 0) s += mod;
  return s;
}

// --- Versus (opposed) rolls ---
export const TIE_RULES = ["tie", "a", "b"];
export const MAX_VERSUS_NAME = 20;
export const VERSUS_DEFAULTS = {
  nameA: "You",
  modA: 0,
  nameB: "Opponent",
  modB: 0,
  sides: 20,
  tie: "tie",
};

// Both sides roll the same die; the higher total wins. On equal totals the
// `tie` rule decides: "tie" leaves it a tie, "a" or "b" gives that side the win.
// `die` can be swapped out in tests to supply known rolls (side A rolls first).
export function rollVersus({ sides, modA, modB, tie = "tie" }, die = rollDie) {
  const rollA = die(sides);
  const rollB = die(sides);
  const totalA = rollA + modA;
  const totalB = rollB + modB;
  const tied = totalA === totalB;
  let winner;
  if (!tied) winner = totalA > totalB ? "a" : "b";
  else winner = tie === "a" || tie === "b" ? tie : "tie";
  return {
    a: { roll: rollA, mod: modA, total: totalA },
    b: { roll: rollB, mod: modB, total: totalB },
    winner,
    tied,
    margin: Math.abs(totalA - totalB),
  };
}

export function versusVerdict(result, nameA, nameB) {
  const nameOf = (side) => (side === "a" ? nameA : nameB);
  if (!result.tied) return `${nameOf(result.winner)} wins by ${result.margin}`;
  if (result.winner === "tie") return "Tie";
  return `Tie, ${nameOf(result.winner)} wins the tie`;
}

export function formatVersusText(result, nameA, nameB) {
  const side = (name, s) => `${name} ${s.total} (${formatBreakdown([s.roll], s.mod)})`;
  return `Versus: ${side(nameA, result.a)} vs ${side(nameB, result.b)} — ${versusVerdict(result, nameA, nameB)}`;
}

// Rebuilds the saved versus form from untrusted input: clamps numbers,
// trims names and falls back to the defaults for anything unusable.
export function sanitizeVersusSettings(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const name = (value, fallback) =>
    typeof value === "string" && value.trim() ? value.trim().slice(0, MAX_VERSUS_NAME) : fallback;
  const d = VERSUS_DEFAULTS;
  return {
    nameA: name(r.nameA, d.nameA),
    modA: clampInt(r.modA, d.modA, ...LIMITS.mod),
    nameB: name(r.nameB, d.nameB),
    modB: clampInt(r.modB, d.modB, ...LIMITS.mod),
    sides: clampInt(r.sides, d.sides, ...LIMITS.sides),
    tie: TIE_RULES.includes(r.tie) ? r.tie : d.tie,
  };
}

// One-line summary of the Attack / Initiative / Save modifiers, shown on the
// collapsed "Modifiers" panel so non-zero values are never out of sight.
export function describeModifiers({ attack = 0, initiative = 0, saving = 0 } = {}) {
  const signed = (n) => (n > 0 ? `+${n}` : String(n));
  const parts = [];
  if (attack) parts.push(`Attack ${signed(attack)}`);
  if (initiative) parts.push(`Initiative ${signed(initiative)}`);
  if (saving) parts.push(`Save ${signed(saving)}`);
  return parts.length ? `Modifiers: ${parts.join(" · ")}` : "Modifiers (none set)";
}

// Where the roll results sit on the page: above or below the dice.
export const RESULTS_POSITIONS = ["top", "bottom"];
export function normalizeResultsPosition(value) {
  return RESULTS_POSITIONS.includes(value) ? value : "top";
}
