// Every sound is synthesized with the Web Audio API, so there are no audio files to ship.
// Each vibe is a function (ctx, out) that returns { tick(until), end() }.
// tick() schedules events up to a time. Live, a timer calls it. In tests, we call it once
// with an OfflineAudioContext and render, which lets us check levels without speakers.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const noiseCache = new WeakMap();
function noiseBuf(ctx, kind) {
  let cache = noiseCache.get(ctx);
  if (!cache) { cache = {}; noiseCache.set(ctx, cache); }
  if (cache[kind]) return cache[kind];
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === "brown") { last = (last + 0.02 * white) / 1.02; d[i] = last * 3.5; }
      else d[i] = white;
    }
  }
  cache[kind] = buf;
  return buf;
}

function reverb(ctx, secs, decay) {
  const len = Math.floor(ctx.sampleRate * secs);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const c = ctx.createConvolver();
  c.buffer = buf;
  return c;
}

// Owns a vibe's output gain and every looping source so end() can fade out and clean up.
function session(ctx, out, trim = 1) {
  const mix = ctx.createGain();
  mix.gain.value = trim; // per-vibe loudness match
  mix.connect(out);
  const sources = [];
  return {
    mix,
    loop(kind) {
      const s = ctx.createBufferSource();
      s.buffer = noiseBuf(ctx, kind);
      s.loop = true;
      s.start(0, Math.random() * 3);
      sources.push(s);
      return s;
    },
    osc(type, freq) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.start();
      sources.push(o);
      return o;
    },
    end() {
      const t = ctx.currentTime;
      mix.gain.cancelScheduledValues(t);
      mix.gain.setValueAtTime(mix.gain.value, t);
      mix.gain.linearRampToValueAtTime(0, t + 0.35);
      setTimeout(() => {
        sources.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } });
        mix.disconnect();
      }, 450);
    },
  };
}

// A short burst of noise, used for crackles, drops, hats and snares.
function burst(ctx, dest, t, { dur, gain, type = "highpass", freq = 3000, q = 0.7, kind = "white" }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf(ctx, kind);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const e = ctx.createGain();
  e.gain.setValueAtTime(gain, t);
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(e).connect(dest);
  src.start(t, Math.random() * 3, dur + 0.05);
}

/* ---------------- Lo-fi beat ---------------- */
const PROGRESSIONS = [
  [ // Dm9, G13, Cmaj9, Am9
    { notes: [53, 57, 60, 64], bass: 38, mel: [69, 72, 74, 76, 77] },
    { notes: [53, 59, 62, 64], bass: 43, mel: [67, 71, 74, 76, 79] },
    { notes: [52, 55, 59, 62], bass: 36, mel: [67, 71, 72, 74, 76] },
    { notes: [55, 59, 60, 64], bass: 45, mel: [69, 72, 74, 76, 79] },
  ],
  [ // Fmaj7, Em7, Dm9, Cmaj9
    { notes: [52, 57, 60, 64], bass: 41, mel: [69, 72, 74, 76, 79] },
    { notes: [55, 59, 62, 64], bass: 40, mel: [67, 71, 74, 76, 79] },
    { notes: [53, 57, 60, 64], bass: 38, mel: [69, 72, 74, 76, 77] },
    { notes: [52, 55, 59, 62], bass: 36, mel: [67, 71, 72, 74, 76] },
  ],
  [ // Am9, Dm9, G7sus, Cmaj7
    { notes: [55, 59, 60, 64], bass: 45, mel: [69, 72, 74, 76, 79] },
    { notes: [53, 57, 60, 64], bass: 38, mel: [69, 72, 74, 76, 77] },
    { notes: [53, 55, 59, 62], bass: 43, mel: [67, 71, 74, 76, 79] },
    { notes: [52, 55, 59, 60], bass: 36, mel: [67, 71, 72, 74, 76] },
  ],
];

function lofi(ctx, out) {
  const s = session(ctx, out, 1.6);
  const bpm = Math.round(rand(68, 78));
  const step = 60 / bpm / 4; // one 16th note
  const swing = 0.2;
  const prog = pick(PROGRESSIONS);

  // Keys go through a dull "tape" filter and a room reverb.
  const tape = ctx.createBiquadFilter();
  tape.type = "lowpass";
  tape.frequency.value = 2400;
  const keys = ctx.createGain();
  keys.connect(tape);
  const verb = reverb(ctx, 2.6, 2.6);
  const wet = ctx.createGain();
  wet.gain.value = 0.3;
  tape.connect(s.mix);
  tape.connect(verb);
  verb.connect(wet).connect(s.mix);

  const drums = ctx.createBiquadFilter();
  drums.type = "lowpass";
  drums.frequency.value = 7000;
  drums.connect(s.mix);

  // Slow pitch wobble, like an old tape machine.
  const wobble = s.osc("sine", 0.45);
  const wobbleAmt = ctx.createGain();
  wobbleAmt.gain.value = 7;
  wobble.connect(wobbleAmt);

  // Constant vinyl hiss.
  const hissF = ctx.createBiquadFilter();
  hissF.type = "highpass";
  hissF.frequency.value = 4500;
  const hissG = ctx.createGain();
  hissG.gain.value = 0.004;
  s.loop("white").connect(hissF).connect(hissG).connect(s.mix);

  // Electric piano: a sine plus two quick-fading overtones gives the bell-like tine.
  const tine = (midi, t, dur, vel) => {
    const f = mtof(midi);
    for (const [mult, g, d] of [[1, 1, dur], [2, 0.3, dur * 0.35], [4, 0.07, dur * 0.12]]) {
      const o = ctx.createOscillator();
      o.frequency.value = f * mult;
      wobbleAmt.connect(o.detune);
      const e = ctx.createGain();
      e.gain.setValueAtTime(0, t);
      e.gain.linearRampToValueAtTime(vel * g, t + 0.006);
      e.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(e).connect(keys);
      o.start(t);
      o.stop(t + d + 0.05);
    }
  };

  const bass = (midi, t, dur) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = mtof(midi);
    const e = ctx.createGain();
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(0.2, t + 0.02);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(e).connect(s.mix);
    o.start(t);
    o.stop(t + dur + 0.05);
  };

  const kick = (t, vel) => {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(135, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    const e = ctx.createGain();
    e.gain.setValueAtTime(vel, t);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(e).connect(drums);
    o.start(t);
    o.stop(t + 0.4);
  };

  const snare = (t, vel) => {
    burst(ctx, drums, t, { dur: 0.16, gain: vel * 0.35, type: "bandpass", freq: 1700, q: 0.8 });
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = 185;
    const e = ctx.createGain();
    e.gain.setValueAtTime(vel * 0.25, t);
    e.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(e).connect(drums);
    o.start(t);
    o.stop(t + 0.1);
  };

  let n = 0;
  let next = ctx.currentTime + 0.15;
  let nextPop = next;

  const tick = (until) => {
    while (next < until) {
      const i = n % 16;
      const bar = Math.floor(n / 16);
      const chord = prog[bar % prog.length];
      const t = next + (i % 2 ? swing * step : 0) + rand(-0.006, 0.006);

      if (i === 0) {
        chord.notes.forEach((m, k) => tine(m, t + k * 0.012, step * 14, 0.05));
        bass(chord.bass, t, step * 6);
      }
      if (i === 10 && Math.random() < 0.6) {
        chord.notes.slice(1).forEach((m, k) => tine(m, t + k * 0.01, step * 5, 0.032));
        bass(chord.bass, t, step * 3);
      }
      if (i === 0 || i === 7 || (i === 10 && Math.random() < 0.7) || (i === 13 && bar % 4 === 3 && Math.random() < 0.4)) {
        kick(t, i === 0 ? 0.6 : 0.42);
      }
      if (i === 4 || i === 12) snare(t, 0.9 + rand(-0.15, 0.1));
      if (i === 15 && Math.random() < 0.25) snare(t, 0.3);
      if (i % 2 === 0) burst(ctx, drums, t, { dur: 0.04, gain: rand(0.03, 0.07), freq: 7500 });
      if (i === 14 && Math.random() < 0.5) burst(ctx, drums, t, { dur: 0.18, gain: 0.05, freq: 7000 });
      if (i % 2 === 0 && bar % 4 !== 0 && Math.random() < 0.2) {
        tine(pick(chord.mel), t, step * rand(3, 6), 0.035);
      }
      n++;
      next += step;
    }
    // Random vinyl pops.
    while (nextPop < until) {
      nextPop += rand(0.06, 0.6);
      burst(ctx, s.mix, nextPop, { dur: rand(0.002, 0.006), gain: rand(0.01, 0.04), freq: 1500 });
    }
  };
  return { tick, end: s.end };
}

/* ---------------- Dreamy pads ---------------- */
function dreamy(ctx, out) {
  const s = session(ctx, out, 3);
  const verb = reverb(ctx, 5, 2);
  const wet = ctx.createGain();
  wet.gain.value = 0.7;
  verb.connect(wet).connect(s.mix);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  lp.connect(s.mix);
  lp.connect(verb);
  const lfo = s.osc("sine", 0.07);
  const lfoAmt = ctx.createGain();
  lfoAmt.gain.value = 300;
  lfo.connect(lfoAmt).connect(lp.frequency);

  const chords = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]];
  const bells = [76, 79, 81, 84, 88];
  const len = 9;
  let bar = 0;
  let next = ctx.currentTime + 0.1;
  let nextBell = next + 3;

  const pad = (midi, t, dur) => {
    for (const det of [-8, 8]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = mtof(midi);
      o.detune.value = det;
      const e = ctx.createGain();
      e.gain.setValueAtTime(0, t);
      e.gain.linearRampToValueAtTime(0.022, t + 3);
      e.gain.setValueAtTime(0.022, t + dur - 3);
      e.gain.linearRampToValueAtTime(0, t + dur + 1);
      o.connect(e).connect(lp);
      o.start(t);
      o.stop(t + dur + 1.1);
    }
  };

  const tick = (until) => {
    while (next < until) {
      const chord = chords[bar % chords.length];
      chord.forEach((m) => pad(m, next, len + 3));
      pad(chord[0] - 24, next, len + 3);
      bar++;
      next += len;
    }
    while (nextBell < until) {
      const o = ctx.createOscillator();
      o.frequency.value = mtof(pick(bells));
      const e = ctx.createGain();
      e.gain.setValueAtTime(0, nextBell);
      e.gain.linearRampToValueAtTime(0.035, nextBell + 0.01);
      e.gain.exponentialRampToValueAtTime(0.0001, nextBell + 3.5);
      o.connect(e);
      e.connect(verb);
      e.connect(s.mix);
      o.start(nextBell);
      o.stop(nextBell + 3.6);
      nextBell += rand(2.5, 7);
    }
  };
  return { tick, end: s.end };
}

/* ---------------- Rain ---------------- */
function rain(ctx, out) {
  const s = session(ctx, out);
  const bed = ctx.createBiquadFilter();
  bed.type = "bandpass";
  bed.frequency.value = 3200;
  bed.Q.value = 0.35;
  const bedG = ctx.createGain();
  bedG.gain.value = 0.28;
  s.loop("white").connect(bed).connect(bedG).connect(s.mix);
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 500;
  const lowG = ctx.createGain();
  lowG.gain.value = 0.35;
  s.loop("brown").connect(low).connect(lowG).connect(s.mix);

  let nextDrop = ctx.currentTime;
  let nextThunder = ctx.currentTime + rand(15, 40);
  const tick = (until) => {
    while (nextDrop < until) {
      nextDrop += -Math.log(1 - Math.random()) / 55; // about 55 drops a second
      burst(ctx, s.mix, nextDrop, { dur: rand(0.01, 0.03), gain: rand(0.02, 0.09), type: "bandpass", freq: rand(2500, 7500), q: 2 });
    }
    while (nextThunder < until) {
      const t = nextThunder;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf(ctx, "brown");
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 140;
      const e = ctx.createGain();
      e.gain.setValueAtTime(0, t);
      e.gain.linearRampToValueAtTime(0.9, t + 1.4);
      e.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      src.connect(f).connect(e).connect(s.mix);
      src.start(t, 0, 4);
      nextThunder += rand(30, 70);
    }
  };
  return { tick, end: s.end };
}

/* ---------------- Ocean ---------------- */
function ocean(ctx, out) {
  const s = session(ctx, out);
  const wave = (rate) => {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    const amp = ctx.createGain();
    amp.gain.value = 0.32;
    s.loop("brown").connect(lp).connect(amp).connect(s.mix);
    const lfo = s.osc("sine", rate);
    const fDepth = ctx.createGain();
    fDepth.gain.value = 500;
    const aDepth = ctx.createGain();
    aDepth.gain.value = 0.28;
    lfo.connect(fDepth).connect(lp.frequency);
    lfo.connect(aDepth).connect(amp.gain);
  };
  wave(0.085);
  wave(0.13);
  const foam = ctx.createBiquadFilter();
  foam.type = "highpass";
  foam.frequency.value = 2500;
  const foamG = ctx.createGain();
  foamG.gain.value = 0.02;
  s.loop("white").connect(foam).connect(foamG).connect(s.mix);
  return { tick() {}, end: s.end };
}

/* ---------------- Fireplace ---------------- */
function fire(ctx, out) {
  const s = session(ctx, out);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 800;
  const g = ctx.createGain();
  g.gain.value = 0.35;
  s.loop("brown").connect(lp).connect(g).connect(s.mix);
  let next = ctx.currentTime;
  const tick = (until) => {
    while (next < until) {
      next += rand(0.02, 0.35);
      const big = Math.random() < 0.08;
      burst(ctx, s.mix, next, { dur: big ? rand(0.02, 0.05) : rand(0.004, 0.02), gain: big ? rand(0.2, 0.4) : rand(0.03, 0.14), freq: rand(1200, 3500) });
    }
  };
  return { tick, end: s.end };
}

/* ---------------- Brown noise ---------------- */
function brown(ctx, out) {
  const s = session(ctx, out);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 650;
  const g = ctx.createGain();
  g.gain.value = 0.7;
  s.loop("brown").connect(lp).connect(g).connect(s.mix);
  return { tick() {}, end: s.end };
}

export const VIBES = { lofi, dreamy, rain, ocean, fire, brown };

/* ---------------- Master chain and live playback ---------------- */
let volume = 0.5;

export function buildMaster(ctx, vol = volume) {
  const gain = ctx.createGain();
  gain.gain.value = vol;
  const comp = ctx.createDynamicsCompressor(); // keeps loud bits from clipping
  comp.threshold.value = -14;
  comp.ratio.value = 6;
  comp.attack.value = 0.01;
  comp.release.value = 0.25;
  gain.connect(comp);
  comp.connect(ctx.destination);
  return { input: gain, gain };
}

let ctx = null;
let master = null;
let current = null;
let timer = null;

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = buildMaster(ctx);
  }
  if (ctx.state === "suspended") ctx.resume();
}

export function setVibe(name) {
  if (timer) { clearInterval(timer); timer = null; }
  if (current) { current.end(); current = null; }
  if (name === "off" || !VIBES[name]) return false;
  ensure();
  current = VIBES[name](ctx, master.input);
  const run = () => current && current.tick(ctx.currentTime + 0.7);
  run();
  timer = setInterval(run, 150);
  return true;
}

export function setVolume(v01) {
  volume = Math.min(1, Math.max(0, v01));
  if (master) master.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.03);
}

// Soft two-note chime when you gain aura.
export function blip(freq = 784) {
  try {
    ensure();
    const t = ctx.currentTime;
    [[freq, 0], [freq * 1.5, 0.07]].forEach(([f, d]) => {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const e = ctx.createGain();
      e.gain.setValueAtTime(0, t + d);
      e.gain.linearRampToValueAtTime(0.08, t + d + 0.01);
      e.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5);
      o.connect(e).connect(master.input);
      o.start(t + d);
      o.stop(t + d + 0.55);
    });
  } catch { /* audio not available, no big deal */ }
}
