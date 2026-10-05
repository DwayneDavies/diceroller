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
