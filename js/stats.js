import { playSoundForDie } from "./sound.js";
import { loadSetting } from "./storage.js";

export function analyticStats(n, m, z) {
  const meanSingle = (1 + m) / 2;
  const varSingle = (m * m - 1) / 12;
  return {
    mean: n * meanSingle + z,
    variance: n * varSingle
  };
}

function binom(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = res * (n - k + i) / i;
  }
  return res;
}

function diceCountExact(s, n, m) {
  if (s < n || s > n * m) return 0;
  const maxK = Math.floor((s - n) / m);
  let total = 0;
  for (let k = 0; k <= maxK; k++) {
    const term = binom(n, k) * binom(s - m * k - 1, n - 1);
    total += (k % 2 === 0 ? term : -term);
  }
  return total;
}

export function diceSumDistribution(n, m, mod = 0) {
  const baseTotal = Math.pow(m, n);
  const result = [];
  for (let s = n; s <= n * m; s++) {
    const count = diceCountExact(s, n, m);
    if (count > 0) {
      result.push({ sum: s + mod, count, p: count / baseTotal });
    }
  }
  return result;
}

export function drawDistribution(times, sides, mod) {
  const canvas = document.getElementById("stats-chart");
  const ctx = canvas.getContext("2d");
  const dist = diceSumDistribution(times, sides, mod);
  if (dist.length === 0) return;
  const maxP = Math.max(...dist.map(d => d.p));
  const rowHeight = 24;
  const cssWidth = canvas.clientWidth || 600;
  const cssHeight = dist.length * rowHeight + 40;
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
  dist.forEach((d, i) => {
    const y = i * rowHeight + rowHeight/2 + 20;
    const barLen = (d.p / maxP) * (cssWidth - 160);
    ctx.fillStyle = "#fff";
    ctx.fillText(d.sum + ":", 5, y);
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(40, y - 8, barLen, 16);
    ctx.fillStyle = "#fff";
    ctx.fillText(showPercentages ? (d.p * 100).toFixed(2) + "%" : d.count, 45 + barLen, y);
  });
}

export function findRollStats(event) {
  playSoundForDie("stats");
  const times = parseInt(document.getElementById("stat-times").value) || 1;
  const sides = parseInt(document.getElementById("stat-sides").value) || 6;
  const mod = parseInt(document.getElementById("stat-mod").value) || 0;

  const btn = event.target;
  btn.classList.add("shake");
  setTimeout(() => btn.classList.remove("shake"), 400);

  const { mean, variance } = analyticStats(times, sides, mod);
  const summaryEl = document.getElementById("stats-summary");
  if (summaryEl) {
    summaryEl.textContent = `Expected: ${mean.toFixed(2)}    Variance: ${variance.toFixed(2)}`;
  }

  drawDistribution(times, sides, mod);
}
