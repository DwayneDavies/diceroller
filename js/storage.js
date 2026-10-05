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
export function loadPresets() {
  const presets = loadSetting("presets", []);
  return Array.isArray(presets) ? presets : [];
}
export function savePresets(presets) {
  saveSetting("presets", presets);
}
export function clearStoredPresets() {
  try {
    localStorage.removeItem("presets");
  } catch {}
}
