import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Minimal in-memory localStorage so storage.js can run under Node.
let data;
globalThis.localStorage = {
  getItem: (k) => (k in data ? data[k] : null),
  setItem: (k, v) => { data[k] = String(v); },
  removeItem: (k) => { delete data[k]; },
};
const { loadPresets, loadSetting, saveSetting } = await import("../js/storage.js");

beforeEach(() => { data = {}; });

test("loadPresets returns [] when nothing or junk is saved", () => {
  assert.deepEqual(loadPresets(), []);
  data.presets = "{not json";
  assert.deepEqual(loadPresets(), []);
  data.presets = JSON.stringify({ name: "not an array" });
  assert.deepEqual(loadPresets(), []);
});

test("loadPresets drops unusable entries and clamps the rest", () => {
  data.presets = JSON.stringify([
    { name: "Sword", times: 2, sides: 8, mod: 4 },
    { name: "   ", times: 1, sides: 6, mod: 0 },
    null,
    { times: 1, sides: 6, mod: 0 },
    { name: "Huge", times: 99999999, sides: -6, mod: "x" },
    { name: "x".repeat(100), times: 1, sides: 6, mod: 0 },
  ]);
  const presets = loadPresets();
  assert.equal(presets.length, 3);
  assert.deepEqual(presets[0], { name: "Sword", times: 2, sides: 8, mod: 4 });
  assert.deepEqual(presets[1], { name: "Huge", times: 100, sides: 2, mod: 0 });
  assert.equal(presets[2].name.length, 30);
});

test("settings round-trip and fall back on corrupt values", () => {
  saveSetting("theme", "neon");
  assert.equal(loadSetting("theme", "dark"), "neon");
  data.theme = "oops{";
  assert.equal(loadSetting("theme", "dark"), "dark");
  assert.equal(loadSetting("missing", false), false);
});
