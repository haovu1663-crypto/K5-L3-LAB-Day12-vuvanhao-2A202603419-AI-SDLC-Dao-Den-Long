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

// Chế độ "Bảng màu dễ phân biệt" (Colorblind Mode - Ticket-03 Section 6)
let isColorblind = localStorage.getItem('dao_cb') === '1';
window.setColorblindMode = function (on) {
  isColorblind = !!on;
  localStorage.setItem('dao_cb', isColorblind ? '1' : '0');
  if (isColorblind) {
    document.body.classList.add('colorblind');
  } else {
    document.body.classList.remove('colorblind');
  }
  document.querySelectorAll('.cb-toggle').forEach((el) => (el.checked = isColorblind));
};
if (isColorblind) {
  document.body.classList.add('colorblind');
}

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
  playRefuel() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(783.99, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
  playLanternOut() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
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

// ---- Vietnamese Sacred Lotus Mandala Texture Generator ----
function makeMandalaTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const cx = 256, cy = 256;

  g.clearRect(0, 0, 512, 512);

  // Outer ornate glowing ring
  g.strokeStyle = 'rgba(255, 215, 100, 0.9)';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(cx, cy, 240, 0, Math.PI * 2);
  g.stroke();

  // Secondary dashed ring with ancient motif
  g.strokeStyle = 'rgba(255, 235, 140, 0.65)';
  g.lineWidth = 3;
  g.setLineDash([14, 8]);
  g.beginPath();
  g.arc(cx, cy, 224, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);

  // Inner ring
  g.strokeStyle = 'rgba(255, 215, 100, 0.75)';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(cx, cy, 160, 0, Math.PI * 2);
  g.stroke();

  // 8 Sacred Lotus Petals
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    g.save();
    g.translate(cx, cy);
    g.rotate(ang);

    // Petal curve with soft golden fill
    g.strokeStyle = 'rgba(255, 225, 120, 0.9)';
    g.fillStyle = 'rgba(255, 185, 60, 0.15)';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(0, 40);
    g.quadraticCurveTo(55, 140, 0, 220);
    g.quadraticCurveTo(-55, 140, 0, 40);
    g.fill();
    g.stroke();

    // Central vein
    g.strokeStyle = 'rgba(255, 245, 190, 0.7)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(0, 50);
    g.lineTo(0, 200);
    g.stroke();

    g.restore();
  }

  // Central sun / lotus aura core
  const coreGrad = g.createRadialGradient(cx, cy, 0, cx, cy, 60);
  coreGrad.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
  coreGrad.addColorStop(0.45, 'rgba(255, 195, 75, 0.55)');
  coreGrad.addColorStop(1, 'rgba(255, 170, 40, 0)');
  g.fillStyle = coreGrad;
  g.beginPath();
  g.arc(cx, cy, 60, 0, Math.PI * 2);
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  return tex;
}
const mandalaTexture = makeMandalaTexture();

// ---- Aurora Borealis / Celestial Nebula Texture Generator ----
function makeNebulaTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 512);

  // Aurora curtains (cyan & magenta ribbons)
  const grad1 = g.createLinearGradient(0, 0, 1024, 512);
  grad1.addColorStop(0, 'rgba(0, 229, 255, 0)');
  grad1.addColorStop(0.25, 'rgba(0, 229, 255, 0.22)');
  grad1.addColorStop(0.5, 'rgba(155, 93, 229, 0.28)');
  grad1.addColorStop(0.75, 'rgba(241, 91, 181, 0.18)');
  grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');

  g.fillStyle = grad1;
  g.beginPath();
  g.moveTo(0, 200);
  g.bezierCurveTo(250, 80, 500, 320, 750, 150);
  g.bezierCurveTo(900, 80, 1024, 180, 1024, 300);
  g.lineTo(1024, 512);
  g.lineTo(0, 512);
  g.closePath();
  g.fill();

  // Secondary soft aurora band
  const grad2 = g.createRadialGradient(450, 180, 20, 450, 180, 320);
  grad2.addColorStop(0, 'rgba(0, 255, 200, 0.18)');
  grad2.addColorStop(0.6, 'rgba(80, 130, 255, 0.12)');
  grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad2;
  g.fillRect(0, 0, 1024, 512);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// Celestial Aurora Nebula Dome
const nebulaGeo = new THREE.SphereGeometry(520, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45);
const nebulaMat = new THREE.MeshBasicMaterial({
  map: makeNebulaTexture(),
  transparent: true,
  opacity: 0.65,
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  blending: THREE.AdditiveBlending,
});
const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
scene.add(nebulaMesh);

// Stars with Individual Colors & Twinkling
const starsGeo = new THREE.BufferGeometry();
const STAR_COUNT = 2200;
const starPos = new Float32Array(STAR_COUNT * 3);
const starColors = new Float32Array(STAR_COUNT * 3);
{
  let s = 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < STAR_COUNT; i++) {
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(rnd() * 0.95 + 0.05);
    const r = 580;
    starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    starPos[i * 3 + 1] = r * Math.cos(ph);
    starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);

    // Multi-color star palette (warm gold, pale cyan, diamond white)
    const cType = rnd();
    if (cType < 0.35) {
      starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.92; starColors[i * 3 + 2] = 0.65; // Gold
    } else if (cType < 0.65) {
      starColors[i * 3] = 0.72; starColors[i * 3 + 1] = 0.88; starColors[i * 3 + 2] = 1.0; // Cyan
    } else {
      starColors[i * 3] = 0.98; starColors[i * 3 + 1] = 0.98; starColors[i * 3 + 2] = 1.0; // White
    }
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
}
const stars = new THREE.Points(
  starsGeo,
  new THREE.PointsMaterial({
    vertexColors: true,
    size: 2.0,
    sizeAttenuation: false,
    fog: false,
    transparent: true,
    opacity: 0.9,
  })
);
scene.add(stars);

function makeMoonTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  
  // Base lunar surface gradient
  const grad = g.createRadialGradient(220, 220, 20, 256, 256, 250);
  grad.addColorStop(0, '#fffaeb');
  grad.addColorStop(0.5, '#eae5d4');
  grad.addColorStop(0.85, '#d0cbba');
  grad.addColorStop(1, '#b5afa0');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(256, 256, 250, 0, Math.PI * 2);
  g.fill();

  // Procedural lunar craters / maria
  let s = 888;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 45; i++) {
    const cx = 90 + rnd() * 332;
    const cy = 90 + rnd() * 332;
    const r = 10 + rnd() * 48;
    const craterGrad = g.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    craterGrad.addColorStop(0, 'rgba(105, 100, 90, 0.48)');
    craterGrad.addColorStop(0.75, 'rgba(140, 135, 125, 0.22)');
    craterGrad.addColorStop(1, 'rgba(210, 205, 195, 0)');
    g.fillStyle = craterGrad;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
  }

  return new THREE.CanvasTexture(c);
}

// Moon with atmospheric double halo positioned in player's forward sky
const moonGroup = new THREE.Group();
const moonPos = new THREE.Vector3(75, 105, 210);

const moonGeo = new THREE.SphereGeometry(22, 32, 32);
const moonMat = new THREE.MeshBasicMaterial({
  map: makeMoonTexture(),
  fog: false,
  depthWrite: false,
});
const moon = new THREE.Mesh(moonGeo, moonMat);
moon.rotation.y = -Math.PI / 4;
moonGroup.add(moon);

// Inner warm golden glow
const innerHalo = glowSprite(makeGlowTexture('rgba(255,248,220,0.95)', 'rgba(255,225,140,0.4)'), 95, 0.85);
moonGroup.add(innerHalo);

// Outer mystical atmospheric corona
const outerHalo = glowSprite(makeGlowTexture('rgba(180,210,255,0.6)', 'rgba(100,145,220,0.15)'), 230, 0.5);
moonGroup.add(outerHalo);

moonGroup.position.copy(moonPos);
scene.add(moonGroup);

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

// 3D Volumetric Cloud Pillows drifting around islands
const cloudPuffMat = new THREE.MeshStandardMaterial({
  color: 0x1d3654,
  roughness: 0.95,
  metalness: 0.05,
  transparent: true,
  opacity: 0.65,
  flatShading: true,
  depthWrite: false,
});
const cloudPuffGeo = new THREE.DodecahedronGeometry(1, 1);
const cloudPuffs = [];
for (let i = 0; i < 32; i++) {
  const puff = new THREE.Mesh(cloudPuffGeo, cloudPuffMat);
  const ang = (i / 32) * Math.PI * 2;
  const dist = 38 + (i % 6) * 10;
  puff.position.set(Math.cos(ang) * dist, -9 - (i % 4) * 2.5, Math.sin(ang) * dist);
  const sc = 5 + (i % 5) * 3.5;
  puff.scale.set(sc * 1.8, sc * 0.75, sc * 1.4);
  puff.rotation.set((i * 0.3) % 3, (i * 0.5) % 3, (i * 0.7) % 3);
  puff.userData = { origX: puff.position.x, origZ: puff.position.z, speed: 0.04 + (i % 3) * 0.025, ang };
  scene.add(puff);
  cloudPuffs.push(puff);
}

// Falling magical sakura blossom particles
const LEAF_COUNT = 140;
const leafGeo = new THREE.BufferGeometry();
const leafPositions = new Float32Array(LEAF_COUNT * 3);
const leafSpeeds = new Float32Array(LEAF_COUNT);
for (let i = 0; i < LEAF_COUNT; i++) {
  leafPositions[i * 3] = (Math.random() - 0.5) * 90;
  leafPositions[i * 3 + 1] = 1 + Math.random() * 15;
  leafPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  leafSpeeds[i] = 0.4 + Math.random() * 0.8;
}
leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3));
const leafMat = new THREE.PointsMaterial({
  color: 0xffb7c5, // Sakura petal pink
  size: 0.32,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const leafParticles = new THREE.Points(leafGeo, leafMat);
scene.add(leafParticles);

// Ambient drifting fairy fireflies across the islands
const AMBIENT_FIREFLIES = 80;
const fireflyGeo = new THREE.BufferGeometry();
const fireflyPos = new Float32Array(AMBIENT_FIREFLIES * 3);
for (let i = 0; i < AMBIENT_FIREFLIES; i++) {
  fireflyPos[i * 3] = (Math.random() - 0.5) * 80;
  fireflyPos[i * 3 + 1] = 0.6 + Math.random() * 6.0;
  fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
}
fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
const fireflyMat = new THREE.PointsMaterial({
  color: 0xfff6a0,
  size: 0.42,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const ambientFireflies = new THREE.Points(fireflyGeo, fireflyMat);
scene.add(ambientFireflies);

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

// ---- Ground texture + grass blades (visual-only) ----
function makeGroundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f2f2';
  g.fillRect(0, 0, 256, 256);
  let s = 31;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1400; i++) {
    const v = 215 + Math.floor(rnd() * 40);
    g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    g.fillRect(rnd() * 256, rnd() * 256, 2 + rnd() * 5, 2 + rnd() * 5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  return t;
}

function addGrass(cx, cz, R, rnd) {
  const COUNT = 1400;
  const geo = new THREE.ConeGeometry(0.07, 0.55, 4);
  geo.translate(0, 0.27, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3a7664, roughness: 0.9 });
  const inst = new THREE.InstancedMesh(geo, mat, COUNT);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  let placed = 0;
  while (placed < COUNT) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (R - 1);
    const x = cx + r * Math.cos(a);
    const z = cz + r * Math.sin(a);
    if (x > 24 && x < 46 && Math.abs(z) < 3.5) { placed++; m4.makeScale(0, 0, 0); inst.setMatrixAt(placed - 1, m4); continue; }
    const sc = 0.7 + rnd() * 1.1;
    m4.makeRotationZ((rnd() - 0.5) * 0.4);
    m4.scale(new THREE.Vector3(sc, sc, sc));
    m4.setPosition(x, 0, z);
    inst.setMatrixAt(placed, m4);
    col.setHSL(0.42 + rnd() * 0.04, 0.35, 0.3 + rnd() * 0.12);
    inst.setColorAt(placed, col);
    placed++;
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  islandGroup.add(inst);

  // Luminescent night wildflowers (cyan & gold buds)
  const FLOWER_COUNT = 90;
  const flowerGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const flowerMat = new THREE.MeshStandardMaterial({
    roughness: 0.3,
    metalness: 0.1,
    emissiveIntensity: 0.8,
  });
  const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWER_COUNT);
  let fPlaced = 0;
  while (fPlaced < FLOWER_COUNT) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (R - 2.0);
    const x = cx + r * Math.cos(a);
    const z = cz + r * Math.sin(a);
    if (x > 24 && x < 46 && Math.abs(z) < 3.5) { fPlaced++; m4.makeScale(0, 0, 0); flowerInst.setMatrixAt(fPlaced - 1, m4); continue; }
    m4.makeScale(1, 1, 1);
    m4.setPosition(x, 0.22, z);
    flowerInst.setMatrixAt(fPlaced, m4);
    if (rnd() > 0.45) {
      col.setHex(0x50e3c2); // Soft cyan
    } else {
      col.setHex(0xffd166); // Warm gold
    }
    flowerInst.setColorAt(fPlaced, col);
    fPlaced++;
  }
  flowerInst.instanceMatrix.needsUpdate = true;
  if (flowerInst.instanceColor) flowerInst.instanceColor.needsUpdate = true;
  islandGroup.add(flowerInst);
}

function createStylizedTree(h, rnd, trunkMat, leafMat) {
  const tree = new THREE.Group();
  
  // Curved/tapered trunk with multiple segments
  const trunkSegments = 3;
  const segHeight = h / trunkSegments;
  let currY = 0;
  let currRadius = 0.28;
  const leanAngleX = (rnd() - 0.5) * 0.18;
  const leanAngleZ = (rnd() - 0.5) * 0.18;

  for (let s = 0; s < trunkSegments; s++) {
    const topRadius = currRadius * 0.75;
    const segGeo = new THREE.CylinderGeometry(topRadius, currRadius, segHeight, 7);
    segGeo.translate(0, segHeight / 2, 0);
    const segMesh = new THREE.Mesh(segGeo, trunkMat);
    segMesh.position.set(s * leanAngleX * 0.5, currY, s * leanAngleZ * 0.5);
    segMesh.rotation.x = leanAngleX * (s + 1) * 0.5;
    segMesh.rotation.z = leanAngleZ * (s + 1) * 0.5;
    tree.add(segMesh);
    currY += segHeight * 0.95;
    currRadius = topRadius;
  }

  // Multi-tier lush foliage canopy (fluffy low-poly cloud/canopy layers)
  const foliageTiers = 3;
  const baseFoliageRadius = 1.35 + rnd() * 0.45;
  for (let t = 0; t < foliageTiers; t++) {
    const tierGroup = new THREE.Group();
    const tierRadius = baseFoliageRadius * (1.0 - t * 0.22);
    const clusterCount = 4 + t;

    // Sub-cluster spheres forming organic stylized canopy
    for (let c = 0; c < clusterCount; c++) {
      const ang = (c / clusterCount) * Math.PI * 2 + rnd() * 0.3;
      const distFromCenter = tierRadius * (0.35 + rnd() * 0.25);
      const puffGeo = new THREE.DodecahedronGeometry(tierRadius * (0.55 + rnd() * 0.25), 1);
      const puff = new THREE.Mesh(puffGeo, leafMat);
      puff.position.set(
        Math.cos(ang) * distFromCenter,
        (rnd() - 0.5) * 0.2,
        Math.sin(ang) * distFromCenter
      );
      puff.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
      tierGroup.add(puff);
    }

    // Central puff for each tier
    const centerPuff = new THREE.Mesh(
      new THREE.DodecahedronGeometry(tierRadius * 0.75, 1),
      leafMat
    );
    tierGroup.add(centerPuff);

    tierGroup.position.set(
      trunkSegments * leanAngleX * 0.5 + (rnd() - 0.5) * 0.1,
      currY + t * 0.75,
      trunkSegments * leanAngleZ * 0.5 + (rnd() - 0.5) * 0.1
    );
    tree.add(tierGroup);
  }

  // Fairy paper lantern hanging on stylized tree branch (35% probability)
  if (rnd() > 0.65) {
    const fairyLantern = new THREE.Group();
    const cordGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4);
    const cordMat = new THREE.MeshBasicMaterial({ color: 0x332211 });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.y = -0.3;
    fairyLantern.add(cord);

    const miniLanternGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const miniLanternMat = new THREE.MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff7711,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });
    const miniLantern = new THREE.Mesh(miniLanternGeo, miniLanternMat);
    miniLantern.position.y = -0.65;
    miniLantern.scale.set(1.0, 1.25, 1.0);
    fairyLantern.add(miniLantern);

    fairyLantern.position.set(0.65 * (rnd() > 0.5 ? 1 : -1), currY * 0.9, 0.55 * (rnd() > 0.5 ? 1 : -1));
    tree.add(fairyLantern);
  }

  return tree;
}

// Visual-only decoration (cây, đá) – tất định, không dùng RNG của simulation
function addDecor(night) {
  let s = 99 + night;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5a3d24,
    roughness: 0.9,
    metalness: 0.05
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x244f43,
    roughness: 0.75,
    metalness: 0.05,
    flatShading: true
  });
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x5b5f6e,
    roughness: 0.95,
    flatShading: true
  });

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
        const h = 2.4 + rnd() * 1.5;
        const styledTree = createStylizedTree(h, rnd, trunkMat, leafMat);
        g.add(styledTree);
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
    addGrass(cx, cz, R, rnd);
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

const hemiLight = new THREE.HemisphereLight(0x1b2350, 0x2f5d50, 0.35);
scene.add(hemiLight);

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

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, roughness: 0.8, map: makeGroundTexture() });
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
const limbs = {};
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

  // Arms, legs, scarf tail, eyes (visual animation)
  const skin = new THREE.MeshStandardMaterial({ color: 0xf5cfab });
  const robe = new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.7 });
  const mkLimb = (geo, mat, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const m = new THREE.Mesh(geo, mat);
    m.position.y = -geo.parameters.height / 2;
    pivot.add(m);
    playerGroup.add(pivot);
    return pivot;
  };
  limbs.armL = mkLimb(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8), robe, -0.42, 1.05);
  limbs.armR = mkLimb(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8), robe, 0.42, 1.05);
  limbs.legL = mkLimb(new THREE.CylinderGeometry(0.1, 0.09, 0.4, 8), skin, -0.18, 0.2);
  limbs.legR = mkLimb(new THREE.CylinderGeometry(0.1, 0.09, 0.4, 8), skin, 0.18, 0.2);
  const eyeMat2 = new THREE.MeshBasicMaterial({ color: 0x221a14 });
  const eg = new THREE.SphereGeometry(0.035, 8, 8);
  const eL = new THREE.Mesh(eg, eyeMat2); eL.position.set(-0.1, 1.38, 0.27);
  const eR = new THREE.Mesh(eg, eyeMat2); eR.position.set(0.1, 1.38, 0.27);
  playerGroup.add(eL, eR);
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.05, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xc8102e })
  );
  tail.geometry.translate(0, 0, -0.35);
  tail.position.set(0, 1.12, -0.3);
  playerGroup.add(tail);
  limbs.tail = tail;

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

    // Sacred Lotus Mandala Ground Projection (r=6.0m, dia=12m)
    const mandalaGeo = new THREE.PlaneGeometry(12.0, 12.0);
    const mandalaMat = new THREE.MeshBasicMaterial({
      map: mandalaTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mandalaMesh = new THREE.Mesh(mandalaGeo, mandalaMat);
    mandalaMesh.rotation.x = -Math.PI / 2;
    mandalaMesh.position.y = 0.06;
    lGroup.add(mandalaMesh);

    // Heavenly Ascending Light Pillar Beam (34m high)
    const pillarBeamGeo = new THREE.CylinderGeometry(0.35, 1.3, 34, 16, 1, true);
    pillarBeamGeo.translate(0, 17, 0);
    const pillarBeamMat = new THREE.MeshBasicMaterial({
      color: 0xffe082,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pillarBeam = new THREE.Mesh(pillarBeamGeo, pillarBeamMat);
    pillarBeam.position.y = 3.6;
    lGroup.add(pillarBeam);

    const halo = glowSprite(lanternGlowTex, 9, 0);
    halo.position.y = 3.6;
    lGroup.add(halo);

    // 3D Fuel Gauge Bar (Ticket-03: Hiển thị thanh dầu trên đèn đang sáng)
    const fuelBarGroup = new THREE.Group();
    fuelBarGroup.position.set(0, 5.3, 0);

    const fuelBgGeo = new THREE.BoxGeometry(1.6, 0.22, 0.06);
    const fuelBgMat = new THREE.MeshBasicMaterial({ color: 0x111118 });
    const fuelBg = new THREE.Mesh(fuelBgGeo, fuelBgMat);
    fuelBarGroup.add(fuelBg);

    const fillGeo = new THREE.BoxGeometry(1.5, 0.16, 0.07);
    fillGeo.translate(0.75, 0, 0); // Origin at left edge for proper scaling
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x50c878 });
    const fillMesh = new THREE.Mesh(fillGeo, fillMat);
    fillMesh.position.set(-0.75, 0, 0.01);
    fuelBarGroup.add(fillMesh);

    fuelBarGroup.visible = false;
    lGroup.add(fuelBarGroup);

    // Torn paper patches on unlit lantern (distinguishable without color - Ticket-03 Section 6)
    const tornPatches = [];
    const patchMat = new THREE.MeshStandardMaterial({ color: 0x2e3038, roughness: 0.95 });
    for (let p = 0; p < 3; p++) {
      const pGeo = new THREE.PlaneGeometry(0.35 + p * 0.1, 0.5 + p * 0.15);
      const pMesh = new THREE.Mesh(pGeo, patchMat);
      pMesh.position.set((p - 1) * 0.35, 3.5 + (p % 2) * 0.2, 0.61);
      lGroup.add(pMesh);
      tornPatches.push(pMesh);
    }

    lGroup.traverse((o) => { if (o.isMesh) o.castShadow = true; });

    scene.add(lGroup);
    lanternMeshes.push({
      id: lData.id,
      group: lGroup,
      boxMesh: box,
      roof: roof,
      light: light,
      circleMesh: circle,
      mandalaMesh,
      pillarBeam,
      halo,
      fuelBarGroup,
      fillMesh,
      tornPatches,
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

    // Wispy tendrils
    const tendrils = [];
    for (let k = 0; k < 4; k++) {
      const t = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 1.1, 6),
        new THREE.MeshStandardMaterial({ color: 0x120a1a, emissive: 0x7a3cff, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 })
      );
      t.geometry.translate(0, -0.55, 0);
      t.position.set(Math.cos(k * 1.57) * 0.35, 0.8, Math.sin(k * 1.57) * 0.35);
      t.rotation.x = Math.PI;
      group.add(t);
      tendrils.push(t);
    }
    group.userData.tendrils = tendrils;

    scene.add(group);
    shadeMeshes.push({ group, body, leftEye, rightEye });
  }

  for (let i = 0; i < sim.shades.length; i++) {
    const sData = sim.shades[i];
    const sm = shadeMeshes[i];
    sm.group.position.set(sData.pos[0], sData.pos[1], sData.pos[2]);
    sm.group.lookAt(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);
    {
      const tt = Date.now() * 0.006 + i;
      sm.body.scale.setScalar(1 + Math.sin(tt) * 0.06);
      sm.group.userData.tendrils.forEach((t, k) => {
        t.rotation.z = Math.sin(tt * 1.3 + k) * 0.35;
        t.rotation.x = Math.PI + Math.cos(tt + k * 2) * 0.25;
      });
    }

    const eyeColor = isColorblind ? 0x00b3ff : 0xdd55ff;
    const borderEmissive = isColorblind ? 0x00b3ff : 0x7a3cff;
    sm.leftEye.material.color.setHex(eyeColor);
    sm.rightEye.material.color.setHex(eyeColor);

    if (sData.state === 'stunned') {
      sm.body.material.color.setHex(0x3a3450);
      sm.body.material.emissive.setHex(0x222233);
      sm.group.position.y = sData.pos[1] + Math.sin(Date.now() * 0.02) * 0.1;
    } else if (sData.state === 'drain') {
      // Draining state: body pulses dark with intense vortex emissive
      sm.body.material.color.setHex(0x0a0512);
      sm.body.material.emissive.setHex(borderEmissive);
      sm.body.material.emissiveIntensity = 0.85 + Math.sin(Date.now() * 0.02) * 0.35;
      sm.body.scale.setScalar(1.05 + Math.sin(Date.now() * 0.03) * 0.1);
    } else {
      sm.body.material.color.setHex(0x120a1a);
      sm.body.material.emissive.setHex(borderEmissive);
      sm.body.material.emissiveIntensity = 0.5;
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

// Pulse Ring & Expanding Dome Effect
const pulseRingGeo = new THREE.RingGeometry(0.1, 0.5, 32);
const pulseRingMat = new THREE.MeshBasicMaterial({
  color: 0xffd166,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0,
});
const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
pulseRing.rotation.x = -Math.PI / 2;
pulseRing.position.y = 0.1;
scene.add(pulseRing);

const pulseDomeGeo = new THREE.SphereGeometry(1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
const pulseDomeMat = new THREE.MeshBasicMaterial({
  color: 0xffd166,
  side: THREE.BackSide,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const pulseDome = new THREE.Mesh(pulseDomeGeo, pulseDomeMat);
scene.add(pulseDome);
let pulseAnim = 0;

function triggerPulseVisual() {
  pulseRing.position.set(playerGroup.position.x, playerGroup.position.y + 0.1, playerGroup.position.z);
  pulseDome.position.set(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);
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

  // Lanterns count & threshold to win at dawn (Ticket-03 Section 3)
  const litCount = sim.lanterns.filter((l) => l.lit).length;
  const reqCount = Math.ceil(sim.lanterns.length * (sim.tuning.win_ratio || 0.6));
  lanternsValEl.innerHTML = `${litCount} / ${sim.lanterns.length} <span style="font-size:12px;opacity:0.8;">(Cần &ge; ${reqCount})</span>`;
  scoreValEl.textContent = sim.score + totalCampaignScore;

  // Dynamic ambient light according to formula: 0.15 + 0.55 * (litCount / totalCount)
  ambientLight.intensity = 0.15 + 0.55 * (litCount / Math.max(1, sim.lanterns.length));

  // Dynamic Mote inventory bar & Capacity (Ticket-03 Section 4: 10 + 2 * successful_lights, max 20)
  const capacity = sim.getCapacity();
  const carriedValEl = document.getElementById('carried-val');
  const capacityValEl = document.getElementById('capacity-val');
  if (carriedValEl) carriedValEl.textContent = sim.player.carried;
  if (capacityValEl) capacityValEl.textContent = capacity;

  const moteBarEl = document.getElementById('mote-bar');
  if (moteBarEl) {
    while (moteBarEl.children.length < capacity) {
      const slot = document.createElement('div');
      slot.className = 'mote-slot';
      moteBarEl.appendChild(slot);
    }
    while (moteBarEl.children.length > capacity) {
      moteBarEl.removeChild(moteBarEl.lastChild);
    }
    for (let i = 0; i < capacity; i++) {
      if (i < sim.player.carried) {
        moteBarEl.children[i].classList.add('filled');
      } else {
        moteBarEl.children[i].classList.remove('filled');
      }
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

  // Nearby eligible lantern prompt (Ticket-03 Section 1: Thắp mới, Thắp lại 5 đom đóm, Châm dầu)
  let nearLantern = null;
  let nearDist = 999;
  for (const l of sim.lanterns) {
    const d = dist2D(sim.player.pos, l.pos);
    if (d <= (sim.tuning.interact_radius || 2.0)) {
      if (!l.lit || l.fuel_ticks < 6000) {
        if (d < nearDist) {
          nearDist = d;
          nearLantern = l;
        }
      }
    }
  }
  if (nearLantern) {
    interactPrompt.style.display = 'block';
    if (!nearLantern.lit) {
      const cost = nearLantern.ever_lit ? (sim.tuning.relight_cost || 5) : (sim.tuning.lantern_cost || 10);
      promptDeposit.textContent = nearLantern.ever_lit
        ? `Thắp Lại: ${nearLantern.deposited}/${cost}`
        : `Thắp Mới: ${nearLantern.deposited}/${cost}`;
    } else {
      const curFuel = Math.round(nearLantern.fuel_ticks / 60);
      promptDeposit.textContent = `Châm Dầu: ${curFuel}/100`;
    }
  } else {
    interactPrompt.style.display = 'none';
  }

  // 3D Lantern visual state: fuel gauge, 1Hz blinking when fuel < 30, torn paper squashed mesh when unlit
  for (const lData of sim.lanterns) {
    const meshObj = lanternMeshes.find((m) => m.id === lData.id);
    if (meshObj) {
      if (lData.lit) {
        meshObj.fuelBarGroup.visible = true;
        meshObj.fuelBarGroup.quaternion.copy(camera.quaternion);

        const currentFuel = lData.fuel_ticks / 60;
        meshObj.fillMesh.scale.x = Math.max(0.001, currentFuel / 100);

        // Unsquashed standard size
        meshObj.boxMesh.scale.set(1.0, 1.0, 1.0);
        meshObj.roof.position.y = 4.5;
        if (meshObj.tornPatches) meshObj.tornPatches.forEach((p) => (p.visible = false));

        if (currentFuel < 30) {
          // Fuel < 30: loses safe zone, blinks slowly at 1 Hz (1000ms period = 500ms on / 500ms off)
          meshObj.circleMesh.material.opacity = 0;
          if (meshObj.mandalaMesh) meshObj.mandalaMesh.material.opacity = 0;
          if (meshObj.pillarBeam) meshObj.pillarBeam.material.opacity = 0;
          const blinkOn = (Math.floor(Date.now() / 500) % 2) === 0;
          meshObj.boxMesh.material.color.setHex(blinkOn ? 0xffb347 : 0x5b3a1a);
          meshObj.boxMesh.material.emissiveIntensity = blinkOn ? 0.9 : 0.15;
          meshObj.light.intensity = blinkOn ? 2.2 : 0.4;
          meshObj.halo.material.opacity = blinkOn ? 0.8 : 0.1;
          meshObj.fillMesh.material.color.setHex(blinkOn ? (isColorblind ? 0xffffff : 0xff5a5f) : 0x331111);
        } else {
          // Fuel >= 30: safe zone active, steady warm light
          meshObj.boxMesh.material.color.setHex(0xffb347);
          meshObj.boxMesh.material.emissive = new THREE.Color(0xffe9b0);
          meshObj.boxMesh.material.emissiveIntensity = 1.0;
          meshObj.light.intensity = 2.5 + Math.sin(Date.now() * 0.013 + lData.pos[0]) * 0.25;
          meshObj.circleMesh.material.opacity = 0.5;
          if (meshObj.mandalaMesh) meshObj.mandalaMesh.material.opacity = 0.8;
          if (meshObj.pillarBeam) meshObj.pillarBeam.material.opacity = 0.22 + Math.sin(Date.now() * 0.003 + lData.pos[0]) * 0.06;
          meshObj.halo.material.opacity = 0.85 + Math.sin(Date.now() * 0.004) * 0.1;
          meshObj.fillMesh.material.color.setHex(isColorblind ? 0x00b3ff : 0x50c878);
        }
      } else {
        // Unlit: hide fuel bar, lights off, squashed 20% in Y, show torn paper patches
        meshObj.fuelBarGroup.visible = false;
        meshObj.boxMesh.material.color.setHex(0x5b5f6e);
        meshObj.boxMesh.material.emissiveIntensity = 0;
        meshObj.light.intensity = 0;
        meshObj.circleMesh.material.opacity = 0;
        if (meshObj.mandalaMesh) meshObj.mandalaMesh.material.opacity = 0;
        if (meshObj.pillarBeam) meshObj.pillarBeam.material.opacity = 0;
        meshObj.halo.material.opacity = 0;

        meshObj.boxMesh.scale.set(1.15, 0.8, 1.15); // Squashed 20%
        meshObj.roof.position.y = 4.2;
        if (meshObj.tornPatches) meshObj.tornPatches.forEach((p) => (p.visible = true));
      }
    }
  }

  // Modals for Victory / Defeat (Ticket-03 Section 3: dawn_survived)
  if (sim.state === 'won' && modalVictory.style.display !== 'flex') {
    modalVictory.style.display = 'flex';
    victoryScore.textContent = sim.score;
    if (sim.night === 3) {
      victoryTitle.textContent = 'BÌNH MINH ĐÃ TỚI — CHIẾN DỊCH HOÀN TẤT!';
      victoryStory.textContent = `Mây đã bảo vệ trọn vẹn 3 hòn đảo qua 3 đêm đen tối tới bình minh! Tổng điểm toàn bộ chiến dịch: ${sim.score + totalCampaignScore} điểm!`;
      document.getElementById('btn-next-night').textContent = 'Chơi Lại Toàn Bộ';
    } else {
      victoryTitle.textContent = `BÌNH MINH LÊN — SỐNG SÓT QUA ${titles[sim.night].toUpperCase()}!`;
      victoryStory.textContent = `Ánh sáng bình minh đã tới! Bạn đã giữ được ${litCount}/${sim.lanterns.length} ngọn đèn sáng rực rỡ và nhận điểm thưởng bình minh!`;
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
  document.querySelectorAll('.cb-toggle').forEach((el) => (el.checked = isColorblind));
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
  // Camera nhìn dọc +Z nên +X của contract nằm bên TRÁI màn hình → đảo dấu A/D ở giao diện.
  // (Chỉ đổi ánh xạ phím; logic simulation/headless giữ nguyên theo contract.)
  if (keys['a'] || keys['arrowleft']) mx += 1;
  if (keys['d'] || keys['arrowright']) mx -= 1;

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
        if (ev.name === 'refuel') audio.playRefuel();
        if (ev.name === 'lantern_lit') audio.playLanternLit();
        if (ev.name === 'lantern_out') audio.playLanternOut();
        if (ev.name === 'pulse') {
          audio.playPulse();
          triggerPulseVisual();
        }
        if (ev.name === 'dash') audio.playDash();
        if (ev.name === 'charm_picked') audio.playCharm();
        if (ev.name === 'player_hit') {
          audio.playHit();
          const hf = document.getElementById('hit-flash');
          hf.style.opacity = '1';
          setTimeout(() => (hf.style.opacity = '0'), 180);
        }
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

  // Animate pulse ring & expanding golden dome
  if (pulseAnim > 0) {
    pulseAnim -= 0.035;
    const scale = (1.0 - pulseAnim) * 12 + 0.1;
    pulseRing.scale.set(scale, scale, 1);
    pulseRingMat.opacity = pulseAnim * 0.85;
    pulseDome.scale.set(scale * 0.75, scale * 0.55, scale * 0.75);
    pulseDomeMat.opacity = pulseAnim * 0.35;
  } else {
    pulseRingMat.opacity = 0;
    pulseDomeMat.opacity = 0;
  }

  // Visual-only ambience
  {
    const moving = mx !== 0 || mz !== 0;
    limbs.phase = (limbs.phase || 0) + (moving ? delta * 0.014 : 0);
    const sw = moving ? Math.sin(limbs.phase) * 0.8 : 0;
    limbs.armL.rotation.x = sw;
    limbs.armR.rotation.x = -sw;
    limbs.legL.rotation.x = -sw;
    limbs.legR.rotation.x = sw;
    limbs.tail.rotation.y = Math.sin(Date.now() * 0.006) * 0.25;
    limbs.tail.rotation.x = moving ? -0.35 : -0.1;
    if (moving && sim.player.grounded) playerGroup.position.y += Math.abs(Math.sin(limbs.phase)) * 0.08;
    playerGroup.visible = !(sim.player.invuln_ticks > 0 && Math.floor(Date.now() / 90) % 2 === 0);
    const targetFov = sim.player.dash_active_ticks > 0 ? 70 : 60;
    camera.fov += (targetFov - camera.fov) * 0.2;
    camera.updateProjectionMatrix();
  }
  const tNow = Date.now() * 0.001;
  stars.rotation.y = tNow * 0.002;
  if (nebulaMesh) nebulaMesh.rotation.y = tNow * 0.0012;

  // Animate 3D volumetric cloud puffs drifting around the islands
  for (let i = 0; i < cloudPuffs.length; i++) {
    const puff = cloudPuffs[i];
    puff.userData.ang += puff.userData.speed * 0.004;
    const dist = Math.hypot(puff.userData.origX, puff.userData.origZ);
    puff.position.x = Math.cos(puff.userData.ang) * dist;
    puff.position.z = Math.sin(puff.userData.ang) * dist;
    puff.rotation.y += 0.0015;
  }

  // Animate falling sakura blossom petals
  const leafAttr = leafGeo.attributes.position;
  for (let i = 0; i < LEAF_COUNT; i++) {
    leafAttr.array[i * 3 + 1] -= leafSpeeds[i] * 0.035;
    leafAttr.array[i * 3] += Math.sin(tNow * 1.5 + i) * 0.015;
    if (leafAttr.array[i * 3 + 1] < -0.5) {
      leafAttr.array[i * 3 + 1] = 16.0;
      leafAttr.array[i * 3] = (Math.random() - 0.5) * 90;
      leafAttr.array[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
  }
  leafAttr.needsUpdate = true;

  // Animate floating fairy fireflies
  const ffAttr = fireflyGeo.attributes.position;
  for (let i = 0; i < AMBIENT_FIREFLIES; i++) {
    ffAttr.array[i * 3] += Math.sin(tNow * 0.8 + i * 1.7) * 0.025;
    ffAttr.array[i * 3 + 1] += Math.cos(tNow * 1.2 + i * 2.3) * 0.012;
    ffAttr.array[i * 3 + 2] += Math.sin(tNow * 0.7 + i * 0.9) * 0.025;
  }
  ffAttr.needsUpdate = true;

  // Rotate sacred lotus mandala planes for lit lanterns
  for (const lm of lanternMeshes) {
    if (lm.mandalaMesh && lm.mandalaMesh.material.opacity > 0) {
      lm.mandalaMesh.rotation.z += 0.0035;
    }
  }
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
  moonLight.position.set(playerGroup.position.x + 35, 80, playerGroup.position.z + 70);
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
