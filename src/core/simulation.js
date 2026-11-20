import { PRNG } from './prng.js';

export function round3(val) {
  return Number(Number(val).toFixed(3));
}

export function dist2D(p1, p2) {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function dist3D(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = (p1[1] || 0) - (p2[1] || 0);
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const DEFAULT_TUNING = {
  player_speed: 6.0,
  carry_capacity: 10,
  lantern_cost: 10,
  lantern_count_night1: 5,
  lantern_count_night2: 6,
  lantern_count_night3: 7,
  pickup_radius: 1.0,
  pickup_height: 1.5,
  interact_radius: 2.0,
  pulse_cost: 3,
  pulse_radius: 5.0,
  pulse_stun_ticks: 120,
  pulse_push_m: 4.0,
  pulse_cooldown_s: 3.0,
  safe_radius: 6.0,
  safe_push_ticks: 30,
  shade_speed_night1: 4.0,
  shade_speed_night2: 4.0,
  shade_speed_night3: 4.5,
  shade_detect_radius: 12.0,
  shade_lose_radius: 18.0,
  shade_hit_radius: 1.0,
  shade_hit_height: 1.5,
  shade_recoil_m: 2.0,
  shade_recoil_ticks: 60,
  jump_velocity: 7.0,
  gravity: -20.0,
  dash_speed: 14.0,
  dash_duration_s: 0.2,
  dash_cooldown_s: 1.5,
  fall_enabled: true,
  fall_threshold_y: -10.0,
  fall_wait_ticks: 60,
  invuln_ticks: 90,
  mote_ttl_ticks: 480,
  charm_duration_ticks: 600,
  charm_respawn_ticks: 2700,
  charm_speed: 7.2,
  drifter_speed: 7.0,
  drifter_idle_speed: 2.0,
  drifter_detect_radius: 15.0,
  drifter_flee_ticks: 240,
  night1_duration_s: 300,
  night2_duration_s: 330,
  night3_duration_s: 360,
  flames: 3,
  score: {
    per_mote: 10,
    per_lantern: 100,
    per_stun: 5,
    per_second_left: 2,
    per_flame_left: 50,
  },
};

export class Simulation {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 42;
    this.rng = new PRNG(this.seed);
    this.night = options.night ? parseInt(options.night, 10) : 1;
    this.tuning = options.tuning || { ...DEFAULT_TUNING };

    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // playing | paused | won | lost
    this.score = 0;

    const durations = {
      1: this.tuning.night1_duration_s || 300,
      2: this.tuning.night2_duration_s || 330,
      3: this.tuning.night3_duration_s || 360,
    };
    this.time_left_s = durations[this.night] || 300;

    // Player state
    this.player = {
      pos: [0, 0, 0],
      vel: [0, 0, 0],
      facing_dir: [0, 1], // +Z facing
      grounded: true,
      carried: 0,
      flames: this.tuning.flames || 3,
      invuln_ticks: 0,
      dash_cd_ticks: 0,
      dash_active_ticks: 0,
      dash_vel: [0, 0],
      pulse_cd_ticks: 0,
      charm_ticks: 0,
      fall_wait_ticks: 0,
      launch_active: false,
      launch_vel: [0, 0, 0],
    };

    // Environmental state
    this.wind = {
      active: false,
      dir_deg: 0,
      timer_ticks: 0,
      warning: false,
    };

    this.lanterns = [];
    this.motes = [];
    this.shades = [];
    this.drifters = [];
    this.charms = [];

    this.nextMoteId = 1;
    this.nextShadeId = 1;
    this.nextDrifterId = 1;

    // Spawn point configurations
    this.moteSpawnPoints = [];
    this.shadeSpawnPoints = [];

    // Pending events for this tick
    this.pendingEvents = [];

    // Current & previous input frame
    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      dash: false,
      interact: false,
      pulse: false,
      pause: false,
    };
    this.prevInput = { ...this.currentInput };

    // Setup map according to Night
    this.initMap(this.night);
  }

  initMap(night) {
    if (night === 1) {
      // Đêm 1 — Đảo Bến (r = 40m)
      this.lanterns = [
        { id: 'L1', pos: [0, 0, 25], lit: false, deposited: 0 },
        { id: 'L2', pos: [23.8, 0, 7.7], lit: false, deposited: 0 },
        { id: 'L3', pos: [14.7, 0, -20.2], lit: false, deposited: 0 },
        { id: 'L4', pos: [-14.7, 0, -20.2], lit: false, deposited: 0 },
        { id: 'L5', pos: [-23.8, 0, 7.7], lit: false, deposited: 0 },
      ];

      // Mote spawn points (8 on r=12, 16 on r=33)
      this.moteSpawnPoints = [];
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(12 * Math.cos(rad)), 0, round3(12 * Math.sin(rad))]);
      }
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(33 * Math.cos(rad)), 0, round3(33 * Math.sin(rad))]);
      }

      // Shade spawn points (12 on r=37m)
      this.shadeSpawnPoints = [];
      for (let i = 0; i < 12; i++) {
        const deg = 15 + i * 30;
        const rad = (deg * Math.PI) / 180;
        this.shadeSpawnPoints.push([round3(37 * Math.cos(rad)), 0, round3(37 * Math.sin(rad))]);
      }

      // Initial 20 motes
      for (let i = 0; i < 20 && i < this.moteSpawnPoints.length; i++) {
        const p = this.moteSpawnPoints[i];
        this.motes.push({
          id: `M${this.nextMoteId++}`,
          pos: [p[0], p[1], p[2]],
          kind: 'random',
          ttl_ticks: null,
          active: true,
        });
      }
    } else if (night === 2) {
      // Đêm 2 — Đảo Cau (2 islands r=28m, Bridge x in [26, 44])
      this.lanterns = [
        { id: 'L1', pos: [0, 0, 20], lit: false, deposited: 0 },
        { id: 'L2', pos: [17, 0, -10], lit: false, deposited: 0 },
        { id: 'L3', pos: [-17, 0, -10], lit: false, deposited: 0 },
        { id: 'L4', pos: [70, 0, 20], lit: false, deposited: 0 },
        { id: 'L5', pos: [87, 0, -10], lit: false, deposited: 0 },
        { id: 'L6', pos: [53, 0, -10], lit: false, deposited: 0 },
      ];

      // Mote spawn points (Island A & B)
      this.moteSpawnPoints = [];
      [ [0, 0], [70, 0] ].forEach(([cx, cz]) => {
        [0, 90, 180, 270].forEach((deg) => {
          const rad = (deg * Math.PI) / 180;
          this.moteSpawnPoints.push([round3(cx + 10 * Math.cos(rad)), 0, round3(cz + 10 * Math.sin(rad))]);
        });
        for (let i = 0; i < 8; i++) {
          const rad = (i * 45 * Math.PI) / 180;
          this.moteSpawnPoints.push([round3(cx + 22 * Math.cos(rad)), 0, round3(cz + 22 * Math.sin(rad))]);
        }
      });

      // Shade spawn points (8 per island on r=26m)
      this.shadeSpawnPoints = [];
      [ [0, 0], [70, 0] ].forEach(([cx, cz]) => {
        for (let i = 0; i < 8; i++) {
          const deg = 22.5 + i * 45;
          const rad = (deg * Math.PI) / 180;
          this.shadeSpawnPoints.push([round3(cx + 26 * Math.cos(rad)), 0, round3(cz + 26 * Math.sin(rad))]);
        }
      });

      // Initial 20 motes
      for (let i = 0; i < 20 && i < this.moteSpawnPoints.length; i++) {
        const p = this.moteSpawnPoints[i];
        this.motes.push({
          id: `M${this.nextMoteId++}`,
          pos: [p[0], p[1], p[2]],
          kind: 'random',
          ttl_ticks: null,
          active: true,
        });
      }

      // Wind Charm C1 at (35, 0, 0)
      this.charms = [
        { id: 'C1', pos: [35, 0, 0], available: true, respawn_ticks: 0 },
      ];
    } else if (night === 3) {
      // Đêm 3 — Đảo Chuông (3 tiers)
      this.lanterns = [
        { id: 'L1', pos: [0, 6, 6], lit: false, deposited: 0 },
        { id: 'L2', pos: [18, 3, 10], lit: false, deposited: 0 },
        { id: 'L3', pos: [-18, 3, 10], lit: false, deposited: 0 },
        { id: 'L4', pos: [35, 0, -10], lit: false, deposited: 0 },
        { id: 'L5', pos: [-35, 0, -10], lit: false, deposited: 0 },
        { id: 'L6', pos: [20, 0, -35], lit: false, deposited: 0 },
        { id: 'L7', pos: [-20, 0, -35], lit: false, deposited: 0 },
      ];

      // Mote points: Tier 0 (18), Tier 1 (8), Tier 2 (4) = 30
      this.moteSpawnPoints = [];
      for (let i = 0; i < 18; i++) {
        const rad = (i * 20 * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(34 * Math.cos(rad)), 0, round3(34 * Math.sin(rad))]);
      }
      for (let i = 0; i < 8; i++) {
        const deg = 20 + i * 20;
        const rad = (deg * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(18 * Math.cos(rad)), 3, round3(18 * Math.sin(rad))]);
      }
      [45, 135, 225, 315].forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(5 * Math.cos(rad)), 6, round3(5 * Math.sin(rad))]);
      });

      // Shade spawn points (16 on r=43m)
      this.shadeSpawnPoints = [];
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        this.shadeSpawnPoints.push([round3(43 * Math.cos(rad)), 0, round3(43 * Math.sin(rad))]);
      }

      // Initial 20 motes
      for (let i = 0; i < 20 && i < this.moteSpawnPoints.length; i++) {
        const p = this.moteSpawnPoints[i];
        this.motes.push({
          id: `M${this.nextMoteId++}`,
          pos: [p[0], p[1], p[2]],
          kind: 'random',
          ttl_ticks: null,
          active: true,
        });
      }

      // Charms C1 (30,0,25), C2 (-30,0,25)
      this.charms = [
        { id: 'C1', pos: [30, 0, 25], available: true, respawn_ticks: 0 },
        { id: 'C2', pos: [-30, 0, 25], available: true, respawn_ticks: 0 },
      ];
    }
  }

  getGroundHeight(x, z) {
    if (this.night === 1) {
      const d = Math.sqrt(x * x + z * z);
      return d <= 40 ? 0 : -999;
    } else if (this.night === 2) {
      const dA = Math.sqrt(x * x + z * z);
      if (dA <= 28) return 0;
      const dB = Math.sqrt((x - 70) * (x - 70) + z * z);
      if (dB <= 28) return 0;
      if (x >= 26 && x <= 44 && z >= -2 && z <= 2) return 0; // bridge
      return -999;
    } else if (this.night === 3) {
      const d = Math.sqrt(x * x + z * z);
      if (d > 45) return -999;
      // Tower collision (unclimbable radius 2 at center)
      if (d <= 2.0 && this.player.pos[1] >= 6) return 6;
      if (d <= 8) return 6; // Tier 2
      if (d >= 12 && d <= 24 && z > 0) return 3; // Tier 1
      return 0; // Tier 0
    }
    return 0;
  }

  applyScenario(scenario) {
    if (!scenario) return;

    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
      if (scenario.player.invuln_ticks !== undefined) this.player.invuln_ticks = scenario.player.invuln_ticks;
      if (scenario.player.dash_cd_ticks !== undefined) this.player.dash_cd_ticks = scenario.player.dash_cd_ticks;
      if (scenario.player.pulse_cd_ticks !== undefined) this.player.pulse_cd_ticks = scenario.player.pulse_cd_ticks;
      if (scenario.player.charm_ticks !== undefined) this.player.charm_ticks = scenario.player.charm_ticks;
    }

    if (scenario.time_left_s !== undefined) {
      this.time_left_s = scenario.time_left_s;
    }

    if (scenario.lanterns) {
      for (const update of scenario.lanterns) {
        const l = this.lanterns.find((item) => item.id === update.id);
        if (l) {
          if (update.pos) l.pos = [...update.pos];
          if (update.deposited !== undefined) l.deposited = update.deposited;
          if (update.lit !== undefined) l.lit = update.lit;
        } else {
          this.lanterns.push({
            id: update.id,
            pos: update.pos ? [...update.pos] : [0, 0, 0],
            lit: !!update.lit,
            deposited: update.deposited || 0,
          });
        }
      }
    }

    if (scenario.random_motes === false || scenario.motes !== undefined) {
      this.motes = [];
      if (scenario.motes) {
        for (const m of scenario.motes) {
          this.motes.push({
            id: `M${this.nextMoteId++}`,
            pos: [m[0], m[1] !== undefined ? m[1] : 0, m[2]],
            kind: 'random',
            ttl_ticks: null,
            active: true,
          });
        }
      }
    }

    if (scenario.random_shades === false || scenario.shades !== undefined) {
      this.shades = [];
      if (scenario.shades) {
        for (const s of scenario.shades) {
          this.shades.push({
            id: s.id || `S${this.nextShadeId++}`,
            pos: s.pos ? [...s.pos] : [10, 0, 10],
            state: s.state || 'chase',
            state_ticks_left: s.state_ticks_left || 0,
            push_vel: [0, 0],
            push_ticks_left: 0,
            safe_push_ticks_left: 0,
          });
        }
      }
    }

    if (scenario.random_drifters === false || scenario.drifters !== undefined) {
      this.drifters = [];
      if (scenario.drifters) {
        for (const d of scenario.drifters) {
          this.drifters.push({
            id: d.id || `D${this.nextDrifterId++}`,
            pos: d.pos ? [...d.pos] : [0, 0, 0],
            state: d.state || 'idle',
            stolen: d.stolen || 0,
            flee_ticks_left: d.flee_ticks_left || 0,
          });
        }
      }
    }

    if (scenario.charms !== undefined) {
      this.charms = [];
      for (const c of scenario.charms) {
        this.charms.push({
          id: c.id,
          pos: c.pos ? [...c.pos] : [0, 0, 0],
          available: c.available !== undefined ? c.available : true,
          respawn_ticks: c.respawn_ticks || 0,
        });
      }
    }
  }

  setInput(newInputFields) {
    this.prevInput = { ...this.currentInput };
    this.currentInput = {
      ...this.currentInput,
      ...newInputFields,
    };
  }

  step() {
    this.tick += 1;
    this.pendingEvents = [];

    // --- STEP 1: Handle input & Pause ---
    const pauseTriggered = this.currentInput.pause && !this.prevInput.pause;
    if (pauseTriggered) {
      if (this.state === 'playing') {
        this.state = 'paused';
        this.pendingEvents.push({ type: 'event', tick: this.tick, name: 'paused', data: {} });
      } else if (this.state === 'paused') {
        this.state = 'playing';
        this.pendingEvents.push({ type: 'event', tick: this.tick, name: 'resumed', data: {} });
      }
    }

    if (this.state === 'paused') {
      this.prevInput = { ...this.currentInput };
      return this.pendingEvents;
    }

    if (this.state !== 'playing') {
      return this.pendingEvents;
    }

    const dt = 1 / 60;
    this.sim_tick += 1;
    this.time_left_s = Math.max(0, this.time_left_s - dt);

    // --- STEP 2: Decrement counters ---
    if (this.player.dash_cd_ticks > 0) this.player.dash_cd_ticks--;
    if (this.player.pulse_cd_ticks > 0) this.player.pulse_cd_ticks--;
    if (this.player.invuln_ticks > 0) this.player.invuln_ticks--;
    if (this.player.charm_ticks > 0) this.player.charm_ticks--;
    if (this.player.fall_wait_ticks > 0) this.player.fall_wait_ticks--;

    // Shade stunned & recoil counters (decremented in Step 2)
    for (const s of this.shades) {
      if (s.state === 'stunned') {
        if (s.push_ticks_left > 0) {
          s.push_ticks_left--;
        }
        if (s.state_ticks_left > 0) {
          s.state_ticks_left--;
          if (s.state_ticks_left <= 0) s.state = 'chase';
        }
      } else if (s.state === 'recoil') {
        if (s.state_ticks_left > 0) {
          s.state_ticks_left--;
          if (s.state_ticks_left <= 0) s.state = 'chase';
        }
      }
    }

    // TTL for dropped motes
    for (const m of this.motes) {
      if (m.active && m.ttl_ticks !== null && m.ttl_ticks !== undefined) {
        m.ttl_ticks--;
        if (m.ttl_ticks <= 0) {
          m.active = false;
        }
      }
    }

    // Charm respawn counters
    for (const c of this.charms) {
      if (!c.available) {
        c.respawn_ticks--;
        if (c.respawn_ticks <= 0) {
          c.available = true;
        }
      }
    }

    // --- STEP 3: Move May (jump, dash, jump pads, wind) & check fall ---
    this.updatePlayerMovement(dt);

    // --- STEP 4: Pickup motes & charms ---
    if (this.player.fall_wait_ticks <= 0) {
      this.checkMoteAndCharmPickups();
    }

    // --- STEP 5: Interact with lanterns ---
    if (this.player.fall_wait_ticks <= 0) {
      const interactTriggered = this.currentInput.interact && !this.prevInput.interact;
      if (interactTriggered) {
        this.handleInteract();
      }
    }

    // --- STEP 6: Update Safe Zones ---
    this.updateSafeZones(dt);

    // --- STEP 7: Pulse (Tỏa Sáng) ---
    const pulseTriggered = this.currentInput.pulse && !this.prevInput.pulse;
    if (pulseTriggered && this.player.fall_wait_ticks <= 0) {
      this.handlePulse();
    }

    // --- STEP 8: Move Shades & Drifters ---
    this.updateShades(dt);
    this.updateDrifters(dt);

    // --- STEP 9: Collisions (Drifters steal first, then Shades hit) ---
    if (this.player.fall_wait_ticks <= 0) {
      this.handleCollisions();
    }

    // --- STEP 10: Spawn motes, Shades, Drifters on schedule ---
    this.handleSpawns();

    // --- STEP 11: Check Win / Loss ---
    this.checkGameConditions();

    // Save previous input
    this.prevInput = { ...this.currentInput };

    return this.pendingEvents;
  }

  updatePlayerMovement(dt) {
    if (this.player.fall_wait_ticks > 0) {
      if (this.player.fall_wait_ticks === 1) {
        // Respawn at (0, 0, 0)
        this.player.pos = [0, 0, 0];
        this.player.vel = [0, 0, 0];
        this.player.grounded = true;
        this.player.invuln_ticks = this.tuning.invuln_ticks || 90;
      }
      return;
    }

    // Check Dash trigger
    const dashTriggered = this.currentInput.dash && !this.prevInput.dash;
    const canDash = this.player.charm_ticks > 0 || this.player.dash_cd_ticks <= 0;

    if (dashTriggered && canDash && this.player.dash_active_ticks <= 0) {
      this.player.dash_active_ticks = 12; // 0.2s = 12 ticks
      this.player.dash_cd_ticks = this.player.charm_ticks > 0 ? 0 : 90; // 1.5s = 90 ticks

      // Dash direction
      const [mx, mz] = this.currentInput.move;
      let len = Math.sqrt(mx * mx + mz * mz);
      let dx = this.player.facing_dir[0];
      let dz = this.player.facing_dir[1];

      if (len > 0.001) {
        const rad = ((this.currentInput.cam_yaw_deg || 0) * Math.PI) / 180;
        dx = (mx / len) * Math.cos(rad) + (mz / len) * Math.sin(rad);
        dz = -(mx / len) * Math.sin(rad) + (mz / len) * Math.cos(rad);
      }

      this.player.dash_vel = [dx * 14.0, dz * 14.0];
      this.pendingEvents.push({ type: 'event', tick: this.tick, name: 'dash', data: {} });
    }

    // Check Jump trigger
    const jumpTriggered = this.currentInput.jump && !this.prevInput.jump;
    if (jumpTriggered && this.player.grounded && this.player.dash_active_ticks <= 0) {
      this.player.vel[1] = this.tuning.jump_velocity || 7.0;
      this.player.grounded = false;
    }

    // Jump pads check (Night 2 and Night 3)
    if (this.night === 2 && this.player.grounded) {
      if (dist2D(this.player.pos, [20, 0, 18]) <= 1.0) {
        // Launch to B (70, 0, 0)
        const d = dist2D([20, 0, 18], [70, 0, 0]);
        const hx = (70 - 20) / d;
        const hz = (0 - 18) / d;
        this.player.launch_active = true;
        this.player.launch_vel = [hx * 24.0, 14.0, hz * 24.0];
        this.player.vel[1] = 14.0;
        this.player.grounded = false;
      } else if (dist2D(this.player.pos, [50, 0, -18]) <= 1.0) {
        // Launch to A (0, 0, 0)
        const d = dist2D([50, 0, -18], [0, 0, 0]);
        const hx = (0 - 50) / d;
        const hz = (0 - (-18)) / d;
        this.player.launch_active = true;
        this.player.launch_vel = [hx * 24.0, 14.0, hz * 24.0];
        this.player.vel[1] = 14.0;
        this.player.grounded = false;
      }
    } else if (this.night === 3 && this.player.grounded) {
      if (dist2D(this.player.pos, [0, 3, 13]) <= 1.0) {
        this.player.launch_active = true;
        this.player.launch_vel = [0, 12.0, -8.0];
        this.player.vel[1] = 12.0;
        this.player.grounded = false;
      }
    }

    // Apply movement
    if (this.player.dash_active_ticks > 0) {
      this.player.dash_active_ticks--;
      this.player.pos[0] = round3(this.player.pos[0] + this.player.dash_vel[0] * dt);
      this.player.pos[2] = round3(this.player.pos[2] + this.player.dash_vel[1] * dt);
      // Air dash maintains altitude
    } else if (this.player.launch_active) {
      this.player.pos[0] = round3(this.player.pos[0] + this.player.launch_vel[0] * dt);
      this.player.pos[2] = round3(this.player.pos[2] + this.player.launch_vel[2] * dt);
      this.player.vel[1] += (this.tuning.gravity || -20.0) * dt;
      this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] * dt);
    } else {
      // Normal running movement
      const [mx, mz] = this.currentInput.move;
      const len = Math.sqrt(mx * mx + mz * mz);
      const speed = this.player.charm_ticks > 0 ? (this.tuning.charm_speed || 7.2) : (this.tuning.player_speed || 6.0);

      if (len > 0.001) {
        const nx = len > 1.0 ? mx / len : mx;
        const nz = len > 1.0 ? mz / len : mz;
        const rad = ((this.currentInput.cam_yaw_deg || 0) * Math.PI) / 180;
        const wx = nx * Math.cos(rad) + nz * Math.sin(rad);
        const wz = -nx * Math.sin(rad) + nz * Math.cos(rad);

        this.player.facing_dir = [wx, wz];
        this.player.pos[0] = round3(this.player.pos[0] + wx * speed * dt);
        this.player.pos[2] = round3(this.player.pos[2] + wz * speed * dt);
      }

      // Wind push on Night 3
      if (this.wind.active) {
        const wRad = (this.wind.dir_deg * Math.PI) / 180;
        this.player.pos[0] = round3(this.player.pos[0] + Math.cos(wRad) * 2.0 * dt);
        this.player.pos[2] = round3(this.player.pos[2] + Math.sin(wRad) * 2.0 * dt);
      }

      // Vertical gravity & ground check
      if (!this.player.grounded) {
        this.player.vel[1] += (this.tuning.gravity || -20.0) * dt;
        this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] * dt);
      }
    }

    // Ground check
    const gh = this.getGroundHeight(this.player.pos[0], this.player.pos[2]);
    if (gh === -999) {
      this.player.grounded = false;
    } else if (this.player.pos[1] <= gh) {
      this.player.pos[1] = gh;
      this.player.vel[1] = 0;
      this.player.grounded = true;
      this.player.launch_active = false;
    } else if (this.player.pos[1] > gh && this.player.dash_active_ticks <= 0) {
      this.player.grounded = false;
    }

    // Check Fall off island (Y < -10)
    if (this.player.pos[1] < (this.tuning.fall_threshold_y || -10.0)) {
      this.player.flames -= 1;
      const dropped = this.player.carried;
      this.player.carried = 0;
      this.player.fall_wait_ticks = this.tuning.fall_wait_ticks || 60;
      this.player.launch_active = false;

      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'player_hit',
        data: {
          by: 'fall',
          flames: this.player.flames,
          dropped: dropped,
          lost: true,
        },
      });
    }
  }

  checkMoteAndCharmPickups() {
    const pickupR = this.tuning.pickup_radius || 1.0;
    const pickupH = this.tuning.pickup_height || 1.5;
    const capacity = this.tuning.carry_capacity || 10;

    // Pick motes
    for (const m of this.motes) {
      if (!m.active) continue;
      const dXZ = dist2D(this.player.pos, m.pos);
      const dY = Math.abs(this.player.pos[1] - m.pos[1]);

      if (dXZ <= pickupR && dY <= pickupH) {
        if (this.player.carried < capacity) {
          m.active = false;
          this.player.carried += 1;
          this.score += this.tuning.score.per_mote || 10;

          this.pendingEvents.push({
            type: 'event',
            tick: this.tick,
            name: 'mote_picked',
            data: { carried: this.player.carried },
          });
        }
      }
    }

    // Pick charms
    for (const c of this.charms) {
      if (!c.available) continue;
      const dXZ = dist2D(this.player.pos, c.pos);
      const dY = Math.abs(this.player.pos[1] - c.pos[1]);

      if (dXZ <= pickupR && dY <= pickupH) {
        c.available = false;
        c.respawn_ticks = this.tuning.charm_respawn_ticks || 2700;
        this.player.charm_ticks = this.tuning.charm_duration_ticks || 600;

        this.pendingEvents.push({
          type: 'event',
          tick: this.tick,
          name: 'charm_picked',
          data: {
            charm_id: c.id,
            charm_ticks: this.player.charm_ticks,
          },
        });
      }
    }
  }

  handleInteract() {
    const interactR = this.tuning.interact_radius || 2.0;
    const cost = this.tuning.lantern_cost || 10;

    // Select closest unlit lantern
    let target = null;
    let minDist = Infinity;

    for (const l of this.lanterns) {
      if (l.lit) continue;
      const d = dist2D(this.player.pos, l.pos);
      if (d <= interactR) {
        if (d < minDist || (Math.abs(d - minDist) < 0.001 && target && l.id < target.id)) {
          minDist = d;
          target = l;
        }
      }
    }

    if (target && this.player.carried > 0) {
      const needed = cost - target.deposited;
      const toDeposit = Math.min(this.player.carried, needed);
      target.deposited += toDeposit;
      this.player.carried -= toDeposit;

      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'deposit',
        data: {
          lantern_id: target.id,
          amount: toDeposit,
          deposited: target.deposited,
        },
      });

      if (target.deposited >= cost) {
        target.lit = true;
        this.score += this.tuning.score.per_lantern || 100;

        // Push any shade inside safe zone
        for (const s of this.shades) {
          if (dist2D(s.pos, target.pos) < (this.tuning.safe_radius || 6.0)) {
            s.safe_push_ticks_left = this.tuning.safe_push_ticks || 30;
          }
        }

        this.pendingEvents.push({
          type: 'event',
          tick: this.tick,
          name: 'lantern_lit',
          data: { lantern_id: target.id },
        });
      }
    }
  }

  updateSafeZones(dt) {
    const safeR = this.tuning.safe_radius || 6.0;

    for (const s of this.shades) {
      if (s.safe_push_ticks_left > 0) {
        s.safe_push_ticks_left--;
        // Push shade outwards towards safe edge
        for (const l of this.lanterns) {
          if (l.lit) {
            const d = dist2D(s.pos, l.pos);
            if (d < safeR && d > 0.001) {
              const pushX = (s.pos[0] - l.pos[0]) / d;
              const pushZ = (s.pos[2] - l.pos[2]) / d;
              s.pos[0] = round3(s.pos[0] + pushX * 0.25);
              s.pos[2] = round3(s.pos[2] + pushZ * 0.25);
            }
          }
        }
      }
    }
  }

  handlePulse() {
    const cost = this.tuning.pulse_cost || 3;
    if (this.player.carried < cost) return;
    if (this.player.pulse_cd_ticks > 0) return;

    this.player.carried -= cost;
    this.player.pulse_cd_ticks = Math.round((this.tuning.pulse_cooldown_s || 3.0) * 60);

    const pulseCenter = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];
    const stunnedIds = [];

    // Target shades
    for (const s of this.shades) {
      const shadeCenter = [s.pos[0], s.pos[1] + 0.8, s.pos[2]];
      if (dist3D(pulseCenter, shadeCenter) <= (this.tuning.pulse_radius || 5.0)) {
        s.state = 'stunned';
        s.state_ticks_left = this.tuning.pulse_stun_ticks || 120;
        s.push_ticks_left = 15;

        // Push dir
        const d2 = dist2D(this.player.pos, s.pos);
        if (d2 > 0.001) {
          s.push_vel = [
            ((s.pos[0] - this.player.pos[0]) / d2) * (4.0 / 15),
            ((s.pos[2] - this.player.pos[2]) / d2) * (4.0 / 15),
          ];
        } else {
          s.push_vel = [4.0 / 15, 0];
        }

        stunnedIds.push(s.id);
        this.score += this.tuning.score.per_stun || 5;
      }
    }

    // Target drifters
    for (const d of this.drifters) {
      if (dist3D(pulseCenter, d.pos) <= (this.tuning.pulse_radius || 5.0)) {
        if (d.state === 'chase') {
          d.state = 'flee';
          d.flee_ticks_left = this.tuning.drifter_flee_ticks || 240;
        } else if (d.state === 'flee' && d.stolen > 0) {
          // Drop stolen motes at current spot
          for (let i = 0; i < d.stolen; i++) {
            this.motes.push({
              id: `M${this.nextMoteId++}`,
              pos: [d.pos[0], d.pos[1], d.pos[2]],
              kind: 'dropped',
              ttl_ticks: this.tuning.mote_ttl_ticks || 480,
              active: true,
            });
          }
          this.pendingEvents.push({
            type: 'event',
            tick: this.tick,
            name: 'drifter_drop',
            data: { drifter_id: d.id, amount: d.stolen },
          });
          d.stolen = 0;
          d.flee_ticks_left = 120;
        }
      }
    }

    this.pendingEvents.push({
      type: 'event',
      tick: this.tick,
      name: 'pulse',
      data: { stunned_ids: stunnedIds },
    });
  }

  updateShades(dt) {
    const baseSpeed = this.night === 3 ? (this.tuning.shade_speed_night3 || 4.5) : (this.tuning.shade_speed_night1 || 4.0);
    const detectR = this.tuning.shade_detect_radius || 12.0;
    const loseR = this.tuning.shade_lose_radius || 18.0;
    const safeR = this.tuning.safe_radius || 6.0;

    for (const s of this.shades) {
      if (s.state === 'spawning') {
        if (s.state_ticks_left > 0) s.state_ticks_left--;
        else s.state = 'wander';
        continue;
      }

      if (s.state === 'stunned') {
        if (s.push_ticks_left > 0) {
          s.pos[0] = round3(s.pos[0] + s.push_vel[0]);
          s.pos[2] = round3(s.pos[2] + s.push_vel[1]);
        }
        continue;
      }

      if (s.state === 'recoil') {
        if (s.state_ticks_left > 0) {
          s.pos[0] = round3(s.pos[0] + s.push_vel[0]);
          s.pos[2] = round3(s.pos[2] + s.push_vel[1]);
        }
        continue;
      }

      const d = dist2D(s.pos, this.player.pos);

      if (s.state === 'wander') {
        if (d <= detectR) {
          s.state = 'chase';
        }
      } else if (s.state === 'chase') {
        if (d > loseR) {
          s.state = 'wander';
        } else if (d > 0.001) {
          const dirX = (this.player.pos[0] - s.pos[0]) / d;
          const dirZ = (this.player.pos[2] - s.pos[2]) / d;
          const nextX = s.pos[0] + dirX * baseSpeed * dt;
          const nextZ = s.pos[2] + dirZ * baseSpeed * dt;

          // Check safe zones
          let blocked = false;
          for (const l of this.lanterns) {
            if (l.lit && dist2D([nextX, 0, nextZ], l.pos) < safeR) {
              blocked = true;
              break;
            }
          }

          if (!blocked) {
            s.pos[0] = round3(nextX);
            s.pos[2] = round3(nextZ);
          }
        }
      }
    }
  }

  updateDrifters(dt) {
    const drifterSpeed = this.tuning.drifter_speed || 7.0;

    for (let i = this.drifters.length - 1; i >= 0; i--) {
      const d = this.drifters[i];
      const dist = dist2D(d.pos, this.player.pos);

      if (d.state === 'idle') {
        if (this.player.carried >= 5 && dist <= (this.tuning.drifter_detect_radius || 15.0)) {
          d.state = 'chase';
        }
      } else if (d.state === 'chase') {
        if (this.player.carried < 5 || dist > 20.0) {
          d.state = 'idle';
        } else if (dist > 0.001) {
          const dirX = (this.player.pos[0] - d.pos[0]) / dist;
          const dirZ = (this.player.pos[2] - d.pos[2]) / dist;
          d.pos[0] = round3(d.pos[0] + dirX * drifterSpeed * dt);
          d.pos[2] = round3(d.pos[2] + dirZ * drifterSpeed * dt);
        }
      } else if (d.state === 'flee') {
        d.flee_ticks_left--;
        if (dist > 0.001) {
          const dirX = (d.pos[0] - this.player.pos[0]) / dist;
          const dirZ = (d.pos[2] - this.player.pos[2]) / dist;
          d.pos[0] = round3(d.pos[0] + dirX * drifterSpeed * dt);
          d.pos[2] = round3(d.pos[2] + dirZ * drifterSpeed * dt);
        }
        if (d.flee_ticks_left <= 0) {
          this.drifters.splice(i, 1);
        }
      }
    }
  }

  handleCollisions() {
    // 1. Drifter steal first
    for (const d of this.drifters) {
      if (d.state === 'chase' && dist2D(d.pos, this.player.pos) <= 1.2) {
        const stolen = Math.min(3, this.player.carried);
        this.player.carried -= stolen;
        d.stolen = stolen;
        d.state = 'flee';
        d.flee_ticks_left = this.tuning.drifter_flee_ticks || 240;

        this.pendingEvents.push({
          type: 'event',
          tick: this.tick,
          name: 'drifter_steal',
          data: {
            drifter_id: d.id,
            amount: stolen,
            carried: this.player.carried,
          },
        });
      }
    }

    // 2. Shades hit (sorted by id ascending)
    const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id));
    let hitAppliedThisTick = false;

    for (const s of sortedShades) {
      if (s.state !== 'chase') continue;
      if (s.safe_push_ticks_left > 0) continue;

      const dXZ = dist2D(s.pos, this.player.pos);
      const dY = Math.abs(s.pos[1] - this.player.pos[1]);

      if (dXZ <= (this.tuning.shade_hit_radius || 1.0) && dY <= (this.tuning.shade_hit_height || 1.5)) {
        if (!hitAppliedThisTick && this.player.invuln_ticks <= 0) {
          hitAppliedThisTick = true;
          this.player.flames -= 1;
          this.player.invuln_ticks = this.tuning.invuln_ticks || 90;

          // Recoil shade 2m in 60 ticks
          s.state = 'recoil';
          s.state_ticks_left = 60;
          if (dXZ > 0.001) {
            s.push_vel = [
              ((s.pos[0] - this.player.pos[0]) / dXZ) * (2.0 / 60),
              ((s.pos[2] - this.player.pos[2]) / dXZ) * (2.0 / 60),
            ];
          } else {
            s.push_vel = [2.0 / 60, 0];
          }

          // Drop floor(carried / 2) motes in ring 1.5 - 2.5m
          const dropCount = Math.floor(this.player.carried / 2);
          this.player.carried -= dropCount;

          for (let k = 0; k < dropCount; k++) {
            const rad = this.rng.range(0, 2 * Math.PI);
            const r = this.rng.range(1.5, 2.5);
            this.motes.push({
              id: `M${this.nextMoteId++}`,
              pos: [
                round3(this.player.pos[0] + r * Math.cos(rad)),
                this.player.pos[1],
                round3(this.player.pos[2] + r * Math.sin(rad)),
              ],
              kind: 'dropped',
              ttl_ticks: this.tuning.mote_ttl_ticks || 480,
              active: true,
            });
          }

          this.pendingEvents.push({
            type: 'event',
            tick: this.tick,
            name: 'player_hit',
            data: {
              by: 'shade',
              flames: this.player.flames,
              dropped: dropCount,
              lost: this.player.flames <= 0,
            },
          });
        }
      }
    }
  }

  handleSpawns() {
    // 1. Mote respawn every 240 ticks if < 30
    if (this.sim_tick % 240 === 0) {
      const activeCount = this.motes.filter((m) => m.active).length;
      if (activeCount < 30 && this.moteSpawnPoints.length > 0) {
        // Pick empty point
        const emptyPoints = this.moteSpawnPoints.filter((pt) => {
          return !this.motes.some((m) => m.active && dist2D(m.pos, pt) < 0.5);
        });
        if (emptyPoints.length > 0) {
          const pt = emptyPoints[this.rng.rangeInt(0, emptyPoints.length - 1)];
          this.motes.push({
            id: `M${this.nextMoteId++}`,
            pos: [pt[0], pt[1], pt[2]],
            kind: 'random',
            ttl_ticks: null,
            active: true,
          });
        }
      }
    }

    // 2. Shades spawn schedule
    let spawnInterval = 480; // Night 1: 8s
    let maxShades = 6;
    if (this.night === 2) {
      spawnInterval = 420; // 7s
      maxShades = 8;
    } else if (this.night === 3) {
      spawnInterval = 360; // 6s
      maxShades = 10;
    }

    if (this.sim_tick === 300) {
      // First 2 shades at 5s
      for (let i = 0; i < 2 && this.shades.length < maxShades; i++) {
        this.spawnShade();
      }
    } else if (this.sim_tick > 300 && (this.sim_tick - 300) % spawnInterval === 0) {
      if (this.shades.length < maxShades) {
        this.spawnShade();
      }
    }

    // 3. Drifters spawn (Night 2 and 3 at tick 1200, 2400...)
    if ((this.night === 2 || this.night === 3) && this.sim_tick > 0 && this.sim_tick % 1200 === 0) {
      if (this.drifters.length < 2) {
        const rad = this.rng.range(0, 2 * Math.PI);
        const r = this.night === 2 ? 25 : 35;
        this.drifters.push({
          id: `D${this.nextDrifterId++}`,
          pos: [round3(r * Math.cos(rad)), 2.0, round3(r * Math.sin(rad))],
          state: 'idle',
          stolen: 0,
          flee_ticks_left: 0,
        });
      }
    }

    // 4. Wind cycle (Night 3: every 30s = 1800 ticks, duration 5s = 300 ticks)
    if (this.night === 3) {
      const cycle = this.sim_tick % 1800;
      if (cycle >= 1680 && cycle < 1800) {
        this.wind.warning = true;
      } else {
        this.wind.warning = false;
      }

      if (cycle >= 0 && cycle < 300) {
        if (!this.wind.active) {
          this.wind.active = true;
          this.wind.dir_deg = round3(this.rng.range(0, 360));
        }
      } else {
        this.wind.active = false;
      }
    }
  }

  spawnShade() {
    const validPoints = this.shadeSpawnPoints.filter((pt) => dist2D(pt, this.player.pos) >= 15.0);
    if (validPoints.length > 0) {
      const pt = validPoints[this.rng.rangeInt(0, validPoints.length - 1)];
      const id = `S${this.nextShadeId++}`;
      this.shades.push({
        id,
        pos: [pt[0], pt[1], pt[2]],
        state: 'spawning',
        state_ticks_left: 30,
        push_vel: [0, 0],
        push_ticks_left: 0,
        safe_push_ticks_left: 0,
      });
      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'shade_spawned',
        data: { id },
      });
    }
  }

  checkGameConditions() {
    if (this.player.flames <= 0) {
      this.state = 'lost';
      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'game_over',
        data: { result: 'lost', reason: 'no_flames' },
      });
      return;
    }

    const allLit = this.lanterns.length > 0 && this.lanterns.every((l) => l.lit);
    if (allLit) {
      this.state = 'won';
      const timeBonus = Math.floor(this.time_left_s) * (this.tuning.score.per_second_left || 2);
      const flameBonus = this.player.flames * (this.tuning.score.per_flame_left || 50);
      this.score += timeBonus + flameBonus;

      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'game_over',
        data: { result: 'won', reason: 'all_lit' },
      });
      return;
    }

    if (this.time_left_s <= 0) {
      this.state = 'lost';
      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'game_over',
        data: { result: 'lost', reason: 'dawn' },
      });
      return;
    }
  }

  getSnapshot() {
    return {
      type: 'snapshot',
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      night: this.night,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: this.wind.dir_deg,
      },
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        vel: [round3(this.player.vel[0]), round3(this.player.vel[1]), round3(this.player.vel[2])],
        grounded: this.player.grounded,
        flames: this.player.flames,
        carried: this.player.carried,
        invuln: this.player.invuln_ticks > 0,
        dash_cd_s: round3(this.player.dash_cd_ticks / 60),
        pulse_cd_s: round3(this.player.pulse_cd_ticks / 60),
        charm_s: round3(this.player.charm_ticks / 60),
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited,
      })),
      shades: this.shades.map((s) => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state,
      })),
      motes: this.motes
        .filter((m) => m.active)
        .map((m) => ({
          id: m.id,
          pos: [round3(m.pos[0]), round3(m.pos[1]), round3(m.pos[2])],
          kind: m.kind,
          ttl_s: m.ttl_ticks !== null ? round3(m.ttl_ticks / 60) : null,
        })),
      drifters: this.drifters.map((d) => ({
        id: d.id,
        pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
        state: d.state,
        stolen: d.stolen,
      })),
      charms: this.charms.map((c) => ({
        id: c.id,
        available: c.available,
        respawn_s: round3(c.respawn_ticks / 60),
      })),
      motes_active: this.motes.filter((m) => m.active).length,
    };
  }

  getEndReport() {
    return {
      type: 'end',
      ticks: this.tick,
      state: this.state,
      score: this.score,
    };
  }
}
