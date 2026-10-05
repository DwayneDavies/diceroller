import { playSoundForDie, addResultBox } from './settings.js';

export function rollDice(sides, btn) {
  playSoundForDie(sides);
  btn.classList.add("shake");
  setTimeout(() => btn.classList.remove("shake"), 400);

  const roll = Math.floor(Math.random() * sides) + 1;
  const opts = sides === 20 ? { sides: 20, rollKind: "plain" } : {};
  addResultBox(`Rolled d${sides}:`, [roll], roll, `result-d${sides}`, opts);
}

export function customRoll(event) {
  playSoundForDie("custom");
  const times = parseInt(document.getElementById("times").value) || 1;
  const sides = parseInt(document.getElementById("sides").value) || 6;
  const mod = parseInt(document.getElementById("mod").value) || 0;

  const btn = event.target;
  btn.classList.add("shake");
  setTimeout(() => btn.classList.remove("shake"), 400);

  let rolls = [], total = 0;
  for (let i = 0; i < times; i++) {
    const r = Math.floor(Math.random() * sides) + 1;
    total += r; rolls.push(r);
  }

  const opts =
    sides === 20
      ? { sides: 20, rollKind: "plain", mod }
      : { mod };
  addResultBox(
    `${times}d${sides}${mod ? `+${mod}` : ""}:`,
    rolls,
    total + mod,
    `result-d${sides}`,
    opts
  );
}
