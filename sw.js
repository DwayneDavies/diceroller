// Offline support. Network first, so a deployed update is picked up as soon
// as the player is online; the cache is only the fallback when the network
// is down or slow. Every file the app needs is listed so it works offline
// after a single visit (tests/pwa.test.mjs checks this list stays complete).
const CACHE = "diceroller-v1";
const APP_FILES = [
  "./",
  "index.html",
  "style.css",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "js/core.js",
  "js/dice.js",
  "js/history.js",
  "js/main.js",
  "js/presets.js",
  "js/pwa.js",
  "js/results-menu.js",
  "js/results.js",
  "js/settings.js",
  "js/sound.js",
  "js/stats.js",
  "js/storage.js",
  "js/version.js",
  "js/versus.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const timeout = new Promise((_, reject) => setTimeout(reject, 4000));
    const response = await Promise.race([fetch(request), timeout]);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === "navigate") return cache.match("index.html");
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});
