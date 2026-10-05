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

import { rollD20 } from "../js/core.js";

const fixedDice = (...values) => () => values.shift();

test("rollD20 normal rolls one die", () => {
  assert.deepEqual(rollD20("normal", fixedDice(14)), { rolls: [14], kept: 14 });
  assert.deepEqual(rollD20(undefined, fixedDice(3)), { rolls: [3], kept: 3 });
});

test("rollD20 advantage keeps the higher, disadvantage the lower", () => {
  assert.deepEqual(rollD20("advantage", fixedDice(4, 17)), { rolls: [4, 17], kept: 17 });
  assert.deepEqual(rollD20("advantage", fixedDice(17, 4)), { rolls: [17, 4], kept: 17 });
  assert.deepEqual(rollD20("disadvantage", fixedDice(4, 17)), { rolls: [4, 17], kept: 4 });
  assert.deepEqual(rollD20("disadvantage", fixedDice(9, 9)), { rolls: [9, 9], kept: 9 });
});

test("rollD20 treats an unknown mode as normal", () => {
  assert.equal(rollD20("bogus", fixedDice(8)).rolls.length, 1);
});
