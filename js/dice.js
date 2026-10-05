import { rollDie, rollMany, sum } from "./core.js";
import { playSoundForDie } from "./sound.js";
import { addResultBox } from "./results.js";

export function shake(btn) {
  if (!btn) return;
  btn.classList.add("shake");
  setTimeout(() => btn.classList.remove("shake"), 400);
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
  const times = parseInt(document.getElementById("times").value) || 1;
  const sides = parseInt(document.getElementById("sides").value) || 6;
  const mod = parseInt(document.getElementById("mod").value) || 0;

  shake(event.target);
  rollExpression(`${times}d${sides}${mod ? `+${mod}` : ""}:`, times, sides, mod);
}
