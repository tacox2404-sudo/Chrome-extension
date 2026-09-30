// Everything is synthesized with the Web Audio API, so there are no audio files to ship.

let ctx = null;
let master = null;
let current = null; // { stop() }
let volume = 0.4;

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = volume * 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
}

function noiseBuffer(kind) {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === "brown") {
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    } else {
      d[i] = white;
    }
  }
  return buf;
}

function noiseLoop(kind, filterType, freq) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(kind);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  src.connect(f).connect(master);
  src.start();
  return { src, stop: () => src.stop() };
}

function startRain() {
  const a = noiseLoop("white", "lowpass", 4200);
  const b = noiseLoop("white", "highpass", 900);
  return { stop() { a.stop(); b.stop(); } };
}

function startBrown() {
  const a = noiseLoop("brown", "lowpass", 600);
  return { stop() { a.stop(); } };
}

// Slow jazzy chords plus a few random pentatonic notes through a lowpass, like a sleepy lo-fi beat.
function startLofi() {
  const chords = [
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [130.81, 196.0, 246.94, 329.63], // Cmaj7
    [196.0, 246.94, 293.66, 349.23], // G7
  ];
  const penta = [523.25, 587.33, 659.25, 783.99, 880.0];
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1400;
  lp.connect(master);
  const crackle = noiseLoop("white", "highpass", 6000);
  const cg = ctx.createGain();
  cg.gain.value = 0.02;
  crackle.src.disconnect();
  crackle.src.connect(cg).connect(master);

  const note = (freq, when, dur, gain, type = "triangle") => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(lp);
    o.start(when);
    o.stop(when + dur + 0.05);
  };

  const beat = 60 / 72;
  let bar = 0;
  const schedule = () => {
    const t = ctx.currentTime + 0.05;
    const chord = chords[bar % chords.length];
    chord.forEach((f, i) => note(f, t + i * 0.03, beat * 3.6, 0.09));
    note(chord[0] / 2, t, beat * 1.8, 0.16, "sine");
    for (let i = 0; i < 4; i++) {
      if (Math.random() < 0.55) note(penta[Math.floor(Math.random() * penta.length)], t + i * beat, beat * 1.2, 0.05, "sine");
    }
    bar++;
  };
  schedule();
  const timer = setInterval(schedule, beat * 4 * 1000);
  return { stop() { clearInterval(timer); crackle.stop(); lp.disconnect(); } };
}

const VIBES = { lofi: startLofi, rain: startRain, brown: startBrown };

export function setVibe(name) {
  if (current) { try { current.stop(); } catch { /* already stopped */ } current = null; }
  if (name === "off" || !VIBES[name]) return false;
  ensure();
  current = VIBES[name]();
  return true;
}

export function setVolume(v01) {
  volume = Math.min(1, Math.max(0, v01));
  if (master) master.gain.value = volume * 0.6;
}

// Little UI blip, e.g. when you gain aura.
export function blip(freq = 660) {
  try {
    ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * 2, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.connect(g).connect(master);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  } catch { /* audio not available, no big deal */ }
}
