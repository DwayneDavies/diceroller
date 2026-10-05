import { loadSetting } from "./storage.js";
import { readExprInputs, shake } from "./dice.js";

export function analyticStats(n, m, z) {
  const meanSingle = (1 + m) / 2;
  const varSingle = (m * m - 1) / 12;
  const variance = n * varSingle;
  return {
    mean: n * meanSingle + z,
    variance,
    stdDev: Math.sqrt(variance),
  };
}

// Exact distribution of the sum of n dice with m sides, built one die at a
// time. Works in probabilities (never raw counts) so nothing overflows, and a
// sliding window keeps each step linear in the number of possible sums.
export function diceSumDistribution(n, m, mod = 0) {
  if (n < 1 || m < 1) return [];
  let probs = [1]; // probs[i] = P(sum of dice so far = minSum + i)
  for (let die = 1; die <= n; die++) {
    const next = new Array(probs.length + m - 1).fill(0);
    let window = 0;
    for (let i = 0; i < next.length; i++) {
      if (i < probs.length) window += probs[i];
      if (i - m >= 0) window -= probs[i - m];
      next[i] = Math.max(window, 0) / m;
    }
    probs = next;
  }
  const outcomes = Math.pow(m, n);
  return probs.map((p, i) => ({ sum: n + i + mod, p, count: p * outcomes }));
}

// Merge neighbouring sums so the chart never needs more than maxRows rows.
export function bucketDistribution(dist, maxRows) {
  if (dist.length <= maxRows) {
    return dist.map((d) => ({ label: String(d.sum), p: d.p, count: d.count }));
  }
  const size = Math.ceil(dist.length / maxRows);
  const buckets = [];
  for (let i = 0; i < dist.length; i += size) {
    const group = dist.slice(i, i + size);
    buckets.push({
      label: `${group[0].sum}\u2013${group[group.length - 1].sum}`,
      p: group.reduce((a, d) => a + d.p, 0),
      count: group.reduce((a, d) => a + d.count, 0),
    });
  }
  return buckets;
}

function formatCount(count) {
  return count < Number.MAX_SAFE_INTEGER
    ? String(Math.round(count))
    : count.toExponential(3);
}

const MAX_CHART_ROWS = 100;

// The last chart drawn, so it can be repainted when the theme or the
// percentages setting changes.
let lastChart = null;

export function redrawDistribution() {
  if (lastChart) drawDistribution(...lastChart);
}

function themeColor(el, name, fallback) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

export function drawDistribution(times, sides, mod) {
  const canvas = document.getElementById("stats-chart");
  if (!canvas) return;
  lastChart = [times, sides, mod];
  const ctx = canvas.getContext("2d");
  const textColor = themeColor(canvas, "--chart-text", "#fff");
  const barColor = themeColor(canvas, "--chart-bar", "#ffd700");
  const rows = bucketDistribution(diceSumDistribution(times, sides, mod), MAX_CHART_ROWS);
  if (rows.length === 0) return;
  const maxP = Math.max(...rows.map(d => d.p));
  const rowHeight = 24;
  const cssWidth = canvas.clientWidth || 600;
  const cssHeight = rows.length * rowHeight + 40;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,cssWidth,cssHeight);
  ctx.font = "12px Inter, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const showPercentages = loadSetting("showPercentages", true);
  const barStart = 10 + Math.max(...rows.map(d => ctx.measureText(d.label + ":").width));
  const barSpace = Math.max(cssWidth - barStart - 90, 10);
  rows.forEach((d, i) => {
    const y = i * rowHeight + rowHeight/2 + 20;
    const barLen = (d.p / maxP) * barSpace;
    ctx.fillStyle = textColor;
    ctx.fillText(d.label + ":", 5, y);
    ctx.fillStyle = barColor;
    ctx.fillRect(barStart, y - 8, barLen, 16);
    ctx.fillStyle = textColor;
    ctx.fillText(showPercentages ? (d.p * 100).toFixed(2) + "%" : formatCount(d.count), barStart + 5 + barLen, y);
  });
}

export function findRollStats(event) {
  const { times, sides, mod } = readExprInputs("stat-times", "stat-sides", "stat-mod");

  shake(event.target);

  document.getElementById("stats-container").hidden = false;
  const { mean, variance, stdDev } = analyticStats(times, sides, mod);
  const summaryEl = document.getElementById("stats-summary");
  if (summaryEl) {
    summaryEl.textContent =
      `Expected: ${mean.toFixed(2)}  |  Std dev: ${stdDev.toFixed(2)}  |  Variance: ${variance.toFixed(2)}`;
  }

  drawDistribution(times, sides, mod);
}
