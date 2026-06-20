// 外部素材ゼロ。Web Audio で効果音を合成する。
let actx = null, master = null, muted = false;

function ensure() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  master = actx.createGain();
  master.gain.value = 0.2;
  master.connect(actx.destination);
}

function tone(freq, dur, type = 'sine', vol = 1, slide = 0) {
  if (!actx || muted) return;
  const t = actx.currentTime;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, vol = 1) {
  if (!actx || muted) return;
  const t = actx.currentTime, n = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = actx.createBufferSource(); s.buffer = buf;
  const g = actx.createGain(); g.gain.value = vol;
  const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100;
  s.connect(f).connect(g).connect(master);
  s.start();
}

export const Sound = {
  resume() { ensure(); if (actx.state === 'suspended') actx.resume(); },
  step()   { tone(rndr(140, 180), 0.06, 'triangle', 0.4, 0.8); },
  drink()  { tone(380, 0.18, 'sine', 0.7, 0.4); setTimeout(() => tone(220, 0.2, 'sine', 0.6, 0.4), 60); },
  water()  { tone(660, 0.12, 'sine', 0.5, 1.6); setTimeout(() => tone(990, 0.12, 'sine', 0.4, 1.4), 50); },
  hiccup() { tone(700, 0.05, 'square', 0.5, 2.2); },
  near()   { tone(1200, 0.08, 'sine', 0.4, 0.7); },
  crash()  { noise(0.45, 1); tone(80, 0.4, 'sawtooth', 0.8, 0.4); },
  splash() { noise(0.3, 0.7); tone(300, 0.3, 'sine', 0.5, 0.3); },
  toggle() { muted = !muted; return muted; },
};

function rndr(a, b) { return a + Math.random() * (b - a); }
