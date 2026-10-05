import { clampInt, LIMITS } from "./core.js";

// --- Settings persistence ---
// Storage can be unavailable (private mode, blocked site data) or hold
// corrupted values; either way the app should still load with defaults.
export function saveSetting(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
export function loadSetting(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// --- Custom presets ---
export const MAX_PRESET_NAME = 30;

// Saved presets come from the browser, so rebuild each one from clamped
// values and drop anything that isn't a usable preset.
export function loadPresets() {
  const saved = loadSetting("presets", []);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((p) => p && typeof p.name === "string" && p.name.trim())
    .map((p) => ({
      name: p.name.trim().slice(0, MAX_PRESET_NAME),
      times: clampInt(p.times, 1, ...LIMITS.times),
      sides: clampInt(p.sides, 6, ...LIMITS.sides),
      mod: clampInt(p.mod, 0, ...LIMITS.mod),
    }));
}
export function savePresets(presets) {
  saveSetting("presets", presets);
}
export function clearStoredPresets() {
  try {
    localStorage.removeItem("presets");
  } catch {}
}
