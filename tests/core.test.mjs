import { test } from "node:test";
import assert from "node:assert/strict";
import { rollDie, rollMany, sum, clampInt, formatExpr, formatBreakdown } from "../js/core.js";

test("rollDie stays within 1..sides and hits both ends", () => {
  const seen = new Set();
  for (let i = 0; i < 5000; i++) {
    const r = rollDie(6);
    assert.ok(Number.isInteger(r) && r >= 1 && r <= 6, `out of range: ${r}`);
    seen.add(r);
  }
  assert.equal(seen.size, 6);
});

test("rollMany returns the requested number of dice", () => {
  const rolls = rollMany(10, 20);
  assert.equal(rolls.length, 10);
  assert.ok(rolls.every((r) => r >= 1 && r <= 20));
  assert.deepEqual(rollMany(0, 6), []);
});

test("sum", () => {
  assert.equal(sum([1, 2, 3]), 6);
  assert.equal(sum([]), 0);
});

test("clampInt clamps, parses and falls back", () => {
  assert.equal(clampInt("5", 1, 1, 100), 5);
  assert.equal(clampInt("99999999", 1, 1, 100), 100);
  assert.equal(clampInt("-6", 6, 2, 1000), 2);
  assert.equal(clampInt("", 6, 2, 1000), 6);
  assert.equal(clampInt("abc", 0, -100, 100), 0);
  assert.equal(clampInt("0", 7, -100, 100), 0); // 0 is a real value, not "missing"
});

test("formatExpr shows the modifier sign correctly", () => {
  assert.equal(formatExpr(1, 6, -3), "1d6-3");
  assert.equal(formatExpr(2, 8, 4), "2d8+4");
  assert.equal(formatExpr(3, 6, 0), "3d6");
});

test("formatBreakdown", () => {
  assert.equal(formatBreakdown([3, 4], 2), "3+4+2");
  assert.equal(formatBreakdown([3], -1), "3-1");
  assert.equal(formatBreakdown([5], 0), "5");
});

import {
  rollVersus,
  versusVerdict,
  formatVersusText,
  sanitizeVersusSettings,
  VERSUS_DEFAULTS,
} from "../js/core.js";

const fixedDice = (...values) => () => values.shift();

test("rollVersus: higher total wins and reports the margin", () => {
  const r = rollVersus({ sides: 20, modA: 3, modB: 1 }, fixedDice(14, 12));
  assert.deepEqual(r.a, { roll: 14, mod: 3, total: 17 });
  assert.deepEqual(r.b, { roll: 12, mod: 1, total: 13 });
  assert.equal(r.winner, "a");
  assert.equal(r.margin, 4);
  assert.equal(r.tied, false);

  const r2 = rollVersus({ sides: 20, modA: 0, modB: 5 }, fixedDice(18, 15));
  assert.equal(r2.winner, "b"); // 18 vs 20: modifiers decide
  assert.equal(r2.margin, 2);
});

test("rollVersus: modifiers can turn a lower roll into a win", () => {
  const r = rollVersus({ sides: 20, modA: -2, modB: 0 }, fixedDice(10, 9));
  assert.equal(r.winner, "b");
});

test("rollVersus: ties follow the tie rule", () => {
  const roll = (tie) => rollVersus({ sides: 20, modA: 2, modB: 0, tie }, fixedDice(8, 10));
  assert.equal(roll("tie").winner, "tie");
  assert.equal(roll(undefined).winner, "tie");
  assert.equal(roll("bogus").winner, "tie");
  assert.equal(roll("a").winner, "a");
  assert.equal(roll("b").winner, "b");
  for (const tie of ["tie", "a", "b"]) {
    const r = roll(tie);
    assert.equal(r.tied, true);
    assert.equal(r.margin, 0);
  }
});

test("rollVersus: real dice stay in range for both sides", () => {
  for (let i = 0; i < 2000; i++) {
    const r = rollVersus({ sides: 6, modA: 0, modB: 0 });
    assert.ok(r.a.roll >= 1 && r.a.roll <= 6 && r.b.roll >= 1 && r.b.roll <= 6);
  }
});

test("rollVersus: with equal modifiers each side wins about as often", () => {
  let a = 0, b = 0, t = 0;
  for (let i = 0; i < 40000; i++) {
    const r = rollVersus({ sides: 20, modA: 0, modB: 0 });
    if (r.winner === "a") a++; else if (r.winner === "b") b++; else t++;
  }
  assert.ok(Math.abs(a - b) < 1200, `a=${a} b=${b}`);
  assert.ok(Math.abs(t / 40000 - 0.05) < 0.01, `tie rate ${t / 40000}`);
});

test("versusVerdict and copy text", () => {
  const win = rollVersus({ sides: 20, modA: 3, modB: 3 }, fixedDice(14, 9));
  assert.equal(versusVerdict(win, "Aria", "Goblin"), "Aria wins by 5");
  assert.equal(
    formatVersusText(win, "Aria", "Goblin"),
    "Versus: Aria 17 (14+3) vs Goblin 12 (9+3) — Aria wins by 5"
  );

  const tie = rollVersus({ sides: 20, modA: 0, modB: 0 }, fixedDice(11, 11));
  assert.equal(versusVerdict(tie, "Aria", "Goblin"), "Tie");
  const tieB = rollVersus({ sides: 20, modA: 0, modB: 0, tie: "b" }, fixedDice(11, 11));
  assert.equal(versusVerdict(tieB, "Aria", "Goblin"), "Tie, Goblin wins the tie");

  const neg = rollVersus({ sides: 20, modA: -2, modB: 0 }, fixedDice(10, 5));
  assert.equal(formatVersusText(neg, "A", "B"), "Versus: A 8 (10-2) vs B 5 (5) — A wins by 3");
});

test("sanitizeVersusSettings keeps good values and repairs bad ones", () => {
  assert.deepEqual(sanitizeVersusSettings(null), VERSUS_DEFAULTS);
  assert.deepEqual(sanitizeVersusSettings("junk"), VERSUS_DEFAULTS);
  assert.deepEqual(
    sanitizeVersusSettings({ nameA: " Aria ", modA: "4", nameB: "Goblin", modB: -2, sides: 100, tie: "b" }),
    { nameA: "Aria", modA: 4, nameB: "Goblin", modB: -2, sides: 100, tie: "b" }
  );
  const bad = sanitizeVersusSettings({ nameA: "   ", modA: 9999, nameB: 7, modB: "x", sides: -3, tie: "nope" });
  assert.equal(bad.nameA, "You");
  assert.equal(bad.modA, 100);
  assert.equal(bad.nameB, "Opponent");
  assert.equal(bad.modB, 0);
  assert.equal(bad.sides, 2);
  assert.equal(bad.tie, "tie");
  assert.equal(sanitizeVersusSettings({ nameA: "x".repeat(60) }).nameA.length, 20);
});

import { describeModifiers } from "../js/core.js";

test("describeModifiers lists only the non-zero modifiers", () => {
  assert.equal(describeModifiers({ attack: 0, initiative: 0, saving: 0 }), "Modifiers (none set)");
  assert.equal(describeModifiers(), "Modifiers (none set)");
  assert.equal(describeModifiers({ attack: 5, initiative: 0, saving: -1 }), "Modifiers: Attack +5 · Save -1");
  assert.equal(describeModifiers({ attack: 0, initiative: 2, saving: 0 }), "Modifiers: Initiative +2");
});
