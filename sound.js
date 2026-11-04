/* Hojari: a warm evening in Muscat. A soft drone and slow oud-like phrases in the Hijaz mode, all made live in the
   browser (no audio files). Off until the visitor asks for it; fades in and out gently. */
(function () {
  const btn = document.getElementById('sound');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!btn || !AC) { if (btn) btn.hidden = true; return; }

  const BASE = 146.83; /* D3 */
  const SCALE = [-12, -11, -8, -7, -5, -4, -2, 0, 1, 4, 5, 7, 8, 10, 12]; /* D Hijaz: D Eb F# G A Bb C */
  const hz = (semi) => BASE * Math.pow(2, semi / 12);
  let ctx = null, master = null, dry = null, verb = null, playing = false, timer = 0, drones = [], idx = 7;

  function makeVerb() {
    const len = Math.floor(ctx.sampleRate * 3.4), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
    const c = ctx.createConvolver(); c.buffer = buf; return c;
  }

  function drone(freq, gainV, type) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    o.type = type; o2.type = 'sine'; o.frequency.value = freq; o2.frequency.value = freq * 1.003;
    f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 0.6;
    lfo.frequency.value = 0.05 + Math.random() * 0.05; lfoG.gain.value = 220;
    lfo.connect(lfoG).connect(f.frequency);
    g.gain.value = gainV;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(dry); g.connect(verb);
    [o, o2, lfo].forEach((n) => n.start());
    drones.push(o, o2, lfo);
  }

  /* An oud-like pluck: a bright attack that darkens quickly, with a tiny slide into the note */
  function pluck(time, freq, vel) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o2.type = 'triangle';
    o.frequency.setValueAtTime(freq * 0.982, time); o.frequency.linearRampToValueAtTime(freq, time + 0.06);
    o2.frequency.setValueAtTime(freq * 2.004, time);
    f.type = 'lowpass'; f.Q.value = 5;
    f.frequency.setValueAtTime(Math.min(9000, freq * 9), time); f.frequency.exponentialRampToValueAtTime(freq * 1.4, time + 0.7);
    g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(vel, time + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, time + 2.4);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(dry); g.connect(verb);
    o.start(time); o2.start(time); o.stop(time + 2.5); o2.stop(time + 2.5);
  }

  /* Short phrases that wander step by step, now and then with the oud's quick double pluck */
  function phrase() {
    if (!playing) return;
    let t = ctx.currentTime + 0.08;
    const n = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      idx = Math.max(2, Math.min(SCALE.length - 1, idx + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
      const f = hz(SCALE[idx]), v = 0.06 + Math.random() * 0.05;
      pluck(t, f, v);
      if (Math.random() < 0.28) pluck(t + 0.11, f, v * 0.6);
      t += [0.32, 0.45, 0.6, 0.9][Math.floor(Math.random() * 4)];
    }
    if (Math.random() < 0.3) idx = 7;
    timer = setTimeout(phrase, (t - ctx.currentTime) * 1000 + 1600 + Math.random() * 2600);
  }

  function start() {
    ctx = ctx || new AC();
    ctx.resume();
    master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = 0.75; dry.connect(master);
    verb = makeVerb(); const wet = ctx.createGain(); wet.gain.value = 0.6; verb.connect(wet).connect(master);
    drone(hz(-24), 0.16, 'triangle');
    drone(hz(-17), 0.06, 'triangle');
    drone(hz(-12), 0.035, 'sine');
    master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 2.5);
    playing = true;
    timer = setTimeout(phrase, 1400);
  }

  function stop() {
    playing = false; clearTimeout(timer);
    const m = master, ds = drones; drones = [];
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
    m.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    setTimeout(() => { ds.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } }); m.disconnect(); }, 1400);
  }

  btn.addEventListener('click', () => {
    if (playing) stop(); else start();
    btn.setAttribute('aria-pressed', playing);
    btn.setAttribute('aria-label', playing ? 'Mute music' : 'Play music');
  });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (playing) ctx.resume();
  });
})();
