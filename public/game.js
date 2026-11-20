import { Simulation, dist2D } from '../src/core/simulation.js';

// --- Web Audio Procedural Sound Effects ---
class AudioManager {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }
  playPickup() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
  playDeposit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
  playLanternLit() {
    if (!this.ctx) return;
    // Major chord arpeggio
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.1);
      osc.stop(this.ctx.currentTime + idx * 0.1 + 0.4);
    });
  }
  playPulse() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
  playHit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

const audio = new AudioManager();

// --- Main 3D Game Implementation ---
let sim = new Simulation({ seed: 42 });

// Three.js setups
const canvas = document.getElementById('canvas3d');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0c0e18, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0x282c40, 0.8);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x6b7fa8, 0.7);
moonLight.position.set(20, 50, 30);
scene.add(moonLight);

// Environment: Island & Sea of Clouds
function createIsland() {
  const islandGroup = new THREE.Group();

  // Island ground (cylinder)
  const islandGeo = new THREE.CylinderGeometry(40, 42, 6, 48);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x1f2c25,
    roughness: 0.85,
    metalness: 0.1,
  });
  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.position.y = -3;
  islandMesh.receiveShadow = true;
  islandGroup.add(islandMesh);

  // Decorative stone rim
  const rimGeo = new THREE.TorusGeometry(40.2, 0.6, 16, 64);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x3d3d4a, roughness: 0.9 });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = 0;
  islandGroup.add(rimMesh);

  // Sea of clouds below island
  const cloudGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0x12162a,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.y = -12;
  islandGroup.add(clouds);

  scene.add(islandGroup);
}
createIsland();

// Player 3D Model: Mây (character with conical hat & lantern)
const playerGroup = new THREE.Group();
function createPlayerMesh() {
  // Body (warm teal robe)
  const bodyGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.2, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x227068, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.6;
  playerGroup.add(body);

  // Head
  const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xf5cfab });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.35;
  playerGroup.add(head);

  // Nón Lá (Conical bamboo hat)
  const hatGeo = new THREE.ConeGeometry(0.7, 0.35, 24);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4a359, roughness: 0.8 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 1.6;
  playerGroup.add(hat);

  // Small lantern hanging from hat
  const lanternGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.22, 12);
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xffaa33,
    emissive: 0xff8800,
    emissiveIntensity: 0.8,
  });
  const smallLantern = new THREE.Mesh(lanternGeo, lanternMat);
  smallLantern.position.set(0.35, 1.35, 0.25);
  playerGroup.add(smallLantern);

  // Player light
  const pLight = new THREE.PointLight(0xffa500, 1.2, 8);
  pLight.position.set(0.35, 1.35, 0.25);
  playerGroup.add(pLight);

  scene.add(playerGroup);
}
createPlayerMesh();

// Lanterns 3D representations
const lanternMeshes = [];
function createLanternMeshes() {
  for (const lData of sim.lanterns) {
    const lGroup = new THREE.Group();
    lGroup.position.set(lData.pos[0], 0, lData.pos[2]);

    // Stone base
    const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.6, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a4a55, roughness: 0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.3;
    lGroup.add(base);

    // Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.25, 0.3, 3.2, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6e4e37, roughness: 0.8 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 2.0;
    lGroup.add(pillar);

    // Big Lantern Box
    const boxGeo = new THREE.BoxGeometry(1.2, 1.4, 1.2);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x332211,
      roughness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 4.0;
    lGroup.add(box);

    // Lantern Roof
    const roofGeo = new THREE.ConeGeometry(1.4, 0.6, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x7c2b2b, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 4.9;
    lGroup.add(roof);

    // Radiant Light
    const light = new THREE.PointLight(0xff7700, 0, 18);
    light.position.set(0, 4.0, 0);
    lGroup.add(light);

    // Safe zone circle outline
    const circleGeo = new THREE.RingGeometry(5.8, 6.0, 32);
    const circleMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const circle = new THREE.Mesh(circleGeo, circleMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.05;
    lGroup.add(circle);

    scene.add(lGroup);
    lanternMeshes.push({
      id: lData.id,
      group: lGroup,
      boxMesh: box,
      light: light,
      circleMesh: circle,
    });
  }
}
createLanternMeshes();

// Motes visual pool
let moteMeshes = [];
function updateMotesVisual() {
  // Sync count
  while (moteMeshes.length < sim.motes.length) {
    const geo = new THREE.SphereGeometry(0.18, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffea78 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    moteMeshes.push(mesh);
  }

  const time = Date.now() * 0.003;
  for (let i = 0; i < sim.motes.length; i++) {
    const mData = sim.motes[i];
    const mesh = moteMeshes[i];
    if (mData.active) {
      mesh.visible = true;
      mesh.position.set(mData.pos[0], 0.7 + Math.sin(time + i) * 0.25, mData.pos[2]);
    } else {
      mesh.visible = false;
    }
  }
}

// Shades visual pool
let shadeMeshes = [];
function updateShadesVisual() {
  while (shadeMeshes.length < sim.shades.length) {
    const group = new THREE.Group();

    // Body: smoky dark purple sphere
    const bodyGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x160824,
      emissive: 0x43126e,
      emissiveIntensity: 0.6,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    group.add(body);

    // Glowing purple eyes
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
    sm.group.position.set(sData.pos[0], 0, sData.pos[2]);

    // Face player
    sm.group.lookAt(playerGroup.position.x, 0, playerGroup.position.z);

    if (sData.state === 'stunned') {
      sm.body.material.color.setHex(0x555566);
      sm.body.material.emissive.setHex(0x222233);
      sm.group.position.y = Math.sin(Date.now() * 0.02) * 0.1; // jitter
    } else {
      sm.body.material.color.setHex(0x160824);
      sm.body.material.emissive.setHex(0x43126e);
      sm.group.position.y = 0;
    }
  }
}

// Pulse Ring Effect
const pulseRingGeo = new THREE.RingGeometry(0.1, 0.5, 32);
const pulseRingMat = new THREE.MeshBasicMaterial({
  color: 0xffd54f,
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
  pulseRing.position.set(playerGroup.position.x, 0.1, playerGroup.position.z);
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

  if (k === 'r') {
    window.restartGame();
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
    camYaw -= dx * 0.35;
    mouseX = e.clientX;
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI HUD Update
const carriedEl = document.getElementById('carried-val');
const scoreEl = document.getElementById('score-val');
const timeEl = document.getElementById('time-val');
const flamesContainer = document.getElementById('flames-container');
const banner = document.getElementById('banner');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const finalScore = document.getElementById('final-score');

function showBanner(text) {
  banner.textContent = text;
  banner.style.opacity = '1';
  setTimeout(() => (banner.style.opacity = '0'), 2500);
}

function updateHUD() {
  carriedEl.textContent = `${sim.player.carried} / ${sim.tuning.carry_capacity}`;
  scoreEl.textContent = sim.score;

  const min = Math.floor(sim.time_left_s / 60);
  const sec = Math.floor(sim.time_left_s % 60);
  timeEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

  // Flames
  const flameIcons = flamesContainer.querySelectorAll('.flame-icon');
  for (let i = 0; i < 3; i++) {
    if (i < sim.player.flames) {
      flameIcons[i].className = 'flame-icon active';
    } else {
      flameIcons[i].className = 'flame-icon lost';
    }
  }

  // Lantern badges & 3D glow sync
  for (const lData of sim.lanterns) {
    const badge = document.getElementById(`badge-${lData.id}`);
    const meshObj = lanternMeshes.find((m) => m.id === lData.id);

    if (lData.lit) {
      if (badge && !badge.classList.contains('lit')) badge.classList.add('lit');
      if (meshObj) {
        meshObj.boxMesh.material.color.setHex(0xffaa22);
        meshObj.boxMesh.material.emissive = new THREE.Color(0xff8800);
        meshObj.boxMesh.material.emissiveIntensity = 1.0;
        meshObj.light.intensity = 2.0;
        meshObj.circleMesh.material.opacity = 0.5;
      }
    } else {
      if (badge) badge.classList.remove('lit');
      if (meshObj) {
        meshObj.boxMesh.material.color.setHex(0x332211);
        meshObj.boxMesh.material.emissiveIntensity = 0;
        meshObj.light.intensity = 0;
        meshObj.circleMesh.material.opacity = 0;
      }
    }
  }

  // Modal GameOver
  if (sim.state !== 'playing' && modalOverlay.style.display !== 'flex') {
    modalOverlay.style.display = 'flex';
    finalScore.textContent = sim.score;
    if (sim.state === 'won') {
      modalTitle.textContent = 'CHIẾN THẮNG!';
      modalTitle.style.color = '#ffb834';
      modalDesc.textContent = 'Mây đã thắp sáng cả 5 Đèn Lồng Lớn, xua tan sương đen và cứu lấy hòn đảo!';
    } else {
      modalTitle.textContent = 'THẤT BẠI!';
      modalTitle.style.color = '#ff4444';
      modalDesc.textContent = sim.player.flames <= 0
        ? 'Mây đã bị Bóng Mực dập tắt hết ngọn lửa hy vọng...'
        : 'Bình minh đã đến trước khi kịp thắp sáng các ngọn đèn...';
    }
  }
}

window.restartGame = function () {
  sim = new Simulation({ seed: Date.now() });
  modalOverlay.style.display = 'none';
};

// Simulation Loop (fixed 60Hz tick)
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
  const jump = !!keys[' '];

  while (accumulator >= tickInterval) {
    if (sim.state === 'playing') {
      sim.setInput({
        move: [mx, mz],
        cam_yaw_deg: camYaw,
        jump,
        interact,
        pulse,
      });

      const events = sim.step();
      for (const ev of events) {
        if (ev.name === 'mote_picked') audio.playPickup();
        if (ev.name === 'deposit') audio.playDeposit();
        if (ev.name === 'lantern_lit') {
          audio.playLanternLit();
          showBanner(`Đã thắp sáng ${ev.data.lantern_id}!`);
        }
        if (ev.name === 'pulse') {
          audio.playPulse();
          triggerPulseVisual();
        }
        if (ev.name === 'player_hit') audio.playHit();
      }
    }
    accumulator -= tickInterval;
  }

  // Visual sync
  playerGroup.position.set(sim.player.pos[0], sim.player.pos[1], sim.player.pos[2]);

  // Player rotation towards movement
  if (mx !== 0 || mz !== 0) {
    const rad = (camYaw * Math.PI) / 180;
    const wx = mx * Math.cos(rad) + mz * Math.sin(rad);
    const wz = -mx * Math.sin(rad) + mz * Math.cos(rad);
    playerGroup.rotation.y = Math.atan2(wx, wz);
  }

  // Camera 3rd person follow
  const camDist = 7.0;
  const camHeight = 3.5;
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

  updateMotesVisual();
  updateShadesVisual();
  updateHUD();

  renderer.render(scene, camera);
}

requestAnimationFrame(gameLoop);
