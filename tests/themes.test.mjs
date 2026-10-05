import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { THEMES, DEFAULT_THEME, THEME_COLORS } from "../js/settings.js";

const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

// --- read each theme's variables out of style.css ---
function themeVars(theme) {
  const selector = theme === DEFAULT_THEME ? "body,\nbody.theme-" + theme : "body.theme-" + theme;
  const start = css.indexOf(selector + " {");
  assert.ok(start >= 0, `no CSS block for theme "${theme}"`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));
  const vars = {};
  for (const m of body.matchAll(/^\s*--([a-z0-9-]+):\s*(.+);\s*$/gm)) vars[m[1]] = m[2];
  return vars;
}

// --- colour maths (WCAG 2.x contrast) ---
const hexToRgb = (h) => {
  h = h.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const blend = (fg, alpha, bg) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));

const hexes = (value) => [...value.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)].map((m) => hexToRgb(m[0]));
const rgbaOf = (value) => {
  const m = value.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  return m ? { rgb: [+m[1], +m[2], +m[3]], alpha: +m[4] } : null;
};

// Every colour a variable can show up as, over the page background if translucent.
function surfaces(vars, name) {
  const value = vars[name];
  const page = hexes(vars["page-bg"]);
  const rgba = rgbaOf(value);
  if (rgba && !value.startsWith("linear-gradient")) return page.map((p) => blend(rgba.rgb, rgba.alpha, p));
  const found = hexes(value);
  assert.ok(found.length > 0, `--${name} has no colour: ${value}`);
  return found;
}
const solid = (vars, name) => surfaces(vars, name);

const WHITE = [255, 255, 255];
const AA = 4.5;

function checkPairs(theme, vars, pairs) {
  for (const [label, fg, bgs, min] of pairs) {
    for (const bg of bgs) {
      const c = contrast(fg, bg);
      assert.ok(c >= min, `${theme}: ${label} contrast ${c.toFixed(2)} < ${min} (text ${fg}, background ${bg})`);
    }
  }
}

for (const theme of THEMES) {
  test(`${theme}: text is readable on every surface`, () => {
    const v = themeVars(theme);
    const fg = (name) => solid(v, name)[0];
    checkPairs(theme, v, [
      ["body text on page", fg("text"), surfaces(v, "page-bg"), AA],
      ["muted text on page", fg("muted"), surfaces(v, "page-bg"), AA],
      ["title on page", fg("heading"), surfaces(v, "page-bg"), 3],
      ["gear icon on page", fg("accent"), surfaces(v, "page-bg"), 3],
      ["text on panel", fg("text"), surfaces(v, "panel-bg"), AA],
      ["panel heading on panel", fg("summary"), surfaces(v, "panel-bg"), AA],
      ["field label on panel", fg("label"), surfaces(v, "panel-bg"), AA],
      ["input text on input", fg("input-text"), solid(v, "input-bg"), AA],
      ["text on results box", fg("text"), surfaces(v, "log-bg"), AA],
      ["white on result box", WHITE, solid(v, "result-bg"), AA],
      ["total on result box", fg("result-total"), solid(v, "result-bg"), AA],
      ["die chip", fg("chip-text"), solid(v, "chip-bg"), AA],
      ["button text on accent", fg("accent-text"), solid(v, "accent"), AA],
      ["button text on accent (dark end)", fg("accent-text"), solid(v, "accent-2"), AA],
      ["button text on accent (hover)", fg("accent-text"), solid(v, "accent-hover"), AA],
      ["Settings heading on dialog", fg("accent"), solid(v, "modal-bg"), AA],
      ["text on dialog", fg("text"), solid(v, "modal-bg"), AA],
      ["close button on dialog", fg("muted"), solid(v, "modal-bg"), 3],
      ["menu text", fg("text"), solid(v, "menu-bg"), AA],
      ["chart text", fg("chart-text"), solid(v, "chart-bg"), AA],
      ["chart bars", fg("chart-bar"), solid(v, "chart-bg"), 3],
      ["white on custom preset buttons", WHITE, solid(v, "preset-bg"), AA],
      ["white on custom preset buttons (hover)", WHITE, solid(v, "preset-hover"), AA],
      ["copied / undo message", fg("success-text"), page(v), AA],
    ]);
    function page(vars) {
      // The message sits on a fixed 25% green wash over the page.
      return surfaces(vars, "page-bg").map((p) => blend([22, 163, 74], 0.25, p));
    }
  });

  test(`${theme}: white text is readable on every die and action colour`, () => {
    const v = themeVars(theme);
    const dice = ["d3", "d4", "d6", "d8", "d10", "d12", "d20", "d100"];
    for (const die of dice) {
      assert.ok(v[`g-${die}`], `${theme} has no colour for ${die}`);
      const stops = hexes(v[`g-${die}`]);
      assert.equal(stops.length, 2);
      checkPairs(theme, v, [[`white on ${die}`, WHITE, stops, AA]]);
    }
  });

  test(`${theme}: each die has its own distinct colour`, () => {
    const v = themeVars(theme);
    const dice = ["d3", "d4", "d6", "d8", "d10", "d12", "d20", "d100"];
    const colours = dice.map((d) => hexes(v[`g-${d}`])[0]);
    for (let i = 0; i < dice.length; i++) {
      for (let j = i + 1; j < dice.length; j++) {
        const dist = Math.hypot(...colours[i].map((c, k) => c - colours[j][k]));
        assert.ok(dist >= 60, `${theme}: ${dice[i]} and ${dice[j]} are too similar (distance ${dist.toFixed(0)})`);
      }
    }
  });

  test(`${theme}: is wired into the selector and the phone toolbar colour`, () => {
    assert.ok(html.includes(`<option value="${theme}">`), `no option for ${theme}`);
    const v = themeVars(theme);
    assert.deepEqual(hexToRgb(THEME_COLORS[theme]), hexes(v["page-bg"])[0], `theme-color for ${theme} should match the page background`);
  });
}

test("the default theme is the first in the list and the page starts with it", () => {
  assert.equal(THEMES[0], DEFAULT_THEME);
  assert.ok(html.includes(`<body class="theme-${DEFAULT_THEME}">`));
});

test("every theme defines the same set of variables", () => {
  const keys = (t) => Object.keys(themeVars(t)).sort().join(",");
  const first = keys(THEMES[0]);
  for (const t of THEMES) assert.equal(keys(t), first, `${t} differs from ${THEMES[0]}`);
});
