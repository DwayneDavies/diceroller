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
// Perceptual colour difference (CIE76 in Lab space).
function lab([r, g, b]) {
  const f = (c) => ((c /= 255) > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92);
  const [R, G, B] = [f(r), f(g), f(b)];
  const t = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  const x = t((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = t(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = t((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const deltaE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
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
      ["die chip", fg("chip-text"), solid(v, "chip-bg"), AA],
      ["action button text (Roll Custom, Roll Versus...)", fg("on-action"), solid(v, "g-action"), AA],
      ["action button text on hover", fg("on-action"), solid(v, "g-action-hover"), AA],
      ["Settings heading on dialog", fg("accent"), solid(v, "modal-bg"), AA],
      ["text on dialog", fg("text"), solid(v, "modal-bg"), AA],
      ["close button on dialog", fg("muted"), solid(v, "modal-bg"), 3],
      ["menu text", fg("text"), solid(v, "menu-bg"), AA],
      ["pinned bar label", fg("muted"), solid(v, "menu-bg"), AA],
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

  test(`${theme}: the theme's own text colour is readable on every die and action colour`, () => {
    const v = themeVars(theme);
    const dice = ["d3", "d4", "d6", "d8", "d10", "d12", "d20", "d100"];
    for (const die of dice) {
      assert.ok(v[`g-${die}`], `${theme} has no colour for ${die}`);
      const stops = hexes(v[`g-${die}`]);
      assert.equal(stops.length, 2);
      checkPairs(theme, v, [[`text on ${die}`, solid(v, "on-die")[0], stops, AA]]);
    }
  });

  test(`${theme}: each die has its own distinct colour`, () => {
    const v = themeVars(theme);
    const dice = ["d3", "d4", "d6", "d8", "d10", "d12", "d20", "d100"];
    const colours = dice.map((d) => hexes(v[`g-${d}`])[0]);
    for (let i = 0; i < dice.length; i++) {
      for (let j = i + 1; j < dice.length; j++) {
        const dist = deltaE(colours[i], colours[j]);
        assert.ok(dist >= 22, `${theme}: ${dice[i]} and ${dice[j]} look too alike (colour difference ${dist.toFixed(1)}, need 22)`);
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

test("each theme has its own die colours, not the same ones lightened or darkened", () => {
  const dice = ["d3", "d4", "d6", "d8", "d10", "d12", "d20", "d100"];
  for (let i = 0; i < THEMES.length; i++) {
    for (let j = i + 1; j < THEMES.length; j++) {
      const a = themeVars(THEMES[i]);
      const b = themeVars(THEMES[j]);
      const differing = dice.filter((d) => deltaE(hexes(a[`g-${d}`])[0], hexes(b[`g-${d}`])[0]) >= 15).length;
      assert.ok(differing >= 6, `${THEMES[i]} and ${THEMES[j]} share too many die colours (only ${differing} of 8 differ)`);
    }
  }
});

test("each theme's action buttons have their own colour, apart from the dice", () => {
  const dice = ["d3", "d4", "d6", "d8", "d10", "d12", "d20", "d100"];
  const actions = THEMES.map((t) => hexes(themeVars(t)["g-action"])[0]);
  for (let i = 0; i < THEMES.length; i++) {
    for (let j = i + 1; j < THEMES.length; j++) {
      assert.ok(deltaE(actions[i], actions[j]) >= 22, `${THEMES[i]} and ${THEMES[j]} have near-identical action buttons`);
    }
    const v = themeVars(THEMES[i]);
    for (const d of dice) {
      assert.ok(deltaE(actions[i], hexes(v[`g-${d}`])[0]) >= 15, `${THEMES[i]}: action button is too close to ${d}`);
    }
  }
});
