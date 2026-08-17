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
  place() { tone({ freq: 420, type: 'triangle', dur: 0.14, vol: 0.28, slide: 260 }); noise({ dur: 0.12, vol: 0.18, freq: 900 }); },
  deny() { tone({ freq: 220, type: 'square', dur: 0.14, vol: 0.2, slide: -90 }); },
  sell() { [660, 520, 400].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.12, vol: 0.2, delay: i * 0.06 })); },
  upgrade() { [523, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.18, vol: 0.24, delay: i * 0.07 })); },
  coin() { [880, 1320].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.1, vol: 0.16, delay: i * 0.06 })); },
  shoot(kind) {
    if (kind === 'archer') { noise({ dur: 0.09, vol: 0.16, freq: 2400, q: 1.2 }); }
    else if (kind === 'wizard') { tone({ freq: 520, type: 'sine', dur: 0.18, vol: 0.16, slide: 380 }); }
    else if (kind === 'frost') { tone({ freq: 1500, type: 'triangle', dur: 0.13, vol: 0.12, slide: 700 }); }
    else if (kind === 'ninja') { noise({ dur: 0.06, vol: 0.1, freq: 3600, q: 2 }); }
    else if (kind === 'sleepy') { tone({ freq: 320, type: 'sine', dur: 0.42, vol: 0.14, slide: -150 }); noise({ dur: 0.3, vol: 0.1, freq: 420, q: 0.7 }); }
    else { tone({ freq: 160, type: 'sawtooth', dur: 0.16, vol: 0.16, slide: 90 }); }
  },
  curse() {
    [392, 466, 554].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.26, vol: 0.16, slide: -60, delay: i * 0.05 }));
    noise({ dur: 0.4, vol: 0.14, freq: 700, q: 0.8 });
  },
  frog() { [180, 150].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.14, vol: 0.2, slide: -60, delay: i * 0.13 })); },
  stone() { tone({ freq: 90, type: 'square', dur: 0.5, vol: 0.26, slide: -30 }); noise({ dur: 0.5, vol: 0.24, freq: 300, q: 0.5 }); },
  doom() { [740, 554, 392, 262].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.26, vol: 0.22, delay: i * 0.08 })); },
  bow() {
    [1046, 1318, 1568].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.3, vol: 0.18, delay: i * 0.05 }));
    tone({ freq: 196, type: 'sine', dur: 0.5, vol: 0.16, slide: -40, delay: 0.1 });
  },
  boom() { noise({ dur: 0.4, vol: 0.42, freq: 260, q: 0.6 }); tone({ freq: 110, type: 'sine', dur: 0.32, vol: 0.3, slide: -60 }); },
  pop() { tone({ freq: 700 + Math.random() * 400, type: 'square', dur: 0.07, vol: 0.11, slide: -300 }); },
  squeak() { tone({ freq: 900 + Math.random() * 500, type: 'square', dur: 0.09, vol: 0.13, slide: 500 }); },
  leak() { tone({ freq: 300, type: 'sawtooth', dur: 0.34, vol: 0.3, slide: -190 }); noise({ dur: 0.3, vol: 0.2, freq: 400 }); },
  catnip() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.2, vol: 0.22, delay: i * 0.06 })); },
  wave() { [523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.2, vol: 0.2, delay: i * 0.09 })); },
  waveClear() { [784, 988, 1175, 1568].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.24, vol: 0.2, delay: i * 0.09 })); },
  howl() { tone({ freq: 260, type: 'sawtooth', dur: 0.7, vol: 0.26, slide: 120 }); tone({ freq: 190, type: 'square', dur: 0.6, vol: 0.16, slide: 90, delay: 0.05 }); },
  boss() {
    [110, 110, 146, 110].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.36, vol: 0.3, delay: i * 0.22 }));
    noise({ dur: 0.8, vol: 0.28, freq: 180, q: 0.5 });
  },
  bossDown() { [440, 330, 262, 196, 131].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.3, vol: 0.26, delay: i * 0.12 })); },
  victory() { [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.34, vol: 0.26, delay: i * 0.14 })); },
  gameover() { [440, 370, 294, 220].forEach((f, i) => tone({ freq: f, type: 'sawtooth', dur: 0.4, vol: 0.22, delay: i * 0.18 })); },
};
