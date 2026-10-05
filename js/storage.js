// --- Settings persistence ---
export function saveSetting(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
export function loadSetting(key, defaultValue) {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaultValue;
}

// --- Custom presets ---
export function loadPresets() {
  return loadSetting("presets", []);
}
export function savePresets(presets) {
  saveSetting("presets", presets);
}
export function clearStoredPresets() {
  localStorage.removeItem("presets");
}
