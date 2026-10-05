import { test } from "node:test";
import assert from "node:assert/strict";
import { diceSumDistribution, bucketDistribution, analyticStats } from "../js/stats.js";

const total = (dist) => dist.reduce((a, d) => a + d.p, 0);

test("3d6 matches the known counts", () => {
  const dist = diceSumDistribution(3, 6);
  assert.equal(dist.length, 16);
  const count = (s) => Math.round(dist.find((d) => d.sum === s).count);
  assert.equal(count(3), 1);
  assert.equal(count(10), 27);
  assert.equal(count(11), 27);
  assert.equal(count(18), 1);
});

test("modifier shifts the sums", () => {
  const dist = diceSumDistribution(1, 6, 5);
  assert.deepEqual(dist.map((d) => d.sum), [6, 7, 8, 9, 10, 11]);
});

for (const [n, m] of [[3, 6], [50, 6], [40, 20], [100, 6], [100, 100]]) {
  test(`${n}d${m} is a valid distribution with every total present`, () => {
    const dist = diceSumDistribution(n, m);
    assert.equal(dist.length, n * m - n + 1);
    assert.ok(Math.abs(total(dist) - 1) < 1e-9, `sums to ${total(dist)}`);
    assert.ok(dist.every((d) => d.p >= 0 && Number.isFinite(d.p)));
  });

  test(`${n}d${m} mean and variance match analyticStats`, () => {
    const dist = diceSumDistribution(n, m);
    const mean = dist.reduce((a, d) => a + d.sum * d.p, 0);
    const variance = dist.reduce((a, d) => a + (d.sum - mean) ** 2 * d.p, 0);
    const expected = analyticStats(n, m, 0);
    assert.ok(Math.abs(mean - expected.mean) < 1e-6 * expected.mean);
    assert.ok(Math.abs(variance - expected.variance) < 1e-6 * expected.variance);
  });
}

test("bucketDistribution caps rows and keeps total probability", () => {
  const dist = diceSumDistribution(100, 100);
  const rows = bucketDistribution(dist, 100);
  assert.ok(rows.length <= 100);
  assert.ok(Math.abs(total(rows) - 1) < 1e-9);
  assert.equal(rows[0].label.split("–")[0], "100");
});

test("bucketDistribution leaves small distributions alone", () => {
  const rows = bucketDistribution(diceSumDistribution(2, 6), 100);
  assert.equal(rows.length, 11);
  assert.equal(rows[0].label, "2");
});
