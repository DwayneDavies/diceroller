import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeRecord, sanitizeRecords, appendRecord, MAX_RESULTS } from "../js/history.js";

const roll = (over = {}) => ({
  kind: "roll", labelText: "Rolled d20:", rolls: [17], result: 17,
  typeClass: "result-d20", sides: 20, rollKind: "plain", mod: 0, ...over,
});
const versus = (over = {}) => ({
  kind: "versus", nameA: "Aria", nameB: "Goblin", sides: 20,
  result: { a: { roll: 14, mod: 3, total: 17 }, b: { roll: 9, mod: 3, total: 12 }, winner: "a", tied: false, margin: 5 },
  ...over,
});

test("a good roll record survives unchanged", () => {
  const r = roll({ rollKind: "attack", mod: 5, breakdownRolls: [17] });
  assert.deepEqual(sanitizeRecord(r), { ...r });
});

test("a good versus record survives", () => {
  assert.deepEqual(sanitizeRecord(versus()), versus());
});

test("junk is rejected", () => {
  for (const bad of [null, undefined, 5, "x", [], {}, { kind: "nope" }]) {
    assert.equal(sanitizeRecord(bad), null);
  }
  assert.equal(sanitizeRecord(roll({ rolls: [] })), null);
  assert.equal(sanitizeRecord(roll({ rolls: ["a"] })), null);
  assert.equal(sanitizeRecord(roll({ rolls: new Array(101).fill(1) })), null);
  assert.equal(sanitizeRecord(roll({ result: "17" })), null);
  assert.equal(sanitizeRecord(versus({ sides: 1 })), null);
  assert.equal(sanitizeRecord(versus({ result: { a: {}, b: {}, winner: "a", margin: 1 } })), null);
  assert.equal(sanitizeRecord(versus({ result: { ...versus().result, winner: "c" } })), null);
});

test("fields are repaired, not trusted", () => {
  const r = sanitizeRecord(roll({ typeClass: "x onclick=1", rollKind: "weird", sides: 5000, mod: 1.5, labelText: "y".repeat(500) }));
  assert.equal(r.typeClass, "");
  assert.equal(r.rollKind, "plain");
  assert.equal(r.sides, undefined);
  assert.equal(r.mod, 0);
  assert.equal(r.labelText.length, 80);
  const v = sanitizeRecord(versus({ nameA: "", nameB: "z".repeat(99) }));
  assert.equal(v.nameA, "Side A");
  assert.equal(v.nameB.length, 20);
});

test("sanitizeRecords drops bad entries, keeps order, and keeps the newest when too long", () => {
  assert.deepEqual(sanitizeRecords("nope"), []);
  const list = sanitizeRecords([roll({ result: 1, rolls: [1] }), null, roll({ result: 2, rolls: [2] })]);
  assert.deepEqual(list.map((r) => r.result), [1, 2]);
  const many = Array.from({ length: MAX_RESULTS + 30 }, (_, i) => roll({ result: i, rolls: [i + 1] }));
  const kept = sanitizeRecords(many);
  assert.equal(kept.length, MAX_RESULTS);
  assert.equal(kept.at(-1).result, MAX_RESULTS + 29);
  assert.equal(kept[0].result, 30);
});

test("appendRecord adds the newest last and trims the oldest", () => {
  let list = [];
  for (let i = 0; i < MAX_RESULTS + 5; i++) list = appendRecord(list, roll({ result: i, rolls: [1] }));
  assert.equal(list.length, MAX_RESULTS);
  assert.equal(list[0].result, 5);
  assert.equal(list.at(-1).result, MAX_RESULTS + 4);
  const original = [roll()];
  appendRecord(original, roll());
  assert.equal(original.length, 1); // does not mutate its input
});
