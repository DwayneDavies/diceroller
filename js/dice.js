import { rollDie, rollMany, sum, clampInt, formatExpr, LIMITS } from "./core.js";
import { playSoundForDie } from "./sound.js";
import { addResultBox } from "./results.js";

export function shake(btn) {
  if (!btn) return;
  btn.classList.add("shake");
  setTimeout(() => btn.classList.remove("shake"), 400);
}

// Reads x, y and z from three number inputs, clamped to LIMITS. A value
// outside the range is snapped back so the input shows what was rolled.
export function readExprInputs(timesId, sidesId, modId) {
  const read = (id, def, [min, max]) => {
    const el = document.getElementById(id);
    const v = clampInt(el.value, def, min, max);
    el.value = v;
    return v;
  };
  return {
    times: read(timesId, 1, LIMITS.times),
    sides: read(sidesId, 6, LIMITS.sides),
    mod: read(modId, 0, LIMITS.mod),
  };
}

export function rollDice(sides, btn) {
  playSoundForDie(sides);
  shake(btn);

  const roll = rollDie(sides);
  const opts = sides === 20 ? { sides: 20, rollKind: "plain" } : {};
  addResultBox(`Rolled d${sides}:`, [roll], roll, `result-d${sides}`, opts);
}

// Rolls xdy + z and logs it; shared by the custom roll and saved presets.
export function rollExpression(label, times, sides, mod) {
  const rolls = rollMany(times, sides);
  const opts =
    sides === 20
      ? { sides: 20, rollKind: "plain", mod }
      : { mod };
  addResultBox(label, rolls, sum(rolls) + mod, `result-d${sides}`, opts);
}

export function customRoll(event) {
  playSoundForDie("custom");
  const { times, sides, mod } = readExprInputs("times", "sides", "mod");

  shake(event.target);
  rollExpression(`${formatExpr(times, sides, mod)}:`, times, sides, mod);
}
