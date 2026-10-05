// Pure helpers with no DOM access, so they can be tested under Node.

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollMany(times, sides) {
  const rolls = [];
  for (let i = 0; i < times; i++) rolls.push(rollDie(sides));
  return rolls;
}

export const ROLL_MODES = ["disadvantage", "normal", "advantage"];

// One d20, or two with the higher (advantage) or lower (disadvantage) kept.
// `die` can be swapped out in tests to supply known rolls.
export function rollD20(mode = "normal", die = rollDie) {
  const first = die(20);
  if (mode !== "advantage" && mode !== "disadvantage") {
    return { rolls: [first], kept: first };
  }
  const second = die(20);
  const kept = mode === "advantage" ? Math.max(first, second) : Math.min(first, second);
  return { rolls: [first, second], kept };
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
