import { Simulation, dist2D, DEFAULT_TUNING } from '../src/core/simulation.js';

// Chế độ "Dễ" (chỉ giao diện, tắt mặc định): thắp đèn với 5 đom đóm.
// Headless / Test Contract luôn dùng lantern_cost = 10 theo Ticket-02.
function easyModeOn() {
  return localStorage.getItem('dao_easy') === '1';
}
function getTuning() {
  const t = { ...DEFAULT_TUNING, score: { ...DEFAULT_TUNING.score } };
  if (easyModeOn()) t.lantern_cost = 5;
  return t;
}
window.setEasyMode = function (on) {
  localStorage.setItem('dao_easy', on ? '1' : '0');
  document.querySelectorAll('.easy-toggle').forEach((el) => (el.checked = on));
  window.restartCurrentNight();
};

// --- Web Audio Procedural Sound Effects ---
class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = parseFloat(localStorage.getItem('dao_vol') || '0.8');
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }
  setVolume(val) {
    this.volume = parseFloat(val);
    localStorage.setItem('dao_vol', this.volume);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
  playPickup() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }
  playDeposit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }
  playLanternLit() {
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.4);
    });
  }
  playPulse() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
  playDash() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
  playJump() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
  playHit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
  playCharm() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
}

const audio = new AudioManager();

// Global Game State
let currentNight = 1;
let totalCampaignScore = 0;
let mouseSensitivity = parseFloat(localStorage.getItem('dao_sens') || '0.5');

let sim = new Simulation({ seed: Date.now(), night: currentNight });

// Three.js Scene Setup
const canvas = document.getElementById('canvas3d');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1430);
scene.fog = new THREE.FogExp2(0x1b2350, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 800);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputEncoding = THREE.sRGBEncoding;

// ---- Visual-only helpers (không ảnh hưởng logic headless) ----
function makeGlowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const moteGlowTex = makeGlowTexture('rgba(255,246,194,1)', 'rgba(255,229,138,0.45)');
const lanternGlowTex = makeGlowTexture('rgba(255,233,176,1)', 'rgba(255,179,71,0.4)');

function glowSprite(tex, scale, opacity) {
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(scale, scale, 1);
  return s;
}

function makeCloudTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 30 + rnd() * 70;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(120,150,190,0.35)');
    grad.addColorStop(1, 'rgba(120,150,190,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  return t;
}

// Stars
const starsGeo = new THREE.BufferGeometry();
{
  const n = 1800;
  const pos = new Float32Array(n * 3);
  let s = 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(rnd() * 0.95 + 0.05);
    const r = 600;
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
}
const stars = new THREE.Points(
  starsGeo,
  new THREE.PointsMaterial({ color: 0xf5f1e6, size: 1.8, sizeAttenuation: false, fog: false })
);
scene.add(stars);

// Moon with halo
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(18, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0xf5f1e6, fog: false })
);
moon.position.set(-250, 260, -380);
scene.add(moon);
const moonHalo = glowSprite(makeGlowTexture('rgba(245,241,230,0.9)', 'rgba(165,184,208,0.3)'), 140, 0.7);
moonHalo.position.copy(moon.position);
scene.add(moonHalo);

// Drifting cloud layers
const cloudTex = makeCloudTexture();
const cloudLayers = [];
for (let i = 0; i < 3; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.35 - i * 0.08, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = -8 - i * 3;
  scene.add(m);
  cloudLayers.push(m);
}

// Ambient floating particles (dust / leaves) around the player
const PARTICLE_N = 140;
const partGeo = new THREE.BufferGeometry();
const partPos = new Float32Array(PARTICLE_N * 3);
for (let i = 0; i < PARTICLE_N; i++) {
  partPos[i * 3] = (Math.random() - 0.5) * 60;
  partPos[i * 3 + 1] = Math.random() * 14;
  partPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
}
partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
const particles = new THREE.Points(
  partGeo,
  new THREE.PointsMaterial({
    color: 0xffe58a, size: 0.18, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
);
scene.add(particles);

// Visual-only decoration (cây, đá) – tất định, không dùng RNG của simulation
function addDecor(night) {
  let s = 99 + night;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x24493f, roughness: 0.85 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5b5f6e, roughness: 0.95 });
  const centers = night === 2 ? [[0, 0, 28], [70, 0, 28]] : [[0, 0, night === 3 ? 45 : 40]];
  for (const [cx, cz, R] of centers) {
    const count = night === 2 ? 14 : 22;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rnd() * 0.2;
      const r = R - 1.5 - rnd() * 2.5;
      const x = cx + r * Math.cos(a);
      const z = cz + r * Math.sin(a);
      if (night === 2 && x > 24 && x < 46 && Math.abs(z) < 5) continue; // chừa cầu
      const g = new THREE.Group();
      if (rnd() > 0.35) {
        const h = 2.2 + rnd() * 1.6;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, h, 8), trunkMat);
        trunk.position.y = h / 2;
        const crown = new THREE.Mesh(new THREE.ConeGeometry(1.1 + rnd() * 0.5, 2.4, 8), leafMat);
        crown.position.y = h + 0.6;
        g.add(trunk, crown);
      } else {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + rnd() * 0.7, 0), rockMat);
        rock.position.y = 0.3;
        rock.scale.y = 0.7;
        g.add(rock);
      }
      g.position.set(x, 0, z);
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      islandGroup.add(g);
    }
  }
}

// Dynamic Ambient Light
const ambientLight = new THREE.AmbientLight(0x404560, 0.25);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xa5b8d0, 0.7);
moonLight.position.set(30, 80, 40);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
moonLight.shadow.camera.left = -45;
moonLight.shadow.camera.right = 45;
moonLight.shadow.camera.top = 45;
moonLight.shadow.camera.bottom = -45;
moonLight.shadow.camera.far = 200;
scene.add(moonLight);
scene.add(moonLight.target);

// Island Environment Group
let islandGroup = new THREE.Group();
scene.add(islandGroup);

function buildIsland3D(night) {
  // Clear previous meshes
  while (islandGroup.children.length > 0) {
    islandGroup.remove(islandGroup.children[0]);
  }

  // Sea of Clouds (Plane)
  const cloudGeo = new THREE.PlaneGeometry(800, 800, 32, 32);
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0x12384a,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.y = -12;
  islandGroup.add(clouds);
  addDecor(night);

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, roughness: 0.8 });
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xc9b48a, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.85 });

  if (night === 1) {
    // Đêm 1: Đảo Bến (r=40m)
    const islandGeo = new THREE.CylinderGeometry(40, 42, 6, 48);
    const islandMesh = new THREE.Mesh(islandGeo, grassMat);
    islandMesh.position.y = -3;
    islandMesh.receiveShadow = true;
    islandGroup.add(islandMesh);

    const rimGeo = new THREE.TorusGeometry(40.2, 0.6, 16, 64);
    const rimMesh = new THREE.Mesh(rimGeo, sandMat);
    rimMesh.rotation.x = Math.PI / 2;
    islandGroup.add(rimMesh);
  } else if (night === 2) {
    // Đêm 2: Đảo Cau (2 đảo r=28m, tâm (0,0,0) và (70,0,0) + cầu tre)
    [ [0, 0], [70, 0] ].forEach(([cx, cz]) => {
      const geo = new THREE.CylinderGeometry(28, 30, 6, 40);
      const mesh = new THREE.Mesh(geo, grassMat);
      mesh.position.set(cx, -3, cz);
      mesh.receiveShadow = true;
      islandGroup.add(mesh);

      const rimGeo = new THREE.TorusGeometry(28.2, 0.5, 16, 48);
      const rim = new THREE.Mesh(rimGeo, sandMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(cx, 0, cz);
      islandGroup.add(rim);
    });

    // Bamboo bridge: x in [26, 44], z in [-2, 2]
    const bridgeGeo = new THREE.BoxGeometry(18, 0.4, 4);
    const bridge = new THREE.Mesh(bridgeGeo, woodMat);
    bridge.position.set(35, -0.2, 0);
    islandGroup.add(bridge);

    // Jump pads (circles at (20, 0, 18) and (50, 0, -18))
    [ [20, 18], [50, -18] ].forEach(([px, pz]) => {
      const padGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.2, 24);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0xf2c14e,
        emissive: 0xffa500,
        emissiveIntensity: 0.8,
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(px, 0.1, pz);
      islandGroup.add(pad);
    });
  } else if (night === 3) {
    // Đêm 3: Đảo Chuông (3 tầng r=45, r=24, r=8)
    // Tier 0 (r=45, Y=0)
    const t0Geo = new THREE.CylinderGeometry(45, 47, 6, 48);
    const t0 = new THREE.Mesh(t0Geo, grassMat);
    t0.position.y = -3;
    islandGroup.add(t0);

    // Tier 1 (r=12-24, Y=3, z>0)
    const t1Geo = new THREE.CylinderGeometry(24, 24, 3, 32, 1, false, 0, Math.PI);
    const t1 = new THREE.Mesh(t1Geo, grassMat);
    t1.position.set(0, 1.5, 0);
    islandGroup.add(t1);

    // Tier 2 (r=8, Y=6)
    const t2Geo = new THREE.CylinderGeometry(8, 8, 6, 24);
    const t2 = new THREE.Mesh(t2Geo, sandMat);
    t2.position.set(0, 3, 0);
    islandGroup.add(t2);

    // Tháp chuông cao 8m ở tâm Tier 2 (tâm Y=6..14)
    const towerGeo = new THREE.CylinderGeometry(2, 2.2, 8, 16);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x5b5f6e, roughness: 0.7 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 10, 0);
    islandGroup.add(tower);

    // Bell (bronze)
    const bellGeo = new THREE.ConeGeometry(1.2, 2.2, 12);
    const bellMat = new THREE.MeshStandardMaterial({
      color: 0x8a6d3b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.set(0, 9.5, 0);
    islandGroup.add(bell);

    // Jump pad at (0, 3, 13)
    const padGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.2, 24);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xf2c14e,
      emissive: 0xffa500,
      emissiveIntensity: 0.8,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 3.1, 13);
    islandGroup.add(pad);
  }
}

// Player 3D Mesh: Mây (Robes #E8E2D0, Red Scarf #C8102E, Nón lá)
const playerGroup = new THREE.Group();
function createPlayerMesh() {
  // Body (Robe #E8E2D0)
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.2, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  playerGroup.add(body);

  // Red Scarf (#C8102E)
  const scarfGeo = new THREE.TorusGeometry(0.36, 0.1, 8, 16);
  const scarfMat = new THREE.MeshStandardMaterial({ color: 0xc8102e });
  const scarf = new THREE.Mesh(scarfGeo, scarfMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.15;
  playerGroup.add(scarf);

  // Head
  const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf5cfab });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.35;
  playerGroup.add(head);

  // Nón Lá
  const hatGeo = new THREE.ConeGeometry(0.7, 0.35, 24);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.8 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 1.6;
  playerGroup.add(hat);

  // Small Lantern hanging on hat
  const lanternGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.22, 12);
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xffe9b0,
    emissiveIntensity: 0.8,
  });
  const smallLantern = new THREE.Mesh(lanternGeo, lanternMat);
  smallLantern.position.set(0.35, 1.35, 0.25);
  playerGroup.add(smallLantern);

  const pHalo = glowSprite(lanternGlowTex, 2.4, 0.9);
  pHalo.position.set(0.35, 1.35, 0.25);
  playerGroup.add(pHalo);
  playerGroup.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  const pLight = new THREE.PointLight(0xffb347, 1.2, 8);
  pLight.position.set(0.35, 1.35, 0.25);
  playerGroup.add(pLight);

  scene.add(playerGroup);
}
createPlayerMesh();

// Lanterns 3D representations
let lanternMeshes = [];
function rebuildLanterns() {
  for (const lm of lanternMeshes) {
    scene.remove(lm.group);
  }
  lanternMeshes = [];

  for (const lData of sim.lanterns) {
    const lGroup = new THREE.Group();
    lGroup.position.set(lData.pos[0], lData.pos[1], lData.pos[2]);

    // Pillar (#6B4A2F)
    const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 3.2, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.85 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 1.6;
    lGroup.add(pillar);

    // Box (#5B5F6E when unlit)
    const boxGeo = new THREE.BoxGeometry(1.2, 1.4, 1.2);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x5b5f6e,
      roughness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 3.6;
    lGroup.add(box);

    // Roof
    const roofGeo = new THREE.ConeGeometry(1.4, 0.6, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a2b2b });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.5;
    lGroup.add(roof);

    // Radiant Light
    const light = new THREE.PointLight(0xffb347, 0, 18);
    light.position.set(0, 3.6, 0);
    lGroup.add(light);

    // Safe zone circle (r=6.0m)
    const circleGeo = new THREE.RingGeometry(5.8, 6.0, 32);
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0xffb347,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.05;
    lGroup.add(circle);

    const halo = glowSprite(lanternGlowTex, 9, 0);
    halo.position.y = 3.6;
    lGroup.add(halo);
    lGroup.traverse((o) => { if (o.isMesh) o.castShadow = true; });

    scene.add(lGroup);
    lanternMeshes.push({
      id: lData.id,
      group: lGroup,
      boxMesh: box,
      light: light,
      circleMesh: circle,
      halo,
    });
  }
}

// Motes visual pool
let moteMeshes = [];
function updateMotesVisual() {
  while (moteMeshes.length < sim.motes.length) {
    const geo = new THREE.SphereGeometry(0.2, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff6c2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.add(glowSprite(moteGlowTex, 2.2, 0.9));
    scene.add(mesh);
    moteMeshes.push(mesh);
  }

  const time = Date.now() * 0.003;
  for (let i = 0; i < sim.motes.length; i++) {
    const mData = sim.motes[i];
    const mesh = moteMeshes[i];
    if (mData.active) {
      mesh.visible = true;
      mesh.position.set(mData.pos[0], mData.pos[1] + 0.7 + Math.sin(time + i) * 0.25, mData.pos[2]);
    } else {
      mesh.visible = false;
    }
  }
}

// Shades visual pool (#120A1A body, #7A3CFF border, #3A3450 stunned)
let shadeMeshes = [];
function updateShadesVisual() {
  while (shadeMeshes.length < sim.shades.length) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x120a1a,
      emissive: 0x7a3cff,
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    group.add(body);

    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xdd55ff });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 1.2, 0.55);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 1.2, 0.55);
    group.add(leftEye, rightEye);

    scene.add(group);
    shadeMeshes.push({ group, body, leftEye, rightEye });
  }

  for (let i = 0; i < sim.shades.length; i++) {
    const sData = sim.shades[i];
    const sm = shadeMeshes[i];
    sm.group.position.set(sData.pos[0], sData.pos[1], sData.pos[2]);
    sm.group.lookAt(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);

    if (sData.state === 'stunned') {
      sm.body.material.color.setHex(0x3a3450);
      sm.body.material.emissive.setHex(0x222233);
      sm.group.position.y = sData.pos[1] + Math.sin(Date.now() * 0.02) * 0.1;
    } else {
      sm.body.material.color.setHex(0x120a1a);
      sm.body.material.emissive.setHex(0x7a3cff);
    }
  }
}

// Drifters (Gió Lạc: Ribbon #8FA3B8)
let drifterMeshes = [];
function updateDriftersVisual() {
  while (drifterMeshes.length < sim.drifters.length) {
    const group = new THREE.Group();
    // Flowing ribbon
    const ribbonGeo = new THREE.CylinderGeometry(0.1, 0.4, 2.5, 12);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x8fa3b8,
      emissive: 0x5a7590,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.rotation.x = Math.PI / 2;
    group.add(ribbon);

    scene.add(group);
    drifterMeshes.push(group);
  }

  for (let i = 0; i < sim.drifters.length; i++) {
    const dData = sim.drifters[i];
    const dm = drifterMeshes[i];
    dm.position.set(dData.pos[0], dData.pos[1] + Math.sin(Date.now() * 0.005 + i) * 0.3, dData.pos[2]);
    dm.rotation.y += 0.03;
  }
}

// Wind Charms (Bùa Gió: #C8102E with gold #F2C14E)
let charmMeshes = [];
function updateCharmsVisual() {
  while (charmMeshes.length < sim.charms.length) {
    const group = new THREE.Group();

    // Red charm card
    const cardGeo = new THREE.BoxGeometry(0.8, 1.4, 0.05);
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0xc8102e,
      emissive: 0x8a0b20,
      emissiveIntensity: 0.6,
    });
    const card = new THREE.Mesh(cardGeo, cardMat);
    card.position.y = 1.0;
    group.add(card);

    // Gold rim
    const rimGeo = new THREE.BoxGeometry(0.84, 1.44, 0.03);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf2c14e });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 1.0;
    group.add(rim);

    scene.add(group);
    charmMeshes.push(group);
  }

  for (let i = 0; i < sim.charms.length; i++) {
    const cData = sim.charms[i];
    const cm = charmMeshes[i];
    cm.visible = cData.available;
    cm.position.set(cData.pos[0], cData.pos[1], cData.pos[2]);
    cm.rotation.y = Date.now() * 0.002;
  }
}

// Pulse Ring Effect
const pulseRingGeo = new THREE.RingGeometry(0.1, 0.5, 32);
const pulseRingMat = new THREE.MeshBasicMaterial({
  color: 0xffb347,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0,
});
const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
pulseRing.rotation.x = -Math.PI / 2;
pulseRing.position.y = 0.1;
scene.add(pulseRing);
let pulseAnim = 0;

function triggerPulseVisual() {
  pulseRing.position.set(playerGroup.position.x, playerGroup.position.y + 0.1, playerGroup.position.z);
  pulseAnim = 1.0;
}

// Input Handling
const keys = {};
let camYaw = 0;
let isMouseDown = false;
let mouseX = 0;

window.addEventListener('keydown', (e) => {
  audio.init();
  const k = e.key.toLowerCase();
  keys[k] = true;

  if (k === 'escape' || k === 'p') {
    window.togglePause();
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = false;
});

window.addEventListener('mousedown', (e) => {
  audio.init();
  isMouseDown = true;
  mouseX = e.clientX;
});
window.addEventListener('mouseup', () => (isMouseDown = false));
window.addEventListener('mousemove', (e) => {
  if (isMouseDown) {
    const dx = e.clientX - mouseX;
    camYaw -= dx * mouseSensitivity;
    mouseX = e.clientX;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI HUD References
const islandTitleEl = document.getElementById('island-title');
const flamesContainer = document.getElementById('flames-container');
const timeValEl = document.getElementById('time-val');
const timerCardEl = document.getElementById('timer-card');
const lanternsValEl = document.getElementById('lanterns-val');
const scoreValEl = document.getElementById('score-val');
const moteSlots = document.querySelectorAll('.mote-slot');
const cdDashEl = document.getElementById('cd-dash');
const cdPulseEl = document.getElementById('cd-pulse');
const charmBadge = document.getElementById('charm-badge');
const charmTimer = document.getElementById('charm-timer');
const windAlert = document.getElementById('wind-alert');
const interactPrompt = document.getElementById('interact-prompt');
const promptDeposit = document.getElementById('prompt-deposit');

const modalIntro = document.getElementById('modal-intro');
const introTitle = document.getElementById('intro-title');
const introStory = document.getElementById('intro-story');

const modalVictory = document.getElementById('modal-victory');
const victoryTitle = document.getElementById('victory-title');
const victoryStory = document.getElementById('victory-story');
const victoryScore = document.getElementById('victory-score');

const modalDefeat = document.getElementById('modal-defeat');
const modalPause = document.getElementById('modal-pause');

function updateHUD() {
  const titles = { 1: 'Đêm 1: Đảo Bến', 2: 'Đêm 2: Đảo Cau', 3: 'Đêm 3: Đảo Chuông' };
  islandTitleEl.textContent = titles[sim.night] || `Đêm ${sim.night}`;

  // Timer
  const min = Math.floor(sim.time_left_s / 60);
  const sec = Math.floor(sim.time_left_s % 60);
  timeValEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  if (sim.time_left_s <= 30) {
    timerCardEl.classList.add('urgent');
  } else {
    timerCardEl.classList.remove('urgent');
  }

  // Flames
  const flameIcons = flamesContainer.querySelectorAll('.flame-icon');
  for (let i = 0; i < 3; i++) {
    flameIcons[i].className = i < sim.player.flames ? 'flame-icon active' : 'flame-icon lost';
  }

  // Lanterns count
  const litCount = sim.lanterns.filter((l) => l.lit).length;
  lanternsValEl.textContent = `${litCount} / ${sim.lanterns.length}`;
  scoreValEl.textContent = sim.score + totalCampaignScore;

  // Dynamic ambient light according to formula: 0.15 + 0.55 * (litCount / totalCount)
  ambientLight.intensity = 0.15 + 0.55 * (litCount / Math.max(1, sim.lanterns.length));

  // Mote inventory bar (10 slots)
  for (let i = 0; i < 10; i++) {
    if (i < sim.player.carried) {
      moteSlots[i].classList.add('filled');
    } else {
      moteSlots[i].classList.remove('filled');
    }
  }

  // Cooldown overlays
  const dashRatio = Math.min(1.0, (sim.player.dash_cd_ticks / 90));
  cdDashEl.style.height = `${dashRatio * 100}%`;

  const pulseRatio = Math.min(1.0, (sim.player.pulse_cd_ticks / 180));
  cdPulseEl.style.height = `${pulseRatio * 100}%`;

  // Charm Active Banner
  if (sim.player.charm_ticks > 0) {
    charmBadge.style.display = 'flex';
    charmTimer.textContent = `${(sim.player.charm_ticks / 60).toFixed(1)}s`;
  } else {
    charmBadge.style.display = 'none';
  }

  // Wind Alert
  if (sim.wind.warning || sim.wind.active) {
    windAlert.style.display = 'block';
  } else {
    windAlert.style.display = 'none';
  }

  // Nearby unlit lantern prompt
  let nearLantern = null;
  for (const l of sim.lanterns) {
    if (!l.lit && dist2D(sim.player.pos, l.pos) <= 2.0) {
      nearLantern = l;
      break;
    }
  }
  if (nearLantern) {
    interactPrompt.style.display = 'block';
    promptDeposit.textContent = `${nearLantern.deposited}/${sim.tuning.lantern_cost || 10}`;
  } else {
    interactPrompt.style.display = 'none';
  }

  // Lantern lights & safe zone mesh visual
  for (const lData of sim.lanterns) {
    const meshObj = lanternMeshes.find((m) => m.id === lData.id);
    if (meshObj) {
      if (lData.lit) {
        meshObj.boxMesh.material.color.setHex(0xffb347);
        meshObj.boxMesh.material.emissive = new THREE.Color(0xffe9b0);
        meshObj.boxMesh.material.emissiveIntensity = 1.0;
        meshObj.light.intensity = 2.5;
        meshObj.circleMesh.material.opacity = 0.5;
        meshObj.halo.material.opacity = 0.85 + Math.sin(Date.now() * 0.004) * 0.1;
      } else {
        meshObj.boxMesh.material.color.setHex(0x5b5f6e);
        meshObj.boxMesh.material.emissiveIntensity = 0;
        meshObj.light.intensity = 0;
        meshObj.circleMesh.material.opacity = 0;
        meshObj.halo.material.opacity = 0;
      }
    }
  }

  // Modals for Victory / Defeat
  if (sim.state === 'won' && modalVictory.style.display !== 'flex') {
    modalVictory.style.display = 'flex';
    victoryScore.textContent = sim.score;
    if (sim.night === 3) {
      victoryTitle.textContent = 'CHIẾN THẮNG TRỌN VẸN — BÌNH MINH LÊN!';
      victoryStory.textContent = `Mây đã cứu lấy cả 3 hòn đảo giữa biển mây! Tổng điểm toàn bộ chiến dịch: ${sim.score + totalCampaignScore} điểm!`;
      document.getElementById('btn-next-night').textContent = 'Chơi Lại Từ Đầu';
    } else {
      victoryTitle.textContent = `CHIẾN THẮNG ${titles[sim.night].toUpperCase()}!`;
      victoryStory.textContent = 'Ánh sáng đã quay trở lại xua tan màn sương đen bao phủ hòn đảo!';
      document.getElementById('btn-next-night').textContent = 'Đêm Tiếp Theo ➔';
    }
  } else if (sim.state === 'lost' && modalDefeat.style.display !== 'flex') {
    modalDefeat.style.display = 'flex';
  }
}

// Global UI Action Functions
window.startNight = function () {
  modalIntro.style.display = 'none';
};

window.nextNight = function () {
  modalVictory.style.display = 'none';
  totalCampaignScore += sim.score;

  if (currentNight >= 3) {
    currentNight = 1;
    totalCampaignScore = 0;
  } else {
    currentNight++;
  }

  loadNight(currentNight);
};

window.restartCurrentNight = function () {
  modalDefeat.style.display = 'none';
  modalVictory.style.display = 'none';
  modalPause.style.display = 'none';
  loadNight(currentNight);
};

window.togglePause = function () {
  sim.setInput({ pause: true });
  sim.step();
  sim.setInput({ pause: false });

  if (sim.state === 'paused') {
    modalPause.style.display = 'flex';
  } else {
    modalPause.style.display = 'none';
  }
};

window.setVolume = function (val) {
  audio.setVolume(val);
};

window.setMouseSens = function (val) {
  mouseSensitivity = parseFloat(val);
  localStorage.setItem('dao_sens', mouseSensitivity);
};

function loadNight(night) {
  sim = new Simulation({ seed: Date.now(), night, tuning: getTuning() });
  document.querySelectorAll('.easy-toggle').forEach((el) => (el.checked = easyModeOn()));
  buildIsland3D(night);
  rebuildLanterns();

  // Show intro modal
  const stories = {
    1: '"Mây con, hãy mang ánh sáng đom đóm về thắp lại 5 ngọn Đèn Lồng Lớn trên Đảo Bến. Hãy cẩn trọng trước lũ Bóng Mực trong sương đen!" — Ông Đăng.',
    2: '"Đêm nay tại Đảo Cau, 2 hòn đảo nối với nhau bằng cầu tre mong manh. Con có thể dùng Bục Nhảy và Bùa Gió, nhưng hãy coi chừng loài Gió Lạc rình rập cướp đom đóm!" — Ông Đăng.',
    3: '"Thử thách cuối cùng tại Đảo Chuông với 3 tầng vách đá cao ngất và tháp chuông cổ. Hãy canh chừng những cơn gió mạnh và thắp sáng toàn bộ 7 ngọn đèn trước bình minh!" — Ông Đăng.',
  };
  const titles = { 1: 'ĐÊM 1 — ĐẢO BẾN', 2: 'ĐÊM 2 — ĐẢO CAU', 3: 'ĐÊM 3 — ĐẢO CHUÔNG' };

  introTitle.textContent = titles[night];
  introStory.textContent = stories[night];
  modalIntro.style.display = 'flex';
}

// Initial Map Build
buildIsland3D(1);
rebuildLanterns();
loadNight(1);

// Fixed 60Hz Loop
let lastTime = performance.now();
const tickInterval = 1000 / 60;
let accumulator = 0;

function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);

  const delta = currentTime - lastTime;
  lastTime = currentTime;
  accumulator += delta;

  // Read inputs from keyboard
  let mx = 0;
  let mz = 0;
  if (keys['w'] || keys['arrowup']) mz += 1;
  if (keys['s'] || keys['arrowdown']) mz -= 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;

  const interact = !!keys['e'];
  const pulse = !!keys['q'];
  const dash = !!keys['shift'] || !!keys['f'];
  const jump = !!keys[' '];

  while (accumulator >= tickInterval) {
    if (sim.state === 'playing') {
      sim.setInput({
        move: [mx, mz],
        cam_yaw_deg: camYaw,
        jump,
        dash,
        interact,
        pulse,
      });

      const events = sim.step();
      for (const ev of events) {
        if (ev.name === 'mote_picked') audio.playPickup();
        if (ev.name === 'deposit') audio.playDeposit();
        if (ev.name === 'lantern_lit') audio.playLanternLit();
        if (ev.name === 'pulse') {
          audio.playPulse();
          triggerPulseVisual();
        }
        if (ev.name === 'dash') audio.playDash();
        if (ev.name === 'charm_picked') audio.playCharm();
        if (ev.name === 'player_hit') audio.playHit();
      }
    }
    accumulator -= tickInterval;
  }

  // Visual sync for Player
  playerGroup.position.set(sim.player.pos[0], sim.player.pos[1], sim.player.pos[2]);

  if (mx !== 0 || mz !== 0) {
    const rad = (camYaw * Math.PI) / 180;
    const wx = mx * Math.cos(rad) + mz * Math.sin(rad);
    const wz = -mx * Math.sin(rad) + mz * Math.cos(rad);
    playerGroup.rotation.y = Math.atan2(wx, wz);
  }

  // Camera 3rd person follow
  const camDist = 7.5;
  const camHeight = 3.8;
  const radCam = (camYaw * Math.PI) / 180;
  const targetCamX = playerGroup.position.x - Math.sin(radCam) * camDist;
  const targetCamZ = playerGroup.position.z - Math.cos(radCam) * camDist;
  camera.position.x += (targetCamX - camera.position.x) * 0.1;
  camera.position.z += (targetCamZ - camera.position.z) * 0.1;
  camera.position.y += (playerGroup.position.y + camHeight - camera.position.y) * 0.1;
  camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);

  // Animate pulse ring
  if (pulseAnim > 0) {
    pulseAnim -= 0.04;
    const scale = (1.0 - pulseAnim) * 12 + 0.1;
    pulseRing.scale.set(scale, scale, 1);
    pulseRingMat.opacity = pulseAnim;
  } else {
    pulseRingMat.opacity = 0;
  }

  // Visual-only ambience
  const tNow = Date.now() * 0.001;
  stars.rotation.y = tNow * 0.002;
  cloudLayers.forEach((m, i) => {
    m.material.map.offset.x = tNow * 0.004 * (i + 1);
    m.material.map.offset.y = tNow * 0.002 * (i + 1);
  });
  particles.position.set(playerGroup.position.x, 0, playerGroup.position.z);
  const pp = partGeo.attributes.position;
  for (let i = 0; i < PARTICLE_N; i++) {
    pp.array[i * 3 + 1] += 0.01 + (i % 5) * 0.002;
    if (pp.array[i * 3 + 1] > 14) pp.array[i * 3 + 1] = 0;
  }
  pp.needsUpdate = true;
  moonLight.position.set(playerGroup.position.x + 30, 80, playerGroup.position.z + 40);
  moonLight.target.position.copy(playerGroup.position);
  moonLight.target.updateMatrixWorld();

  updateMotesVisual();
  updateShadesVisual();
  updateDriftersVisual();
  updateCharmsVisual();
  updateHUD();

  renderer.render(scene, camera);
}

requestAnimationFrame(gameLoop);
