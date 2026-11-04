/* Hojari: one tear of Hojari frankincense, drawn in about 40,000 points of light.
   It gathers on load, leans toward the cursor, scatters where the cursor touches it and lets off smoke.
   It stays with you through the grades (changing colour from Shaabi to Hojari) and the grader
   (taking your website's grade), then lifts away into its own smoke.
   Desktop with motion only; phones, reduced motion and no-JS get the still posters. */
(function () {
  const canvas = document.querySelector('.tear-canvas');
  if (!canvas || typeof THREE === 'undefined') return;
  const posterMode = new URLSearchParams(location.search).has('poster');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = !matchMedia('(min-width: 900px)').matches && !posterMode;
  if (!posterMode && (reduce || innerHeight > (window.screen.height || innerHeight) * 1.6)) return;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: posterMode }); }
  catch (e) { return; }
  document.documentElement.classList.add('webgl');
  const PR = posterMode ? 1 : Math.min(devicePixelRatio, phone ? 1.25 : 1.5);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(0x000000, posterMode ? 1 : 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  const group = new THREE.Group();
  scene.add(group);

  /* Deterministic random, so every visit draws the same tear */
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* Lumps: a few overlapping waves make the surface knobbly, like real resin */
  const lump = (x, y, z) =>
    0.11 * Math.sin(3.1 * x + 1.3) * Math.sin(2.7 * y + 0.4) * Math.sin(3.3 * z + 2.1) +
    0.06 * Math.sin(6.3 * x + 4.9 * y + 0.7) * Math.cos(5.1 * z - 2.2 * y) +
    0.03 * Math.sin(13.0 * y + 7.0 * z + 11.0 * x);

  const pale = new THREE.Color('#e9ecd6'), honey = new THREE.Color('#e3ad5c'), amber = new THREE.Color('#b8661d');
  const SURFACE = phone ? 11000 : 34000, CORE = phone ? 2200 : 6000, N = SURFACE + CORE;
  const pos = new Float32Array(N * 3), start = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const size = new Float32Array(N), sd = new Float32Array(N);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    // uniform point on a sphere
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    let x = s * Math.cos(th), y = u, z = s * Math.sin(th);
    const L = lump(x, y, z);
    const core = i >= SURFACE;
    let r = 1 + L;
    r *= core ? Math.cbrt(rnd()) * 0.86 : 1 - Math.pow(rnd(), 3) * 0.22;
    x *= r; y *= r; z *= r;
    // drop shape: full at the bottom, drawn to a soft point at the top, leaning a little
    const t = (y + 1) / 2;
    const taper = 1 - 0.52 * Math.pow(Math.max(t, 0), 1.7);
    x = x * taper + 0.18 * t * t; z *= taper; y *= 1.28;
    pos.set([x * 1.15, y * 1.15, z * 1.15], i * 3);
    // gathers from a loose cloud
    const a = rnd() * Math.PI * 2, b = Math.acos(rnd() * 2 - 1), R = 4 + rnd() * 5;
    start.set([R * Math.sin(b) * Math.cos(a), R * Math.cos(b), R * Math.sin(b) * Math.sin(a) - 2], i * 3);
    // colour: pale milky resin on the knobs, honey in the hollows, amber deep inside
    if (core) c.copy(pale).lerp(honey, 0.55 + rnd() * 0.45).lerp(amber, rnd() * 0.4);
    else c.copy(pale).lerp(honey, Math.min(1, Math.max(0, 0.35 - L * 3.2 + (rnd() - 0.5) * 0.4)));
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = (core ? 3.2 + rnd() * 3.5 : 2.0 + rnd() * 2.8) * (phone ? 1.08 : 1);
    sd[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));

  const shared = { uTime: { value: 0 }, uIntro: { value: posterMode ? 1 : 0 }, uPR: { value: PR }, uLift: { value: 0 } };
  const tearMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uMouse: { value: new THREE.Vector2(99, 99) }, uPulse: { value: 0 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uTintAmt: { value: 0 }, uDim: { value: 1 }, uReach: { value: 0.85 }, uPt: { value: 1 }, uGather: { value: 0 } }, shared),
    vertexShader: `
      attribute vec3 aStart; attribute vec3 aColor; attribute float aSize; attribute float aSeed;
      uniform float uTime, uIntro, uPR, uLift, uPulse, uTintAmt, uDim, uReach, uPt, uGather; uniform vec2 uMouse; uniform vec3 uTint;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float k = clamp(uIntro * 1.45 - aSeed * 0.45, 0.0, 1.0);
        k = 1.0 - pow(1.0 - k, 3.0);
        vec3 p = mix(aStart, position, k);
        float gg = clamp(uGather * 1.35 - aSeed * 0.35, 0.0, 1.0);
        gg = gg * gg * (3.0 - 2.0 * gg);
        float ang = gg * (2.2 + aSeed * 2.0);
        vec3 haze = vec3(position.x * (1.6 + aSeed * 1.1), position.y * 0.25 - 1.1 - aSeed * 1.3, position.z * (1.6 + aSeed * 1.1));
        haze.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * haze.xz;
        p = mix(p, haze, gg);
        p += normalize(position) * (sin(uTime * 1.1 + aSeed * 40.0) * 0.012 + uPulse * (0.12 + aSeed * 0.45));
        vec4 w = modelMatrix * vec4(p, 1.0);
        vec2 d = w.xy - uMouse;
        float push = smoothstep(uReach, 0.0, length(d));
        w.xy += normalize(d + 1e-4) * push * 0.5 * uReach;
        w.z += push * 0.4 * uReach;
        w.y += push * 0.35 * uReach;
        w.y += uLift * (0.4 + aSeed * 2.6);
        w.x += uLift * sin(aSeed * 30.0 + w.y * 2.0) * 0.4;
        vec4 mv = viewMatrix * w;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPR * uPt * (9.0 / -mv.z);
        float l = dot(aColor, vec3(0.3, 0.5, 0.2));
        vColor = mix(aColor, uTint * (0.45 + 0.85 * l), uTintAmt);
        vAlpha = (1.0 - gg * 0.8) * uDim * (0.25 + 0.75 * k) * (0.8 + 0.2 * sin(uTime * 1.7 + aSeed * 70.0)) * (1.0 - uLift * (0.3 + aSeed * 0.7));
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, a * vAlpha * 0.9);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Points(geo, tearMat));

  /* The warm light the tear gives off, drawn behind it */
  const gc = document.createElement('canvas'); gc.width = gc.height = 256;
  const g2 = gc.getContext('2d'); const rg = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.35, 'rgba(255,255,255,0.45)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g2.fillStyle = rg; g2.fillRect(0, 0, 256, 256);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), color: new THREE.Color(0.17, 0.085, 0.017), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.set(7, 7.5, 1);
  scene.add(glow);

  /* Smoke: a thread that leaves the top of the tear and curls as it climbs */
  const SM = phone ? 700 : 2600;
  const sSeed = new Float32Array(SM), sRand = new Float32Array(SM * 3), sPos = new Float32Array(SM * 3);
  for (let i = 0; i < SM; i++) { sSeed[i] = rnd(); sRand.set([rnd(), rnd(), rnd() * 2 - 1], i * 3); }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('aSeed', new THREE.BufferAttribute(sSeed, 1));
  sGeo.setAttribute('aRand', new THREE.BufferAttribute(sRand, 3));
  const smokeMat = new THREE.ShaderMaterial({
    uniforms: Object.assign({ uOrigin: { value: new THREE.Vector3() }, uPuff: { value: 0 } }, shared),
    vertexShader: `
      attribute float aSeed; attribute vec3 aRand;
      uniform float uTime, uIntro, uPR, uLift, uPuff; uniform vec3 uOrigin;
      varying float vA;
      void main() {
        float life = fract(uTime * 0.045 * (0.6 + aRand.x * 0.7) + aSeed);
        float h = life * 4.4;
        float spread = 0.04 + life * (0.55 + uPuff * 0.35);
        vec3 p = uOrigin;
        p.y += h;
        p.x += sin(h * 1.25 + uTime * 0.22) * 0.38 * min(1.0, h) + aRand.z * spread + sin(h * 3.1 + aRand.y * 6.28) * 0.08 * life;
        p.z += cos(h * 0.9 + uTime * 0.17) * 0.25 * min(1.0, h) + (aRand.y - 0.5) * spread;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (3.0 + life * 30.0) * uPR * (9.0 / -mv.z);
        vA = smoothstep(0.0, 0.06, life) * (1.0 - life) * smoothstep(0.6, 1.0, uIntro) * (1.0 - uLift * 0.5) * (1.0 + uPuff * 1.8);
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(0.86, 0.83, 0.76, a * vA * 0.2);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(sGeo, smokeMat));

  /* Layout: the tear sits in the right of the hero; centred for the poster */
  let halfW = 4, halfH = 2.84;
  function layout() {
    const w = posterMode ? 1200 : canvas.clientWidth, h = posterMode ? 1200 : canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * 9; halfW = halfH * camera.aspect;
    const sc = posterMode ? 1.3 : Math.min(1, camera.aspect / 1.45);
    group.scale.setScalar(sc);
    group.position.set(posterMode ? -0.12 : halfW * 0.4, posterMode ? -0.6 : -0.25, 0);
    glow.position.set(group.position.x + 0.1 * sc, group.position.y - 0.1 * sc, -1.5);
    glow.scale.set((posterMode ? 5.2 : 7) * sc, (posterMode ? 5.6 : 7.5) * sc, 1);
    smokeMat.uniforms.uOrigin.value.set(group.position.x + 0.2 * sc, group.position.y + 1.55 * sc, 0);
  }
  layout();
  addEventListener('resize', layout);
  /* Phones: the tear sits on an anchor (the hero image, the grades stage, the grader result) and flies between them */
  const heroPoster = document.querySelector('.hero-poster');
  const anchors = [['hero', heroPoster], ['grades', document.querySelector('.grade-anchor')], ['grader', document.getElementById('grader-poster')]];
  const cur = { x: 0, y: 0, s: 0.5 };
  let shown = null, mode = 'idle', gather = 0, puff = 0, firstArrival = true;
  let pulse = 0, pulseV = 0;
  const kick = (v) => { pulseV += v; };
  function applyPlace() {
    group.scale.setScalar(cur.s);
    group.position.set(cur.x, cur.y, 0);
    glow.position.set(cur.x + 0.1 * cur.s, cur.y - 0.1 * cur.s, -1.5);
    glow.scale.set(6 * cur.s, 6.4 * cur.s, 1);
    smokeMat.uniforms.uOrigin.value.set(cur.x + 0.2 * cur.s, cur.y + 1.55 * cur.s, 0);
    tearMat.uniforms.uReach.value = 0.6 * cur.s;
    tearMat.uniforms.uPt.value = Math.min(1, Math.max(0.55, cur.s * 1.5));
  }
  function phoneState(dt) {
    const c = canvas.getBoundingClientRect(), perPx = (2 * halfH) / c.height;
    const seen = {};
    let bestName = null, bestScore = 0;
    for (const [name, el] of anchors) {
      if (!el) continue;
      if (name === 'grades' && !(gradesEl && gradesEl.classList.contains('is-live'))) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 10 || r.height < 10) continue;
      const vis = Math.min(r.bottom, c.height) - Math.max(r.top, 0);
      if (vis <= 0) continue;
      const score = vis / Math.min(r.height, c.height);
      seen[name] = [score, r];
      if (score > bestScore) { bestScore = score; bestName = name; }
    }
    /* Leave when the current spot is mostly off screen; only form somewhere new once it is well on screen */
    if (shown && seen[shown] && seen[shown][0] > 0.35 && (bestName === shown || bestScore < seen[shown][0] + 0.25)) bestName = shown;
    else if (bestName && bestScore < 0.6) bestName = null;

    if (mode === 'leaving') {
      lift = Math.min(1.25, lift + dt * 1.8);
      if (lift >= 1.25) { shown = null; mode = 'idle'; }
    } else if (bestName !== shown) {
      if (shown) mode = 'leaving';
      else if (bestName) {
        shown = bestName; lift = 0; mode = 'formed';
        if (!firstArrival) { gather = 1; kick(3.5); }
        firstArrival = false;
      }
    }
    if (shown && seen[shown]) {
      const r = seen[shown][1], sz = Math.min(r.width, r.height);
      const cx = r.left + r.width / 2 - c.left, cy = r.top + r.height / 2 + sz * 0.105 - c.top;
      cur.s = (0.67 * sz * perPx) / 2.94;
      cur.x = (cx / c.width * 2 - 1) * halfW;
      cur.y = -(cy / c.height * 2 - 1) * halfH;
    }
    visible = !!shown || lift < 1.2;
    let g = 3;
    if (shown === 'grades') g = +gradesEl.dataset.beat || 0;
    if (shown === 'grader') g = +graderEl.dataset.grade || 0;
    if (g !== gradeNow) { gradeNow = g; kick(3.5); }
    tintTo.set(...TINTS[g]); dimTo = DIMS[g]; glowTo.setRGB(...GLOWS[g]);
    applyPlace();
  }

  /* Cursor */
  const target = new THREE.Vector2(99, 99), mouse = new THREE.Vector2(99, 99), lean = new THREE.Vector2();
  const aim = (e) => {
    if (e.pointerType === 'touch') return;
    const c = canvas.getBoundingClientRect();
    const nx = ((e.clientX - c.left) / c.width) * 2 - 1, ny = -(((e.clientY - c.top) / c.height) * 2 - 1);
    target.set(nx * halfW, ny * halfH);
    lean.set(nx, ny);
  };
  addEventListener('pointermove', aim, { passive: true });
  document.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { target.set(99, 99); lean.set(0, 0); } });
  let letGo = 0;
  addEventListener('pointercancel', () => { target.set(99, 99); lean.set(0, 0); });
  /* Click or tap the hero and the tear bursts */
  const heroSec = document.getElementById('top');
  /* 'click' only fires for a real tap, never when a finger starts a scroll */
  if (heroSec) heroSec.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    kick(9); puff = 1; glow.material.color.multiplyScalar(2.4);
    dispatchEvent(new Event('tearburst'));
    if (phone || (e.pointerType && e.pointerType !== 'mouse')) {
      const c = canvas.getBoundingClientRect();
      const nx = ((e.clientX - c.left) / c.width) * 2 - 1, ny = -(((e.clientY - c.top) / c.height) * 2 - 1);
      mouse.set(nx * halfW, ny * halfH); target.copy(mouse);
      clearTimeout(letGo); letGo = setTimeout(() => { target.set(99, 99); lean.set(0, 0); }, 900);
    }
  });

  /* Where are we? The tear follows the hero, the grades scene and the grader */
  const heroEl = document.getElementById('top'), gradesEl = document.getElementById('grades'), graderEl = document.getElementById('grader');
  const TINTS = [[0.62, 0.2, 0.04, 1], [1, 0.52, 0.12, 0.9], [1, 0.84, 0.52, 0.55], [1, 1, 1, 0]];
  const DIMS = [0.32, 0.6, 0.85, 1];
  const GLOWS = [[0.12, 0.03, 0], [0.2, 0.08, 0.01], [0.18, 0.1, 0.03], [0.17, 0.085, 0.017]];
  let dimTo = 1; const glowTo = new THREE.Color(0.17, 0.085, 0.017);
  const tint = new THREE.Vector4(1, 1, 1, 0), tintTo = new THREE.Vector4();
  let gradeNow = 3, lift = 0, visible = true, frameDt = 0.016, lastNow = 0;
  function state() {
    const vh = innerHeight;
    if (phone) { phoneState(frameDt); return; }
    let g = 3;
    if (gradesEl) { const r = gradesEl.getBoundingClientRect(); if (r.top < vh * 0.5 && r.bottom > vh * 0.5) g = +gradesEl.dataset.beat || 0; }
    if (graderEl) {
      const r = graderEl.getBoundingClientRect();
      if (r.top < vh * 0.6 && r.bottom > vh * 0.3) g = +graderEl.dataset.grade || 0;
      lift = Math.min(1.25, Math.max(0, (vh * 0.6 - r.bottom) / (vh * 0.6)) * 1.25);
      visible = r.bottom > -vh * 0.2;
    }
    if (g !== gradeNow) { gradeNow = g; kick(3.5); }
    tintTo.set(...TINTS[g]); dimTo = DIMS[g]; glowTo.setRGB(...GLOWS[g]);
  }

  const t0 = performance.now();
  let rotX = 0, rotY = 0, first = true, wasVisible = true, lastW = 0, lastH = 0;
  function frame(now) {
    const t = posterMode ? 14 : (now - t0) / 1000;
    frameDt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016; lastNow = now;
    if (!posterMode) {
      if (canvas.clientWidth !== lastW || canvas.clientHeight !== lastH) { lastW = canvas.clientWidth; lastH = canvas.clientHeight; layout(); }
      state();
    }
    if (!visible && wasVisible && !posterMode) renderer.clear();
    wasVisible = visible;
    if (visible || posterMode) {
      shared.uTime.value = t;
      if (!posterMode) {
        shared.uIntro.value = Math.min(1, t / 2.6);
        if (phone) shared.uLift.value = lift;
        else if (lift < 0.3 && shared.uLift.value > 0.9) { shared.uLift.value = 0; gather = 1; kick(3.5); }
        else shared.uLift.value += (lift - shared.uLift.value) * 0.12;
        gather = Math.max(0, gather - frameDt / 1.15);
        tearMat.uniforms.uGather.value = gather;
        pulseV += (-55 * pulse - 6.5 * pulseV) * frameDt; pulse += pulseV * frameDt;
        tearMat.uniforms.uPulse.value = Math.max(-0.25, pulse);
        puff *= Math.exp(-frameDt * 1.4);
        smokeMat.uniforms.uPuff.value = puff;
        glow.material.opacity = Math.max(0, 1 - shared.uLift.value / 1.1) * (1 - gather * 0.7);
        mouse.lerp(target, target.x > 50 || mouse.x > 50 ? 1 : (phone ? 0.3 : 0.12));
        tint.lerp(tintTo, 0.06);
        tearMat.uniforms.uTint.value.set(tint.x, tint.y, tint.z);
        tearMat.uniforms.uTintAmt.value = tint.w;
        tearMat.uniforms.uDim.value += (dimTo - tearMat.uniforms.uDim.value) * 0.06;
        glow.material.color.lerp(glowTo, 0.06);
      }
      tearMat.uniforms.uMouse.value.copy(mouse);
      rotY += ((posterMode ? 0.5 : t * 0.12 + lean.x * 0.45) - rotY) * 0.06;
      rotX += ((posterMode ? 0 : -lean.y * 0.18) - rotX) * 0.06;
      if (posterMode) {
        rotY = 0.5; rotX = 0;
        const pg = parseInt(new URLSearchParams(location.search).get('poster'), 10);
        const g = Number.isNaN(pg) ? 3 : pg;
        tearMat.uniforms.uTint.value.set(TINTS[g][0], TINTS[g][1], TINTS[g][2]);
        tearMat.uniforms.uTintAmt.value = TINTS[g][3];
        tearMat.uniforms.uDim.value = DIMS[g];
        glow.material.color.setRGB(GLOWS[g][0], GLOWS[g][1], GLOWS[g][2]);
      }
      group.rotation.set(rotX, rotY, 0.08);
      renderer.render(scene, camera);
      if (first) { first = false; document.documentElement.classList.add('has-tear'); }
    }
    if (posterMode) { window.__tearReady = true; return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
