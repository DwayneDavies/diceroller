import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { VERSION } from "../js/version.js";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const exists = (p) => existsSync(new URL(`../${p}`, import.meta.url));

// The files sw.js pre-caches, read straight from its source.
const swFiles = [...read("sw.js").match(/const APP_FILES = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

test("footer version matches package.json", () => {
  assert.equal(VERSION, JSON.parse(read("package.json")).version);
  assert.match(VERSION, /^\d+\.\d+\.\d+/);
});

test("service worker caches every file the app needs, and each one exists", () => {
  for (const f of swFiles) {
    if (f !== "./") assert.ok(exists(f), `sw.js lists ${f} but it does not exist`);
  }
  const needed = [
    "index.html", "style.css", "manifest.webmanifest",
    ...readdirSync(new URL("../js/", import.meta.url)).map((f) => `js/${f}`),
    ...readdirSync(new URL("../icons/", import.meta.url)).map((f) => `icons/${f}`),
  ];
  for (const f of needed) assert.ok(swFiles.includes(f), `sw.js does not cache ${f}`);
});

test("manifest is valid and its icons exist", () => {
  const m = JSON.parse(read("manifest.webmanifest"));
  assert.ok(m.name && m.short_name && m.start_url && m.display === "standalone");
  assert.ok(m.icons.some((i) => i.sizes === "192x192"));
  assert.ok(m.icons.some((i) => i.sizes === "512x512"));
  assert.ok(m.icons.some((i) => i.purpose === "maskable"));
  for (const i of m.icons) assert.ok(exists(i.src), `manifest icon ${i.src} is missing`);
});

test("index.html links the manifest and icons that exist", () => {
  const html = read("index.html");
  for (const href of ["manifest.webmanifest", "icons/icon.svg", "icons/apple-touch-icon.png"]) {
    assert.ok(html.includes(`href="${href}"`), `index.html does not link ${href}`);
    assert.ok(exists(href));
  }
  assert.match(html, /<meta name="description"/);
  assert.match(html, /<meta name="theme-color"/);
});
