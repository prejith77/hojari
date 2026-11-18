/* Homepage hero: one tear of Hojari frankincense. Milky, pale resin with a dusty bloom, a slow ember
   breathing in its core and a thin wisp of smoke from the tip. As the visitor scrolls, fine grains lift off
   its lower half and drift away. Desktop only (1000px and wider); reduced motion gets one still frame. */
(function () {
  const canvas = document.querySelector('.hx-tear');
  if (!canvas || !matchMedia('(min-width: 1000px)').matches) return;
  const s = document.createElement('script');
  s.src = 'vendor/three.min.js';
  s.onload = () => run(canvas);
  document.head.appendChild(s);
})();

function run(canvas) {
  const params = new URLSearchParams();
  const RECORD = params.has('record');
  const STATIC = !RECORD && (params.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches);
  const SOLID = params.get('bg') === 'ink';
  const INK = [0x17 / 255, 0x12 / 255, 0x0c / 255];   // --ink
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !SOLID, premultipliedAlpha: true, preserveDrawingBuffer: RECORD || STATIC }); }
  catch (e) { return; }
  renderer.setPixelRatio(RECORD ? Number(params.get('pr') || 1) : Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, SOLID ? 1 : 0);
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  /* ---------- small deterministic noise ---------- */
  const hash3 = (x, y, z) => {
    let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    const l = (a, b, t) => a + (b - a) * t;
    const c = (i, j, k) => hash3(xi + i, yi + j, zi + k);
    return l(
      l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
      l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf), zf) * 2 - 1;
  }
  let seed = 23;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- the drop: a clean teardrop with a soft point, a round base and two gentle dents ---------- */
  const dents = [
    { d: new THREE.Vector3(0.62, 0.15, 0.77).normalize(), k: -0.05, w: 0.16 },
    { d: new THREE.Vector3(-0.72, -0.38, 0.58).normalize(), k: -0.04, w: 0.2 },
    { d: new THREE.Vector3(-0.2, 0.45, -0.85).normalize(), k: -0.03, w: 0.12 },
  ];
  const out = new THREE.Vector3();
  const FLAT = new THREE.Vector3(0.35, -0.1, -0.93).normalize();
  function shape(x, y, z, L) {
    /* (x, y, z) is a unit direction, L how far out along it (1 = the skin) */
    let r = 1 + 0.065 * vnoise(x * 1.1 + 2.0, y * 1.1, z * 1.1 - 1.0) + 0.028 * vnoise(x * 2.3 - 4.0, y * 2.3 + 3.0, z * 2.3) + 0.012 * vnoise(x * 4.5, y * 4.5 + 1.0, z * 4.5);
    /* one soft, flattened side, as if it had set against the bark */
    const fd = x * FLAT.x + y * FLAT.y + z * FLAT.z;
    if (fd > 0.45) r -= (fd - 0.45) * (fd - 0.45) * 0.7;
    for (const dn of dents) {
      const dx = x - dn.d.x, dy = y - dn.d.y, dz = z - dn.d.z;
      r += dn.k * Math.exp(-(dx * dx + dy * dy + dz * dz) / dn.w);
    }
    const th = Math.acos(Math.max(-1, Math.min(1, y)));
    const k = Math.pow(Math.sin(th / 2), 0.78);        // pinches the top into a soft point, leaves the base round
    const yy = Math.cos(th) * r * L;
    out.set(x * k * r * L * 1.12, yy * 1.36 - 0.06, z * k * r * L * 1.0);
    out.x += 0.05 * (yy + 1) * (yy + 1) * 0.25;           // a slight lean
    out.x *= 1 + 0.07 * x;                                // a little fuller on one side
    out.z *= 1 - 0.05 * yy;
    return out;
  }
  const geo = new THREE.SphereGeometry(1, 192, 160);
  const P = geo.attributes.position;
  const bloom = new Float32Array(P.count);
  const tip = new THREE.Vector3(0, -99, 0);
  for (let i = 0; i < P.count; i++) {
    const ux = P.getX(i), uy = P.getY(i), uz = P.getZ(i);
    /* powdery bloom collects in the hollows: the dents and the low spots of the noise */
    let hollow = Math.max(0, -vnoise(ux * 1.1 + 2.0, uy * 1.1, uz * 1.1 - 1.0)) * 1.6;
    for (const dn of dents) { const dx = ux - dn.d.x, dy = uy - dn.d.y, dz = uz - dn.d.z; hollow += Math.exp(-(dx * dx + dy * dy + dz * dz) / (dn.w * 0.6)); }
    bloom[i] = Math.min(1, hollow + Math.max(0, -uy - 0.55) * 1.2);
    const p = shape(ux, uy, uz, 1);
    P.setXYZ(i, p.x, p.y, p.z);
    if (p.y > tip.y) tip.copy(p);
  }
  geo.computeVertexNormals();
  geo.setAttribute('aBloom', new THREE.BufferAttribute(bloom, 1));

  const NOISE_GLSL = `
    float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
      return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
                 mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }`;

  const U = {
    uEmber: { value: 0 },
    uErode: { value: 0 },
    uCamObj: { value: new THREE.Vector3() },
  };
  const resin = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#e6e1d3'),
    roughness: 0.36, metalness: 0,
    transmission: 0.7, thickness: 1.3, ior: 1.5,
    attenuationColor: new THREE.Color('#e9e4cf'), attenuationDistance: 1.3,
    specularIntensity: 0.8, specularColor: new THREE.Color('#fff8ee'),
    sheen: 0.22, sheenRoughness: 0.8, sheenColor: new THREE.Color('#efe9dc'),
    envMapIntensity: 0.9,
  });
  resin.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj; varying vec3 vObjN; uniform float uErode; attribute float aBloom; varying float vDust;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vObj = position; vObjN = normal; vDust = aBloom;
        /* as the grains leave, the lower half wears down a little: the drop stays whole */
        float wear = uErode * smoothstep(0.15, -1.3, position.y);
        transformed.xz *= 1.0 - 0.07 * wear;
        transformed.y += 0.05 * wear * smoothstep(-0.4, -1.4, position.y);`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vObj; varying vec3 vObjN; uniform float uEmber, uErode; uniform vec3 uCamObj;
        varying float vDust;
        ${NOISE_GLSL}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        /* clear above, a light frost only near the base, a little more where it has worn */
        float baseF = smoothstep(-0.35, -1.25, vObj.y) * (0.55 + 0.45 * n3(vObj * 7.0));
        float wearF = uErode * smoothstep(0.15, -1.3, vObj.y);
        float powder = clamp(vDust * (0.55 + 0.6 * n3(vObj * 11.0)) + baseF * 0.35, 0.0, 1.0);
        roughnessFactor = clamp(roughnessFactor + baseF * 0.1 + powder * 0.1 + wearF * 0.08, 0.2, 0.5);`)
      .replace('#include <color_fragment>', `#include <color_fragment>`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 fp = vObj * 34.0;
        vec3 jitter = vec3(n3(fp), n3(fp + 17.3), n3(fp + 41.7)) - 0.5;
        vec3 jitter2 = vec3(n3(fp * 2.6 + 5.0), n3(fp * 2.6 + 9.1), n3(fp * 2.6 + 3.3)) - 0.5;
        normal = normalize(normal + jitter * (0.06 + baseF * 0.1 + wearF * 0.08) + jitter2 * 0.04);
        float facing = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);
        float cloud = n3(vObj * 2.3 + 4.0) * 0.65 + n3(vObj * 5.1) * 0.35;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        /* ember: a low glow from the core, strongest where the resin is thickest */
        totalEmissiveRadiance += vec3(0.9, 0.42, 0.1) * uEmber * pow(facing, 2.2) * (0.7 + 0.6 * cloud);
        /* light scattered through the thin edges from the warm glow behind: the stone-like translucency */
        float thin = pow(1.0 - facing, 2.2);
        totalEmissiveRadiance += mix(vec3(0.78, 0.8, 0.68), vec3(0.95, 0.78, 0.5), 0.55) * thin * (0.22 + 0.1 * cloud) * (1.0 - powder * 0.5);
        /* soft clouding inside: low-contrast density, no shapes */
        float milk = n3(vObj * 3.1 + 7.0) * 0.6 + n3(vObj * 7.3) * 0.4;
        diffuseColor.rgb *= 0.9 + 0.16 * milk;
        totalEmissiveRadiance += vec3(0.75, 0.66, 0.5) * 0.05 * smoothstep(0.45, 0.8, milk) * facing;
        /* the dusty bloom: a pale, matte powder sitting in the hollows */
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.95, 0.9), powder * 0.5);`)
      .replace('#include <transmission_fragment>', THREE.ShaderChunk.transmission_fragment
        .replace('material.transmission = transmission;', 'material.transmission = transmission * (1.0 - powder * 0.35);')
        .replace('material.thickness = thickness;', 'material.thickness = thickness * (0.15 + 1.4 * pow(facing, 1.6)) * (0.7 + 0.6 * cloud);')
        /* thick body milky cream, thin edges a faint green-silver */
        .replace('material.attenuationColor = attenuationColor;', 'material.attenuationColor = mix(vec3(0.62, 0.69, 0.56), attenuationColor, smoothstep(0.15, 0.75, facing));'))

  };
  const tear = new THREE.Mesh(geo, resin);
  const tilt = new THREE.Group(), spin = new THREE.Group();
  spin.add(tear); tilt.add(spin); scene.add(tilt);
  tear.rotation.z = -0.06;

  /* ---------- gold grains that lift off the lower half on scroll ---------- */
  const GRAINS = 3000;
  const gLocal = new Float32Array(GRAINS * 3), gNorm = new Float32Array(GRAINS * 3), gThr = new Float32Array(GRAINS);
  const gStart = new Float32Array(GRAINS * 3), gDir = new Float32Array(GRAINS * 3), gRel = new Float32Array(GRAINS).fill(-1), gSeed = new Float32Array(GRAINS);
  {
    let k = 0;
    while (k < GRAINS) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      if (u > 0.1) continue;
      const p = shape(s * Math.cos(a), u, s * Math.sin(a), 0.99);
      gLocal.set([p.x, p.y, p.z], k * 3);
      gNorm.set([s * Math.cos(a), u * 0.6, s * Math.sin(a)], k * 3);
      const low = (u + 1) / 1.1;                        // 0 at the base, 1 at mid height
      gThr[k] = 0.04 + 0.86 * (0.5 * low + 0.5 * rnd());
      /* up and to the right, spread wide */
      const ang = THREE.MathUtils.degToRad(60 + (rnd() - 0.5) * 70), el = (rnd() - 0.5) * 0.7;
      gDir.set([Math.cos(ang), Math.sin(ang), el], k * 3);
      gSeed[k] = rnd();
      k++;
    }
  }
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute('position', new THREE.BufferAttribute(gStart, 3));
  gGeo.setAttribute('aDir', new THREE.BufferAttribute(gDir, 3));
  gGeo.setAttribute('aRel', new THREE.BufferAttribute(gRel, 1));
  gGeo.setAttribute('aSeed', new THREE.BufferAttribute(gSeed, 1));
  const grainMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uScale: { value: 1 }, uReach: { value: 3.8 } },
    vertexShader: `
      attribute vec3 aDir; attribute float aRel, aSeed; uniform float uTime, uPR, uScale, uReach;
      varying float vA; varying float vS;
      void main(){
        float age = uTime - aRel;
        if (aRel < 0.0 || age < 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
        /* eases out as it goes, reaching about one and a half tear heights */
        float s = uReach * (0.55 + aSeed * 0.45) * (1.0 - exp(-age * 0.42));
        vec3 p = position + aDir * s;
        p += vec3(sin(age * 0.9 + aSeed * 40.0), cos(age * 0.7 + aSeed * 21.0), 0.0) * 0.04 * s;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        vA = smoothstep(0.0, 0.35, age) * (1.0 - smoothstep(0.35, 0.95, s / uReach + aSeed * 0.08));
        vS = aSeed;
        gl_PointSize = (0.9 + aSeed * aSeed * 1.7) * uPR * uScale;
      }`,
    fragmentShader: `
      varying float vA; varying float vS;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float m = exp(-dot(c, c) * 12.0);
        vec3 gold = mix(vec3(0.9, 0.8, 0.6), vec3(0.98, 0.95, 0.86), vS);
        float a = vA * m * 0.6;
        if (a < 0.003) discard;
        gl_FragColor = vec4(gold * a, a * 0.5);
      }`,
    transparent: true, depthWrite: false, toneMapped: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
  const grains = new THREE.Points(gGeo, grainMat);
  grains.frustumCulled = false;
  grains.renderOrder = 6;
  scene.add(grains);
  const gv = new THREE.Vector3();
  function updateGrains(progress, t) {
    let dirty = false;
    for (let k = 0; k < GRAINS; k++) {
      const on = progress > gThr[k];
      if (on && gRel[k] < 0) {
        gv.set(gLocal[k * 3], gLocal[k * 3 + 1], gLocal[k * 3 + 2]).applyMatrix4(tear.matrixWorld);
        gStart.set([gv.x, gv.y, gv.z], k * 3);
        gRel[k] = t; dirty = true;
      } else if (!on && gRel[k] >= 0 && t - gRel[k] > 4) {
        gRel[k] = -1; dirty = true;            // scrolled back up: the grain can lift off again later
      }
    }
    if (dirty) { gGeo.attributes.position.needsUpdate = true; gGeo.attributes.aRel.needsUpdate = true; }
  }

  /* ---------- light ---------- */
  const key = new THREE.DirectionalLight(0xfff0dc, 2.0);
  key.position.set(-3, 3.5, 4);
  scene.add(key);
  const rimL = new THREE.DirectionalLight(0xffd59a, 3.2);
  rimL.position.set(-4, 1.5, -3.5);
  scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xf2c27c, 2.6);
  rimR.position.set(4, 2.5, -3);
  scene.add(rimR);

  /* procedural studio: softboxes in a dark room, so the clear resin has something to reflect */
  function studio() {
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.BoxGeometry(20, 14, 20), new THREE.MeshBasicMaterial({ color: 0x0a0705, side: THREE.BackSide })));
    const box = (w, h, col, k, pos) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
    };
    box(6, 4, '#fff1dc', 5.0, [-6, 5, 6]);
    box(2, 9, '#ffd8a0', 4.0, [-8, 1, -5]);
    box(2, 9, '#f2c27c', 3.2, [8, 1, -4]);
    box(10, 3, '#e3ad5c', 1.2, [0, 6.8, 0]);
    box(12, 4, '#3a2412', 1.0, [0, -6.5, 2]);
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(env, 0.035);
    pm.dispose();
    return rt.texture;
  }
  scene.environment = studio();

  /* ---------- background: a faint honey glow behind the tear, on ink or on nothing ---------- */
  const COMMON_SHADER = `
    float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }`;
  const bgMat = new THREE.ShaderMaterial({
    uniforms: { uAspect: { value: 1 }, uCentre: { value: new THREE.Vector2(0.5, 0.42) }, uRad: { value: 0.3 }, uTime: { value: 0 },
      uSolid: { value: SOLID ? 1 : 0 }, uRT: { value: 0 }, uInk: { value: new THREE.Vector3(...INK) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uAspect, uRad, uTime, uSolid, uRT; uniform vec2 uCentre; uniform vec3 uInk;
      ${COMMON_SHADER}
      void main(){
        vec2 d = (vUv - uCentre) * vec2(uAspect, 1.0);
        float r = length(d) / uRad;
        vec3 ink = toLin(uInk);
        vec3 honey = toLin(vec3(0.89, 0.678, 0.361));
        vec3 amber = toLin(vec3(0.722, 0.4, 0.114));
        float core = exp(-r * r * 4.5);
        float halo = exp(-r * 0.95);
        vec3 glow = honey * core * 0.55 + amber * halo * 0.05;
        float vig = smoothstep(1.35, 0.25, length((vUv - 0.5) * vec2(uAspect, 1.0)));
        vec3 col = (ink + glow) * mix(mix(1.0, 0.62, uSolid), 1.0, vig);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
        if (uSolid < 0.5 && uRT < 0.5) {
          /* transparent canvas: keep only the glow, as premultiplied colour over whatever sits behind */
          vec3 inkD = uInk; vec3 c = gl_FragColor.rgb; vec3 tgt = vec3(0.89, 0.678, 0.361);
          float a = clamp(dot(c - inkD, vec3(0.3, 0.5, 0.2)) / dot(tgt - inkD, vec3(0.3, 0.5, 0.2)), 0.0, 1.0);
          gl_FragColor = vec4(tgt * a, a);
        } else if (uRT < 0.5) {
          gl_FragColor.rgb += (hash12(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 160.0;
        }
      }`,
    depthWrite: false, depthTest: false, toneMapped: false, blending: THREE.NoBlending,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false;
  bg.renderOrder = -10;
  /* the refraction pass always sees an opaque backdrop, so the resin never refracts empty space */
  bg.onBeforeRender = (r) => { bgMat.uniforms.uRT.value = r.getRenderTarget() ? 1 : 0; bgMat.uniformsNeedUpdate = true; };
  scene.add(bg);

  /* ---------- smoke: thin, laminar threads off the tip that break into slow curls ---------- */
  const SW = 3.4, SH = 5.2;
  const smokeMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uW: { value: SW }, uH: { value: SH } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime, uW, uH;
      ${COMMON_SHADER}
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 5; i++){ s += a * n2(p); p = m * p; a *= 0.5; } return s; }
      float mainPath(float y, float t){
        float grow = smoothstep(0.05, 2.6, y);
        return 0.03 * sin(y * 4.6 - t * 2.1) * smoothstep(0.0, 0.7, y)
             + 0.17 * sin(y * 1.55 - t * 0.78 + 0.6) * grow
             + 0.32 * sin(y * 0.72 - t * 0.34 + 2.0) * grow * grow;
      }
      float strand(vec2 p, float t, float ph, float sep, float w0){
        float y = p.y;
        /* twin threads wind round one shared path, drifting apart as they climb */
        float cx = mainPath(y, t) + sep * pow(y, 0.85) * sin(y * 2.9 - t * 1.25 + ph);
        float w = w0 + 0.16 * pow(y / uH, 1.2);
        float e = (p.x - cx) / w;
        return exp(-e * e) * (0.02 / (w + 0.012));
      }
      void main(){
        float t = uTime;
        vec2 p = vec2((vUv.x - 0.5) * uW, vUv.y * uH);
        /* curl-like domain warp, stronger the higher the smoke climbs, drifting upward with time */
        float hk = smoothstep(0.1, 2.0, p.y);
        vec2 q = p * vec2(1.3, 0.85) - vec2(0.0, t * 0.42);
        vec2 warp = vec2(fbm(q + vec2(1.7, 9.2)), fbm(q + vec2(8.3, 2.8))) - 0.5;
        vec2 q2 = p * 2.1 + warp * 1.5 - vec2(0.0, t * 0.55);
        vec2 warp2 = vec2(fbm(q2 + 4.1), fbm(q2 + 12.7)) - 0.5;
        vec2 pw = p + (warp * 1.05 + warp2 * 0.45) * hk * vec2(1.0, 0.5);
        float d = strand(pw, t, 0.0, 0.05, 0.008) * 1.0
                + strand(pw, t, 3.14159, 0.05, 0.007) * 0.7
                + strand(pw, t, 1.6, 0.11, 0.014) * 0.35;
        /* veils: higher up the threads tear into soft, patchy curls */
        float brk = smoothstep(0.32, 0.78, fbm(pw * vec2(2.6, 1.4) - vec2(0.0, t * 0.6)));
        d *= mix(1.0, brk * 1.4, smoothstep(0.5, 2.0, p.y));
        float fadeIn = smoothstep(0.0, 0.12, p.y);
        float fadeOut = 1.0 - smoothstep(uH * 0.5, uH * 0.98, p.y);
        float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
        d *= fadeIn * fadeOut * edge;
        vec3 grey = toLin(vec3(0.86, 0.82, 0.76));
        vec3 warm = toLin(vec3(0.95, 0.80, 0.58));
        vec3 col = mix(warm, grey, smoothstep(0.0, 1.6, p.y));
        float a = clamp(d * 0.55, 0.0, 0.65);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
        gl_FragColor = vec4(gl_FragColor.rgb * a, a);
      }`,
    transparent: true, depthWrite: false, toneMapped: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const smokeGeo = new THREE.PlaneGeometry(SW, SH);
  smokeGeo.translate(0, SH / 2, 0);
  const smoke = new THREE.Mesh(smokeGeo, smokeMat);
  smoke.renderOrder = 5;
  if (params.has('nosmoke')) smoke.visible = false;
  scene.add(smoke);

  /* ---------- light film grain (ink background only) ---------- */
  const grainScene = new THREE.Scene();
  const grainCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const filmMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform float uTime; ${COMMON_SHADER}
      void main(){ float g = hash12(gl_FragCoord.xy * 1.37 + floor(uTime * 24.0) * 17.0); gl_FragColor = vec4(vec3(g), 0.024); }`,
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
  });
  grainScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), filmMat));

  /* ---------- framing ---------- */
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight, aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    const needH = aspect < 1.2 ? Math.max(7.4, 4.4 / aspect) : Math.max(5.7, 3.6 / aspect);
    const focusY = aspect < 1.2 ? 1.25 : 0.55;
    const dist = needH / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, focusY, dist);
    camera.lookAt(0, focusY, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    bgMat.uniforms.uAspect.value = aspect;
    bgMat.uniforms.uRad.value = 1.75 / needH;
    grainMat.uniforms.uScale.value = Math.min(1.4, Math.max(0.8, h / 720 * 5.7 / needH));
    const s = new THREE.Vector3(0, -0.05, 0).project(camera);
    bgMat.uniforms.uCentre.value.set(0.5, s.y * 0.5 + 0.5);
  }

  /* ---------- input ---------- */
  const mouse = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; });
  let progressTarget = 0, progress = 0;

  const breath = (t) => Math.pow(0.5 - 0.5 * Math.cos(t * Math.PI * 2 / 5.2), 2);   // one slow breath every 5.2 s
  const tipWorld = new THREE.Vector3();
  function frame(t, dt) {
    if (RECORD) {
      /* a gentle, made-up cursor drift and a simulated scroll over the last few seconds */
      eased.x = 0.55 * Math.sin(t * 0.55 + 0.4) + 0.15 * Math.sin(t * 1.3);
      eased.y = 0.35 * Math.sin(t * 0.42 + 1.9);
      progress = smooth(6.3, 9.3, t);
    } else {
      progressTarget = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.75)));
      const k = 1 - Math.exp(-dt * 2.2);
      eased.x += (mouse.x - eased.x) * k; eased.y += (mouse.y - eased.y) * k;
      progress += (progressTarget - progress) * (1 - Math.exp(-dt * 4));
    }
    U.uEmber.value = 0.6 * breath(t);
    U.uErode.value = progress;
    spin.rotation.y = t * Math.PI * 2 / 20 + 0.6;
    tilt.rotation.z = -eased.x * 0.13;
    tilt.rotation.x = eased.y * 0.10;
    tilt.position.y = Math.sin(t * 0.9) * 0.025;
    tilt.updateMatrixWorld(true);
    U.uCamObj.value.copy(camera.position);
    tear.worldToLocal(U.uCamObj.value);
    updateGrains(progress, t);
    grainMat.uniforms.uTime.value = t;
    tipWorld.copy(tip).applyMatrix4(tear.matrixWorld);
    smoke.position.set(tipWorld.x, tipWorld.y - 0.02, tipWorld.z);
    smokeMat.uniforms.uTime.value = t + 4.0;
    bgMat.uniforms.uTime.value = t;
    filmMat.uniforms.uTime.value = t;
    renderer.clear();
    renderer.render(scene, camera);
    if (SOLID) renderer.render(grainScene, grainCam);
  }

  resize();
  const STILL_T = 2.6;   // at the top of a breath, with the smoke well formed
  addEventListener('resize', () => { resize(); if (STATIC) frame(STILL_T, 0); });
  if (STATIC) { frame(STILL_T, 0); return; }
  if (RECORD) { frame(Number(params.get('t') || 0), 1 / 30); return; }

  /* live: 30 fps cap, paused while the canvas is off screen or the tab is hidden */
  let visible = true, running = false, last = 0, clock = 0, raf = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = (now - last) / 1000;
    if (dt < 1 / 30 - 0.002) return;
    last = now;
    clock += Math.min(dt, 0.1);
    frame(clock, Math.min(dt, 0.1));
  };
  const start = () => { if (running || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}
