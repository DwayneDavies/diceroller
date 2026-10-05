import { loadSetting } from "./storage.js";

const SOUND_IDS = {
  3: "sound-d3",
  4: "sound-d4",
  6: "sound-d6",
  8: "sound-d8",
  10: "sound-d10",
  12: "sound-d12",
  20: "sound-d20",
  100: "sound-d100",
  custom: "sound-custom",
  stats: "sound-custom",
};

export function playSoundForDie(sides) {
  if (!loadSetting("soundEnabled", true)) return;
  const sound = document.getElementById(SOUND_IDS[sides] || "sound-d6");
  if (!sound) return;
  sound.currentTime = 0;
  // Missing or unsupported files reject; a roll should never fail over sound.
  const playing = sound.play();
  if (playing) playing.catch(() => {});
}
