// Partikel-Kugel mit „x“ im Hero: Three.js zeichnet, Motion animiert (Intro-Morph, Scroll).
import * as THREE from 'three';
import { animate, scroll } from 'motion';

const VERT = /* glsl */ `
  attribute vec3 aStart;
  attribute float aDelay;
  attribute float aSize;
  attribute float aMix;
  uniform float uProgress;
  uniform float uScatter;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uRim;
  varying float vAlpha;
  varying float vMix;
  void main() {
    float p = clamp((uProgress - aDelay * 0.45) / 0.55, 0.0, 1.0);
    p = p * p * (3.0 - 2.0 * p);
    vec3 pos = mix(aStart, position, p);
    pos += normalize(position + 0.0001) * uScatter * (0.6 + aDelay);
    pos += 0.012 * vec3(sin(uTime * 1.3 + aDelay * 40.0), cos(uTime * 1.1 + aDelay * 30.0), 0.0);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (3.2 / -mv.z);
    vec3 n = normalize(normalMatrix * normalize(position + 0.0001));
    float rim = mix(1.0, 0.25 + 0.75 * pow(1.0 - abs(n.z), 1.5), uRim);
    vAlpha = rim * (0.35 + 0.65 * p) * (1.0 - uScatter * 0.6);
    vMix = aMix;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vMix;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, d);
    gl_FragColor = vec4(mix(uColorA, uColorB, vMix), soft * vAlpha * uOpacity);
  }
`;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function randomInSphere(r: number) {
  const u = Math.random(), v = Math.random();
  const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
  const rr = r * Math.cbrt(Math.random());
  return [rr * Math.sin(ph) * Math.cos(th), rr * Math.sin(ph) * Math.sin(th), rr * Math.cos(ph)];
}

function buildPoints(targets: number[][], accentShare: number, sizeRange: [number, number], rim: boolean) {
  const n = targets.length;
  const pos = new Float32Array(n * 3), start = new Float32Array(n * 3);
  const delay = new Float32Array(n), size = new Float32Array(n), mixA = new Float32Array(n);
  targets.forEach((t, i) => {
    pos.set(t, i * 3);
    start.set(randomInSphere(5), i * 3);
    delay[i] = Math.random();
    size[i] = rand(sizeRange[0], sizeRange[1]);
    mixA[i] = Math.random() < accentShare ? 1 : 0;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aMix', new THREE.BufferAttribute(mixA, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uProgress: { value: 0 }, uScatter: { value: 0 }, uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uRim: { value: rim ? 1 : 0 }, uOpacity: { value: 1 },
      uColorA: { value: new THREE.Color() }, uColorB: { value: new THREE.Color() },
    },
  });
  return new THREE.Points(geo, mat);
}

function sphereTargets(count: number) {
  const out: number[][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const j = 1 + rand(-0.015, 0.015);
    out.push([Math.cos(th) * r * j, y * j, Math.sin(th) * r * j]);
  }
  return out;
}

function haloTargets(count: number) {
  return Array.from({ length: count }, () => {
    const [x, y, z] = randomInSphere(1);
    const len = Math.hypot(x, y, z) || 1;
    const r = rand(1.15, 1.9);
    return [(x / len) * r, (y / len) * r, (z / len) * r];
  });
}

// Zwei gekreuzte Balken: das „x“ aus dem Logo.
function xTargets(count: number) {
  const out: number[][] = [];
  for (let i = 0; i < count; i++) {
    const along = rand(-0.5, 0.5), across = rand(-0.08, 0.08);
    const a = i % 2 ? Math.PI / 4 : -Math.PI / 4;
    out.push([along * Math.cos(a) - across * Math.sin(a), along * Math.sin(a) + across * Math.cos(a), rand(-0.07, 0.07)]);
  }
  return out;
}

export function particleHero(canvas: HTMLCanvasElement) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 640;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0, 4.2);

  const sphere = buildPoints(sphereTargets(small ? 5000 : 11000), 0.18, [1.2, 2.6], true);
  const halo = buildPoints(haloTargets(small ? 900 : 2200), 0.25, [0.8, 1.8], false);
  const x = buildPoints(xTargets(small ? 2200 : 4500), 0.55, [1.2, 2.4], false);
  const shell = new THREE.Group();
  shell.add(sphere, halo);
  const rig = new THREE.Group();
  rig.add(shell, x);
  scene.add(rig);
  const layers = [sphere, halo, x];
  const uni = (m: THREE.Points) => (m.material as THREE.ShaderMaterial).uniforms;
  uni(halo).uOpacity.value = 0.45;

  // Farben aus den CSS-Tokens, damit Hell und Dunkel passen.
  function applyTheme() {
    const css = getComputedStyle(document.documentElement);
    const a = css.getPropertyValue('--particle').trim() || '#1d4ed8';
    const b = css.getPropertyValue('--particle-accent').trim() || '#60a5fa';
    const dark = css.getPropertyValue('--particle-blend').trim() === 'additive';
    for (const l of layers) {
      const m = l.material as THREE.ShaderMaterial;
      m.uniforms.uColorA.value.set(a);
      m.uniforms.uColorB.value.set(b);
      m.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      m.needsUpdate = true;
    }
  }
  applyTheme();
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', applyTheme);
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Auf schmalen Bildschirmen weiter weg, damit die Kugel ganz drauf passt.
    camera.position.z = w / h < 1 ? 4.2 / Math.max(w / h, 0.55) : 4.2;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Maus kippt die Kugel leicht.
  const target = { x: 0, y: 0 }, current = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
  };
  if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });

  const stops: (() => void)[] = [];
  if (reduced) {
    layers.forEach((l) => (uni(l).uProgress.value = 1));
  } else {
    // Intro: Partikel fliegen aus dem Raum zusammen (Motion).
    const morph = animate(0, 1, {
      duration: 2.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => layers.forEach((l) => (uni(l).uProgress.value = v)),
    });
    stops.push(() => morph.stop());
    // Beim Runterscrollen zerstreuen sich die Partikel (Motion scroll).
    stops.push(scroll((p: number) => layers.forEach((l) => (uni(l).uScatter.value = p * 1.4)), {
      target: canvas.closest('section') ?? canvas,
      offset: ['start start', 'end start'],
    }));
  }

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);

  const t0 = performance.now();
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    if (!reduced) {
      layers.forEach((l) => (uni(l).uTime.value = t));
      shell.rotation.y = t * 0.12;
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;
      rig.rotation.y = current.x;
      rig.rotation.x = current.y;
    }
    renderer.render(scene, camera);
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    stops.forEach((s) => s());
    window.removeEventListener('pointermove', onMove);
    mq.removeEventListener('change', applyTheme);
    themeObserver.disconnect();
    ro.disconnect();
    io.disconnect();
    layers.forEach((l) => { l.geometry.dispose(); (l.material as THREE.Material).dispose(); });
    renderer.dispose();
  };
}
