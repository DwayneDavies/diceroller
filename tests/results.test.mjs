import { test } from "node:test";
import assert from "node:assert/strict";
import { d20OutcomeBanner } from "../js/results.js";

test("a single natural 20 or 1 gets a banner", () => {
  assert.equal(d20OutcomeBanner([20], 20, "initiative").text, "Natural 20");
  assert.equal(d20OutcomeBanner([1], 20, "saving").text, "Natural 1");
  assert.equal(d20OutcomeBanner([12], 20, "attack"), null);
  assert.equal(d20OutcomeBanner([20], 6, "plain"), null);
});

test("attacks call natural 20 a critical hit and natural 1 a critical fail", () => {
  assert.equal(d20OutcomeBanner([20], 20, "attack").text, "Critical hit!");
  assert.equal(d20OutcomeBanner([1], 20, "attack").text, "Critical fail!");
});

test("with advantage only the higher die counts", () => {
  assert.equal(d20OutcomeBanner([20, 3], 20, "attack", "advantage").text, "Critical hit!");
  assert.equal(d20OutcomeBanner([1, 3], 20, "attack", "advantage"), null);
});

test("with disadvantage only the lower die counts", () => {
  assert.equal(d20OutcomeBanner([20, 3], 20, "attack", "disadvantage"), null);
  assert.equal(d20OutcomeBanner([1, 15], 20, "attack", "disadvantage").text, "Critical fail!");
  assert.equal(d20OutcomeBanner([1, 15], 20, "saving", "disadvantage").text, "Natural 1");
});
