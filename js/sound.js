import { loadSetting } from "./storage.js";

// Dice sounds are synthesized with Web Audio, so there are no audio files
// to ship. A roll is a few short noise "clicks" that get closer together and
// quieter, like a die bouncing to a stop.

// Small dice are light and clicky; big ones rattle longer and lower.
const VOICES = {
  3: { bounces: 3, pitch: 3800 },
  4: { bounces: 3, pitch: 3400 },
  6: { bounces: 4, pitch: 2800 },
  8: { bounces: 4, pitch: 2500 },
  10: { bounces: 5, pitch: 2200 },
  12: { bounces: 5, pitch: 2000 },
  20: { bounces: 6, pitch: 1700 },
  100: { bounces: 8, pitch: 1300 },
  custom: { bounces: 7, pitch: 2400 },
  stats: { bounces: 2, pitch: 3000 },
};

const noiseBuffers = new WeakMap();

function noiseFor(ac) {
  let buffer = noiseBuffers.get(ac);
  if (!buffer) {
    buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * 0.05), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ac, buffer);
  }
  return buffer;
}

function click(ac, destination, time, pitch, volume) {
  const src = ac.createBufferSource();
  src.buffer = noiseFor(ac);
  src.playbackRate.value = 0.8 + Math.random() * 0.4;

  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = pitch * (0.85 + Math.random() * 0.3);
  filter.Q.value = 3;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  src.connect(filter).connect(gain).connect(destination);
  src.start(time);
  src.stop(time + 0.05);
}

// Schedules one roll's rattle on any AudioContext (live or offline).
export function scheduleRattle(ac, destination, sides, startTime) {
  const voice = VOICES[sides] || VOICES[6];
  // Clicks can overlap and add up; a limiter keeps the sum from clipping.
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.05;
  limiter.connect(destination);
  let t = startTime;
  let gap = 0.09;
  // The bandpass filter passes less energy at lower pitches; compensate so
  // every die is about as loud.
  let volume = 2.6 * Math.sqrt(3000 / voice.pitch);
  for (let i = 0; i < voice.bounces; i++) {
    click(ac, limiter, t, voice.pitch, volume);
    t += gap * (0.7 + Math.random() * 0.6);
    gap *= 0.75;
    volume *= 0.7;
  }
  return t;
}

let liveContext = null;

function getContext() {
  if (!liveContext) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    liveContext = new AC();
  }
  // Browsers start audio suspended until a user gesture; rolls are clicks.
  if (liveContext.state === "suspended") liveContext.resume();
  return liveContext;
}

export function playSoundForDie(sides) {
  if (!loadSetting("soundEnabled", true)) return;
  try {
    const ac = getContext();
    if (ac) scheduleRattle(ac, ac.destination, sides, ac.currentTime + 0.01);
  } catch {
    // A roll should never fail over sound.
  }
}
