// Tiny WebAudio synth: no audio files to download, works offline.
let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.28;
  master.connect(ctx.destination);
}

function tone({ freq = 440, type = 'sine', dur = 0.18, vol = 0.6, slide = 0, delay = 0 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.25, vol = 0.4, freq = 1200, q = 1, delay = 0 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = freq;
  filt.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filt).connect(gain).connect(master);
  src.start(t0);
}

export const sfx = {
  claw() { noise({ dur: 0.16, vol: 0.35, freq: 2600, q: 0.8 }); tone({ freq: 620, type: 'triangle', dur: 0.09, vol: 0.18, slide: -260 }); },
  hairball() { tone({ freq: 180, type: 'sawtooth', dur: 0.3, vol: 0.25, slide: 260 }); noise({ dur: 0.2, vol: 0.2, freq: 700 }); },
  boom() { noise({ dur: 0.45, vol: 0.5, freq: 260, q: 0.6 }); tone({ freq: 110, type: 'sine', dur: 0.35, vol: 0.35, slide: -60 }); },
  thunder() {
    noise({ dur: 0.6, vol: 0.55, freq: 3000, q: 0.4 });
    tone({ freq: 900, type: 'square', dur: 0.12, vol: 0.2, slide: -700 });
    tone({ freq: 70, type: 'sine', dur: 0.6, vol: 0.4, slide: -25, delay: 0.03 });
  },
  squeak() { tone({ freq: 900 + Math.random() * 500, type: 'square', dur: 0.09, vol: 0.13, slide: 500 }); },
  hurt() { tone({ freq: 300, type: 'sawtooth', dur: 0.28, vol: 0.3, slide: -180 }); },
  pickup() { [660, 880, 1320].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, vol: 0.25, delay: i * 0.07 })); },
  wave() { [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.22, delay: i * 0.1 })); },
  gameover() { [440, 370, 294, 220].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.4, vol: 0.22, delay: i * 0.18 })); },
  purr() { tone({ freq: 60, type: 'sawtooth', dur: 0.5, vol: 0.18, slide: 20 }); },
};
