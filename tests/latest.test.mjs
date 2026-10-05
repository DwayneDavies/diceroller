import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Minimal stand-ins so results.js can run without a browser page.
let store;
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const events = [];
globalThis.document = {
  getElementById: () => null,
  dispatchEvent: (e) => { events.push(e.type); },
};
const { addResultBox, addVersusResultBox, latestRollSummary, hasLastRoll, restoreResults, clearResults } =
  await import("../js/results.js");

beforeEach(() => { store = {}; events.length = 0; restoreResults(); });

test("no summary before the first roll", () => {
  assert.equal(hasLastRoll(), false);
  assert.equal(latestRollSummary(), "");
});

test("summary of a plain roll, a d20 attack and a natural 20", () => {
  addResultBox("Rolled d6:", [4], 4, "result-d6", { sides: 6 });
  assert.equal(latestRollSummary(), "Rolled d6: 4");
  addResultBox("Attack Roll:", [12], 17, "result-attack", { sides: 20, rollKind: "attack", mod: 5 });
  assert.equal(latestRollSummary(), "Attack: 17");
  addResultBox("Attack Roll:", [20], 25, "result-attack", { sides: 20, rollKind: "attack", mod: 5 });
  assert.equal(latestRollSummary(), "Attack: 25 — Critical hit!");
  addResultBox("Rolled d20:", [1], 1, "result-d20", { sides: 20, rollKind: "plain" });
  assert.equal(latestRollSummary(), "Rolled d20: 1 — Natural 1");
});

test("summary of a versus roll drops the 'Versus:' prefix", () => {
  const side = (roll, mod) => ({ roll, mod, total: roll + mod });
  addVersusResultBox({ a: side(14, 3), b: side(9, 3), winner: "a", tied: false, margin: 5 }, "Aria", "Goblin", 20);
  assert.equal(latestRollSummary(), "Aria 17 (14+3) vs Goblin 12 (9+3) — Aria wins by 5");
});

test("each roll announces itself, and clearing empties the summary", () => {
  addResultBox("Rolled d6:", [2], 2, "result-d6", { sides: 6 });
  assert.ok(events.includes("rolladded"));
  assert.ok(events.includes("resultschange"));
  clearResults();
  assert.equal(hasLastRoll(), false);
  assert.equal(latestRollSummary(), "");
});

test("the newest roll after a restore is what the summary shows", () => {
  addResultBox("Rolled d6:", [1], 1, "result-d6", { sides: 6 });
  addResultBox("Rolled d8:", [7], 7, "result-d8", { sides: 8 });
  restoreResults(); // as after a page reload
  assert.equal(latestRollSummary(), "Rolled d8: 7");
});
