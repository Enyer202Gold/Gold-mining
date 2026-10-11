/* Gold Mining 2.0 — Visor 3D de máquinas (Three.js vía importmap CDN).
   Sin interacción táctil (no pelea con el scroll). Vaivén sinusoidal ±35° / 60 s
   alrededor del mejor ángulo frontal de cada máquina; nunca muestra la espalda.
   Piezas móviles independientes con pivotes calculados en runtime.
   Lazy init por tarjeta, pausa fuera de pantalla, respeta prefers-reduced-motion. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DEG = Math.PI / 180;
const SWAY_AMP = 35 * DEG;      // vaivén ±35°
const SWAY_PERIOD = 60;         // segundos por ciclo
const BG = 0x0a0805;            // fondo de tarjeta
const ELEV = 21 * DEG;          // elevación de cámara (ángulo hero)

/* baseRot: rotación Y del modelo para que su frente quede hacia la cámara (+Z).
   Verificado contra los pósters hero aprobados:
   P1 barrena en azimut 88.1° -> -48.7° | P2 barrenas en -92° -> +131.4° |
   P3/P4 ángulo hero del póster -> -50° */
const PLANS = {
  1: { baseRot: -48.7 * DEG, augers: [['tripo_part_13', 'tripo_part_7']], augerSpeed: 0.9 },
  2: { baseRot: 131.4 * DEG, augers: [['tripo_part_4'], ['tripo_part_6'], ['tripo_part_7'], ['tripo_part_9']], augerSpeed: 0.9 },
  3: { baseRot: -50 * DEG, belts: ['tripo_part_7', 'tripo_part_30'], beltSpeed: 0.04,
       shakers: ['tripo_part_0', 'tripo_part_8'], shakeAmp: 0.0012 },
  4: { baseRot: -50 * DEG, drum: 'tripo_part_8', drumAxis: [0.08, -0.47, 0.88], drumSpeed: 0.45,
       auger: ['tripo_part_17'], augerSpeed: 0.9,
       rollers: ['tripo_part_58', 'tripo_part_54', 'tripo_part_60', 'tripo_part_40'], rollerSpeed: 0.9 },
};

function findNode(root, name) {
  let found = null;
  root.traverse((o) => { if (!found && o.name === name) found = o; });
  return found;
}

/* Pivote vertical en el centro (x,z) del Box3 combinado; gira el pivot. */
function spinPivot(root, nodeNames, speed) {
  const nodes = nodeNames.map((n) => findNode(root, n)).filter(Boolean);
  if (!nodes.length) { console.warn('[mv] nodos no encontrados:', nodeNames); return null; }
  const box = new THREE.Box3();
  nodes.forEach((n) => box.expandByObject(n));
  const c = box.getCenter(new THREE.Vector3());
  const pivot = new THREE.Group();
  pivot.position.set(c.x, c.y, c.z);
  root.add(pivot);
  nodes.forEach((n) => pivot.attach(n));
  let a = 0;
  return (dt) => { a += speed * dt; pivot.rotation.y = a; };
}

/* Tambor inclinado: eje arbitrario por el CENTROIDE (no el centro del Box3). */
function drumPivot(root, nodeName, axisArr, speed) {
  const node = findNode(root, nodeName);
  if (!node) { console.warn('[mv] tambor no encontrado:', nodeName); return null; }
  node.updateWorldMatrix(true, false);
  const sum = new THREE.Vector3(); let count = 0;
  const v = new THREE.Vector3();
  node.traverse((o) => {
    if (o.isMesh) {
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); sum.add(v); count++; }
    }
  });
  if (!count) return null;
  const centroid = sum.multiplyScalar(1 / count);
  const pivot = new THREE.Group();
  pivot.position.copy(centroid);
  root.add(pivot);
  pivot.attach(node);
  const axis = new THREE.Vector3(axisArr[0], axisArr[1], axisArr[2]).normalize();
  const q = new THREE.Quaternion();
  let a = 0;
  return (dt) => { a += speed * dt; pivot.quaternion.copy(q.setFromAxisAngle(axis, a)); };
}

/* Rodillos: eje = dimensión más corta del bbox. */
function rollerPivots(root, names, speed) {
  const fns = [];
  names.forEach((nm) => {
    const node = findNode(root, nm);
    if (!node) { console.warn('[mv] rodillo no encontrado:', nm); return; }
    const box = new THREE.Box3().setFromObject(node);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    let ax = 0;
    if (size.y <= size.x && size.y <= size.z) ax = 1;
    else if (size.z <= size.x && size.z <= size.y) ax = 2;
    const pivot = new THREE.Group();
    pivot.position.copy(c);
    root.add(pivot);
    pivot.attach(node);
    const eul = ['x', 'y', 'z'][ax];
    let a = 0;
    fns.push((dt) => { a += speed * dt; pivot.rotation[eul] = a; });
  });
  return fns;
}

/* Cintas: desplazamiento de textura (offset). UVs horneadas: Wilfredo aprobó verlo así. */
function beltScroll(root, names, speed) {
  const texs = new Set();
  names.forEach((nm) => {
    const node = findNode(root, nm);
    if (!node) { console.warn('[mv] cinta no encontrada:', nm); return; }
    node.traverse((o) => {
      if (o.isMesh) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m && m.map) { m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; texs.add(m.map); }
        });
      }
    });
  });
  const arr = [...texs];
  if (!arr.length) return null;
  return (dt) => { arr.forEach((t) => { t.offset.x += speed * dt; }); };
}

/* Vibración sutil de la caja de cribado (~1-2 mm). */
function shakers(root, names, amp) {
  const items = [];
  names.forEach((nm) => {
    const node = findNode(root, nm);
    if (!node) { console.warn('[mv] criba no encontrada:', nm); return; }
    items.push({ node, base: node.position.clone(), ph: Math.random() * 6.283 });
  });
  if (!items.length) return null;
  return (dt, t) => {
    items.forEach((it) => {
      it.node.position.y = it.base.y + Math.sin(t * 2 * Math.PI * 9 + it.ph) * amp;
      it.node.position.x = it.base.x + Math.sin(t * 2 * Math.PI * 7.3 + it.ph * 1.7) * amp * 0.7;
    });
  };
}

function makeContactShadow(bbox) {
  const size = bbox.getSize(new THREE.Vector3());
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  const side = Math.max(size.x, size.z) * 1.7;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(side, side),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.003;
  return m;
}

const viewers = [];
let rafOn = false;
function ensureLoop() {
  if (rafOn) return;
  rafOn = true;
  const tick = () => {
    let anyVisible = false;
    for (const v of viewers) {
      if (v.visible && v.ready) { v.render(); anyVisible = true; }
    }
    if (anyVisible) requestAnimationFrame(tick);
    else rafOn = false;
  };
  tick();
}

async function initViewer(el) {
  const planNum = parseInt(el.dataset.plan, 10);
  const cfg = PLANS[planNum];
  if (!cfg) return null;
  const canvas = el.querySelector('canvas.mv-canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch (e) { console.warn('[mv] WebGL no disponible'); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.05, 200);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xfff1d6, 1.1);
  key.position.set(4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfd8ff, 0.4);
  rim.position.set(-5, 3, -4); scene.add(rim);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  let gltf;
  try {
    gltf = await loader.loadAsync(el.dataset.model);
  } catch (e) { console.warn('[mv] no se pudo cargar', el.dataset.model); return null; }

  const root = gltf.scene;
  const sway = new THREE.Group();
  sway.add(root);
  scene.add(sway);
  sway.rotation.y = 0;
  sway.updateMatrixWorld(true);

  /* Piezas móviles (medición con sway en 0, root en origen). */
  const anims = [];
  const push = (f) => { if (f) anims.push(f); };
  if (cfg.augers) cfg.augers.forEach((g) => push(spinPivot(root, g, cfg.augerSpeed)));
  if (cfg.belts) push(beltScroll(root, cfg.belts, cfg.beltSpeed));
  if (cfg.shakers) push(shakers(root, cfg.shakers, cfg.shakeAmp));
  if (cfg.drum) push(drumPivot(root, cfg.drum, cfg.drumAxis, cfg.drumSpeed));
  if (cfg.auger) push(spinPivot(root, cfg.auger, cfg.augerSpeed));
  if (cfg.rollers) rollerPivots(root, cfg.rollers, cfg.rollerSpeed).forEach(push);

  /* Asentar en el suelo + sombra de contacto (sin base visible). */
  const bbox = new THREE.Box3().setFromObject(root);
  root.position.y -= bbox.min.y;
  scene.add(makeContactShadow(bbox));

  /* Encuadre: esfera envolvente (invariante a la rotación del vaivén). */
  const sphere = bbox.getBoundingSphere(new THREE.Sphere());
  sphere.center.y += root.position.y;
  const dist = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(20))) * 1.12;
  camera.position.set(0, sphere.center.y + dist * Math.sin(ELEV), dist * Math.cos(ELEV));
  camera.lookAt(0, sphere.center.y, 0);

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let firstFrame = true;
  const api = {
    visible: false, ready: true, resize,
    render() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      sway.rotation.y = cfg.baseRot + SWAY_AMP * Math.sin((t * 2 * Math.PI) / SWAY_PERIOD);
      for (const f of anims) f(dt, t);
      renderer.render(scene, camera);
      if (firstFrame) { firstFrame = false; el.classList.add('mv-ready'); }
    },
  };
  viewers.push(api);
  return api;
}

function boot() {
  const els = document.querySelectorAll('[data-machine-viewer]');
  if (!els.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // póster quieto
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const el = en.target;
      if (en.isIntersecting) {
        if (!el._mv) {
          el._mv = { visible: true, ready: false };
          initViewer(el).then((api) => {
            if (api) { el._mv = api; api.visible = true; ensureLoop(); }
            else { el._mv = { visible: false, ready: false }; }
          });
        } else { el._mv.visible = true; ensureLoop(); }
      } else if (el._mv) { el._mv.visible = false; }
    });
  }, { rootMargin: '400px 0px' });
  els.forEach((el) => io.observe(el));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
