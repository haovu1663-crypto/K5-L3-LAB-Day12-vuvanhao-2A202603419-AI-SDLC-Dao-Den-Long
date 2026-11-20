import { PRNG } from './prng.js';

export function round3(val) {
  return Number(Number(val).toFixed(3));
}

export function round1(val) {
  return Number(Number(val).toFixed(1));
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
  capacity_max: 20,
  lantern_cost: 10,
  relight_cost: 5,
  fuel_max: 100,
  fuel_decay_per_s: 1.0,
  fuel_per_mote: 10,
  low_fuel_threshold: 30,
  drain_per_s: 5,
  win_ratio: 0.6,
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
  night1_duration_s: 240,
  night2_duration_s: 270,
  night3_duration_s: 300,
  flames: 3,
  score: {
    per_mote: 5,
    per_lantern_first: 100,
    per_lantern_relight: 40,
    per_stun: 5,
    per_stun_drain: 15,
    dawn_per_flame: 50,
    dawn_per_lit_lantern: 50,
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
      1: this.tuning.night1_duration_s || 240,
      2: this.tuning.night2_duration_s || 270,
      3: this.tuning.night3_duration_s || 300,
    };
    this.time_left_s = durations[this.night] || 240;

    // Player state
    this.player = {
      pos: [0, 0, 0],
      vel: [0, 0, 0],
      facing_dir: [0, 1], // +Z facing
      grounded: true,
      carried: 0,
      flames: this.tuning.flames || 3,
      successful_lights: 0,
      blast_charges: 0,
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

    this.moteSpawnPoints = [];
    this.shadeSpawnPoints = [];
    this.pendingEvents = [];

    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      dash: false,
      interact: false,
      pulse: false,
      blast: false,
      pause: false,
    };
    this.prevInput = { ...this.currentInput };

    this.initMap(this.night);
  }

  getCapacity() {
    const base = this.tuning.carry_capacity || 10;
    const maxCap = this.tuning.capacity_max || 20;
    return Math.min(maxCap, base + 2 * (this.player.successful_lights || 0));
  }

  initMap(night) {
    if (night === 1) {
      this.lanterns = [
        { id: 'L1', pos: [0, 0, 25], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L2', pos: [23.8, 0, 7.7], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L3', pos: [14.7, 0, -20.2], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L4', pos: [-14.7, 0, -20.2], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L5', pos: [-23.8, 0, 7.7], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
      ];

      this.moteSpawnPoints = [];
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(12 * Math.cos(rad)), 0, round3(12 * Math.sin(rad))]);
      }
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        this.moteSpawnPoints.push([round3(33 * Math.cos(rad)), 0, round3(33 * Math.sin(rad))]);
      }

      this.shadeSpawnPoints = [];
      for (let i = 0; i < 12; i++) {
        const deg = 15 + i * 30;
        const rad = (deg * Math.PI) / 180;
        this.shadeSpawnPoints.push([round3(37 * Math.cos(rad)), 0, round3(37 * Math.sin(rad))]);
      }

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
      this.lanterns = [
        { id: 'L1', pos: [0, 0, 20], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L2', pos: [17, 0, -10], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L3', pos: [-17, 0, -10], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L4', pos: [70, 0, 20], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L5', pos: [87, 0, -10], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L6', pos: [53, 0, -10], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
      ];

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

      this.shadeSpawnPoints = [];
      [ [0, 0], [70, 0] ].forEach(([cx, cz]) => {
        for (let i = 0; i < 8; i++) {
          const deg = 22.5 + i * 45;
          const rad = (deg * Math.PI) / 180;
          this.shadeSpawnPoints.push([round3(cx + 26 * Math.cos(rad)), 0, round3(cz + 26 * Math.sin(rad))]);
        }
      });

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

      this.charms = [
        { id: 'C1', pos: [35, 0, 0], available: true, respawn_ticks: 0 },
      ];
    } else if (night === 3) {
      this.lanterns = [
        { id: 'L1', pos: [0, 6, 6], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L2', pos: [18, 3, 10], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L3', pos: [-18, 3, 10], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L4', pos: [35, 0, -10], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L5', pos: [-35, 0, -10], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L6', pos: [20, 0, -35], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
        { id: 'L7', pos: [-20, 0, -35], lit: false, deposited: 0, fuel_ticks: 0, ever_lit: false, relit_count: 0 },
      ];

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

      this.shadeSpawnPoints = [];
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        this.shadeSpawnPoints.push([round3(43 * Math.cos(rad)), 0, round3(43 * Math.sin(rad))]);
      }

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
      if (x >= 26 && x <= 44 && z >= -2 && z <= 2) return 0;
      return -999;
    } else if (this.night === 3) {
      const d = Math.sqrt(x * x + z * z);
      if (d > 45) return -999;
      if (d <= 2.0 && this.player.pos[1] >= 6) return 6;
      if (d <= 8) return 6;
      if (d >= 12 && d <= 24 && z > 0) return 3;
      return 0;
    }
    return 0;
  }

  applyScenario(scenario) {
    if (!scenario) return;

    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
      if (scenario.player.successful_lights !== undefined) this.player.successful_lights = scenario.player.successful_lights;
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
        const isLit = update.lit !== undefined ? update.lit : (l ? l.lit : false);
        let fuelVal = update.fuel !== undefined ? update.fuel : (isLit ? 100 : 0);

        if (l) {
          if (update.pos) l.pos = [...update.pos];
          if (update.deposited !== undefined) l.deposited = update.deposited;
          l.lit = isLit;
          l.fuel_ticks = Math.round(fuelVal * 60);
          if (update.ever_lit !== undefined) l.ever_lit = update.ever_lit;
          else if (isLit) l.ever_lit = true;
          if (update.relit_count !== undefined) l.relit_count = update.relit_count;
        } else {
          this.lanterns.push({
            id: update.id,
            pos: update.pos ? [...update.pos] : [0, 0, 0],
            lit: isLit,
            deposited: update.deposited || 0,
            fuel_ticks: Math.round(fuelVal * 60),
            ever_lit: update.ever_lit !== undefined ? update.ever_lit : isLit,
            relit_count: update.relit_count || 0,
          });
        }
      }
    }

    if (scenario.random_motes === false || scenario.motes !== undefined) {
      this.motes = [];
      if (scenario.motes) {
        for (const m of scenario.motes) {
          const pos = Array.isArray(m) ? m : (m.pos || [0, 0, 0]);
          this.motes.push({
            id: `M${this.nextMoteId++}`,
            pos: [pos[0], pos[1] !== undefined ? pos[1] : 0, pos[2]],
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
            target_lantern_id: s.target_lantern_id || null,
            drain_ticks: 0,
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
    const fields = newInputFields && newInputFields.input ? newInputFields.input : newInputFields;
    this.currentInput = {
      ...this.currentInput,
      ...fields,
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

    // --- STEP 2: Decrement counters & Deduct Lantern Fuel ---
    if (this.player.dash_cd_ticks > 0) this.player.dash_cd_ticks--;
    if (this.player.pulse_cd_ticks > 0) this.player.pulse_cd_ticks--;
    if (this.player.invuln_ticks > 0) this.player.invuln_ticks--;
    if (this.player.charm_ticks > 0) this.player.charm_ticks--;
    if (this.player.fall_wait_ticks > 0) this.player.fall_wait_ticks--;

    for (const s of this.shades) {
      if (s.state === 'stunned') {
        if (s.push_ticks_left > 0) s.push_ticks_left--;
        if (s.state_ticks_left > 0) {
          s.state_ticks_left--;
          if (s.state_ticks_left <= 0) s.state = 'wander'; // Hết choáng thì về wander theo Ticket-03
        }
      } else if (s.state === 'recoil') {
        if (s.state_ticks_left > 0) {
          s.state_ticks_left--;
          if (s.state_ticks_left <= 0) s.state = 'chase';
        }
      }
    }

    for (const m of this.motes) {
      if (m.active && m.ttl_ticks !== null && m.ttl_ticks !== undefined) {
        m.ttl_ticks--;
        if (m.ttl_ticks <= 0) m.active = false;
      }
    }

    for (const c of this.charms) {
      if (!c.available) {
        c.respawn_ticks--;
        if (c.respawn_ticks <= 0) c.available = true;
      }
    }

    // Deduct lantern fuel: natural decay 1/s (1 tick per step) + draining shades (5 ticks per shade per step)
    for (const l of this.lanterns) {
      if (l.lit) {
        // Natural decay
        let decayAmount = 1;

        // Drain by shades
        for (const s of this.shades) {
          if (s.state === 'drain' && s.target_lantern_id === l.id) {
            decayAmount += 5;
            s.drain_ticks = (s.drain_ticks || 0) + 1;
            // Emit fuel_drain every 60 ticks while draining
            if (s.drain_ticks % 60 === 1 || s.drain_ticks === 1) {
              this.pendingEvents.push({
                type: 'event',
                tick: this.tick,
                name: 'fuel_drain',
                data: {
                  lantern_id: l.id,
                  shade_id: s.id,
                  fuel: round1(Math.max(0, l.fuel_ticks - decayAmount) / 60),
                },
              });
            }
          }
        }

        l.fuel_ticks = Math.max(0, l.fuel_ticks - decayAmount);

        // Check if fuel <= 0 immediately after Step 2
        if (l.fuel_ticks <= 0) {
          l.lit = false;
          l.deposited = 0;
          l.ever_lit = true;
          this.pendingEvents.push({
            type: 'event',
            tick: this.tick,
            name: 'lantern_out',
            data: { lantern_id: l.id },
          });
        }
      }
    }

    // --- STEP 3: Move May (jump, dash, jump pads, wind) & check fall ---
    this.updatePlayerMovement(dt);

    // --- STEP 4: Pickup motes & charms ---
    if (this.player.fall_wait_ticks <= 0) {
      this.checkMoteAndCharmPickups();
    }

    // --- STEP 5: Interact with lanterns (Refuel / Light / Relight) ---
    if (this.player.fall_wait_ticks <= 0) {
      const interactTriggered = this.currentInput.interact && !this.prevInput.interact;
      if (interactTriggered) {
        this.handleInteract();
      }
    }

    // --- STEP 6: Update Safe Zones ---
    this.updateSafeZones(dt);

    // --- STEP 7: Pulse (Tỏa Sáng) & Firefly Blast (Chưởng Đom Đóm) ---
    const pulseTriggered = this.currentInput.pulse && !this.prevInput.pulse;
    if (pulseTriggered && this.player.fall_wait_ticks <= 0) {
      this.handlePulse();
    }
    const blastTriggered = this.currentInput.blast && !this.prevInput.blast;
    if (blastTriggered && this.player.fall_wait_ticks <= 0) {
      const rad = ((this.currentInput.cam_yaw_deg || 0) * Math.PI) / 180;
      const fwdX = Math.sin(rad);
      const fwdZ = Math.cos(rad);
      this.castBlast(fwdX, fwdZ, 14.0);
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

    // --- STEP 11: Check Win / Loss (After all updates) ---
    this.checkGameConditions();

    this.prevInput = { ...this.currentInput };
    return this.pendingEvents;
  }

  updatePlayerMovement(dt) {
    if (this.player.fall_wait_ticks > 0) {
      if (this.player.fall_wait_ticks === 1) {
        this.player.pos = [0, 0, 0];
        this.player.vel = [0, 0, 0];
        this.player.grounded = true;
        this.player.invuln_ticks = this.tuning.invuln_ticks || 90;
      }
      return;
    }

    const dashTriggered = this.currentInput.dash && !this.prevInput.dash;
    const canDash = this.player.charm_ticks > 0 || this.player.dash_cd_ticks <= 0;

    if (dashTriggered && canDash && this.player.dash_active_ticks <= 0) {
      this.player.dash_active_ticks = 12;
      this.player.dash_cd_ticks = this.player.charm_ticks > 0 ? 0 : 90;

      const [mx, mz] = this.currentInput.move;
      const len = Math.sqrt(mx * mx + mz * mz);
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

    const jumpTriggered = this.currentInput.jump && !this.prevInput.jump;
    if (jumpTriggered && this.player.grounded && this.player.dash_active_ticks <= 0) {
      this.player.vel[1] = this.tuning.jump_velocity || 7.0;
      this.player.grounded = false;
    }

    // Jump pads check
    if (this.night === 2 && this.player.grounded) {
      if (dist2D(this.player.pos, [20, 0, 18]) <= 1.0) {
        const d = dist2D([20, 0, 18], [70, 0, 0]);
        this.player.launch_active = true;
        this.player.launch_vel = [((70 - 20) / d) * 24.0, 14.0, ((0 - 18) / d) * 24.0];
        this.player.vel[1] = 14.0;
        this.player.grounded = false;
      } else if (dist2D(this.player.pos, [50, 0, -18]) <= 1.0) {
        const d = dist2D([50, 0, -18], [0, 0, 0]);
        this.player.launch_active = true;
        this.player.launch_vel = [((0 - 50) / d) * 24.0, 14.0, ((0 - (-18)) / d) * 24.0];
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

    if (this.player.dash_active_ticks > 0) {
      this.player.dash_active_ticks--;
      this.player.pos[0] = round3(this.player.pos[0] + this.player.dash_vel[0] * dt);
      this.player.pos[2] = round3(this.player.pos[2] + this.player.dash_vel[1] * dt);
    } else if (this.player.launch_active) {
      this.player.pos[0] = round3(this.player.pos[0] + this.player.launch_vel[0] * dt);
      this.player.pos[2] = round3(this.player.pos[2] + this.player.launch_vel[2] * dt);
      this.player.vel[1] += (this.tuning.gravity || -20.0) * dt;
      this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] * dt);
    } else {
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

      if (this.wind.active) {
        const wRad = (this.wind.dir_deg * Math.PI) / 180;
        this.player.pos[0] = round3(this.player.pos[0] + Math.cos(wRad) * 2.0 * dt);
        this.player.pos[2] = round3(this.player.pos[2] + Math.sin(wRad) * 2.0 * dt);
      }

      if (!this.player.grounded) {
        this.player.vel[1] += (this.tuning.gravity || -20.0) * dt;
        this.player.pos[1] = round3(this.player.pos[1] + this.player.vel[1] * dt);
      }
    }

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
          lost: this.player.flames <= 0,
        },
      });
    }
  }

  checkMoteAndCharmPickups() {
    const pickupR = this.tuning.pickup_radius || 1.0;
    const pickupH = this.tuning.pickup_height || 1.5;
    const capacity = this.getCapacity();

    for (const m of this.motes) {
      if (!m.active) continue;
      const dXZ = dist2D(this.player.pos, m.pos);
      const dY = Math.abs(this.player.pos[1] - m.pos[1]);

      if (dXZ <= pickupR && dY <= pickupH) {
        if (this.player.carried < capacity) {
          m.active = false;
          this.player.carried += 1;
          this.player.blast_charges = (this.player.blast_charges || 0) + 1;
          // Ticket-03 [THAY THẾ]: Nhặt đom đóm không cộng điểm; chỉ cộng khi nạp/châm dầu vào đèn (+5)

          this.pendingEvents.push({
            type: 'event',
            tick: this.tick,
            name: 'mote_picked',
            data: { carried: this.player.carried, blast_charges: this.player.blast_charges },
          });
        }
      }
    }

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

    // Filter eligible lanterns (unlit, OR lit but fuel < 100)
    let candidates = [];
    for (const l of this.lanterns) {
      const d = dist2D(this.player.pos, l.pos);
      if (d <= interactR) {
        if (!l.lit) {
          candidates.push({ lantern: l, dist: d });
        } else if (l.fuel_ticks < 6000) {
          candidates.push({ lantern: l, dist: d });
        }
      }
    }

    if (candidates.length === 0) return;

    // Pick closest, smallest id if tied
    candidates.sort((a, b) => {
      if (Math.abs(a.dist - b.dist) > 0.001) return a.dist - b.dist;
      return a.lantern.id.localeCompare(b.lantern.id);
    });

    const target = candidates[0].lantern;

    if (this.player.carried <= 0) return;

    if (target.lit) {
      // Châm dầu (Refuel): used = min(carried, ceil((100 - fuel) / 10))
      const currentFuel = target.fuel_ticks / 60;
      const neededMotes = Math.ceil((100 - currentFuel) / 10);
      const used = Math.min(this.player.carried, neededMotes);

      if (used > 0) {
        target.fuel_ticks = Math.min(6000, target.fuel_ticks + used * 600);
        this.player.carried -= used;
        this.score += used * (this.tuning.score.per_mote || 5);

        // If fuel reaches >= 30, push any shades within 6m
        if (target.fuel_ticks >= 1800) {
          for (const s of this.shades) {
            if (dist2D(s.pos, target.pos) < (this.tuning.safe_radius || 6.0)) {
              s.safe_push_ticks_left = this.tuning.safe_push_ticks || 30;
              if (s.state === 'drain' && s.target_lantern_id === target.id) {
                s.state = 'wander';
                s.target_lantern_id = null;
              }
            }
          }
        }

        this.pendingEvents.push({
          type: 'event',
          tick: this.tick,
          name: 'refuel',
          data: {
            lantern_id: target.id,
            amount: used,
            fuel: round1(target.fuel_ticks / 60),
          },
        });
      }
    } else {
      // Thắp mới (10 đom đóm) hoặc Thắp lại (5 đom đóm)
      const cost = target.ever_lit ? (this.tuning.relight_cost || 5) : (this.tuning.lantern_cost || 10);
      const needed = cost - target.deposited;
      const toDeposit = Math.min(this.player.carried, needed);

      target.deposited += toDeposit;
      this.player.carried -= toDeposit;
      this.score += toDeposit * (this.tuning.score.per_mote || 5);

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
        target.fuel_ticks = 6000; // 100 fuel
        this.player.successful_lights = (this.player.successful_lights || 0) + 1;

        const isRelight = target.ever_lit;
        if (isRelight) {
          target.relit_count = (target.relit_count || 0) + 1;
          this.score += this.tuning.score.per_lantern_relight || 40;
        } else {
          target.ever_lit = true;
          target.relit_count = 0;
          this.score += this.tuning.score.per_lantern_first || 100;
        }

        // Push any shade inside safe zone
        for (const s of this.shades) {
          if (dist2D(s.pos, target.pos) < (this.tuning.safe_radius || 6.0)) {
            s.safe_push_ticks_left = this.tuning.safe_push_ticks || 30;
            if (s.state === 'drain' && s.target_lantern_id === target.id) {
              s.state = 'wander';
              s.target_lantern_id = null;
            }
          }
        }

        this.pendingEvents.push({
          type: 'event',
          tick: this.tick,
          name: 'lantern_lit',
          data: {
            lantern_id: target.id,
            relight: isRelight,
          },
        });
      }
    }
  }

  updateSafeZones(dt) {
    const safeR = this.tuning.safe_radius || 6.0;

    for (const s of this.shades) {
      if (s.safe_push_ticks_left > 0) {
        s.safe_push_ticks_left--;
        for (const l of this.lanterns) {
          if (l.lit && l.fuel_ticks >= 1800) { // Only fuel >= 30 has safe zone
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

    for (const s of this.shades) {
      const shadeCenter = [s.pos[0], s.pos[1] + 0.8, s.pos[2]];
      if (dist3D(pulseCenter, shadeCenter) <= (this.tuning.pulse_radius || 5.0)) {
        const wasDrain = s.state === 'drain';
        s.state = 'stunned';
        s.state_ticks_left = this.tuning.pulse_stun_ticks || 120;
        s.push_ticks_left = 15;
        s.target_lantern_id = null;

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
        // +15 nếu trước đó đang drain, +5 nếu thường
        this.score += wasDrain ? (this.tuning.score.per_stun_drain || 15) : (this.tuning.score.per_stun || 5);
      }
    }

    for (const d of this.drifters) {
      if (dist3D(pulseCenter, d.pos) <= (this.tuning.pulse_radius || 5.0)) {
        if (d.state === 'chase') {
          d.state = 'flee';
          d.flee_ticks_left = this.tuning.drifter_flee_ticks || 240;
        } else if (d.state === 'flee' && d.stolen > 0) {
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

  castBlast(dirX = 0, dirZ = 1, pushDist = 14.0) {
    if ((this.player.blast_charges || 0) <= 0) return false;
    this.player.blast_charges -= 1;

    const len = Math.hypot(dirX, dirZ) || 1;
    const nx = dirX / len;
    const nz = dirZ / len;

    const hitShades = [];
    for (const s of this.shades) {
      const dx = s.pos[0] - this.player.pos[0];
      const dz = s.pos[2] - this.player.pos[2];
      const d = Math.hypot(dx, dz);
      if (d <= 15.0) {
        const dot = (dx * nx + dz * nz) / (d || 1);
        if (dot > 0.15 || d < 3.5) {
          s.state = 'stunned';
          s.state_ticks_left = 120;
          s.push_ticks_left = 20;
          s.target_lantern_id = null;
          const pDirX = d > 0.01 ? dx / d : nx;
          const pDirZ = d > 0.01 ? dz / d : nz;
          s.push_vel = [pDirX * (pushDist / 20), pDirZ * (pushDist / 20)];
          hitShades.push(s.id);
        }
      }
    }

    for (const dr of this.drifters) {
      const dx = dr.pos[0] - this.player.pos[0];
      const dz = dr.pos[2] - this.player.pos[2];
      const d = Math.hypot(dx, dz);
      if (d <= 15.0) {
        const dot = (dx * nx + dz * nz) / (d || 1);
        if (dot > 0.15 || d < 3.5) {
          dr.flee_ticks_left = 120;
          const pDirX = d > 0.01 ? dx / d : nx;
          const pDirZ = d > 0.01 ? dz / d : nz;
          dr.pos[0] = round3(dr.pos[0] + pDirX * pushDist);
          dr.pos[2] = round3(dr.pos[2] + pDirZ * pushDist);
        }
      }
    }

    this.pendingEvents.push({
      type: 'event',
      tick: this.tick,
      name: 'blast',
      data: {
        charges_left: this.player.blast_charges,
        hit_shades: hitShades,
        dir: [round3(nx), round3(nz)],
      },
    });

    return true;
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

      if (s.safe_push_ticks_left > 0) {
        continue; // Đang bị vùng an toàn đẩy ra mép, không chạy AI thông thường
      }

      const dPlayer = dist2D(s.pos, this.player.pos);

      // --- DRAIN STATE TRANSITIONS ---
      if (s.state === 'drain') {
        // Sang chase nếu Mây vào trong 6m
        if (dPlayer <= 6.0) {
          s.state = 'chase';
          s.target_lantern_id = null;
          continue;
        }

        // Kiểm tra đèn đang hút
        const targetL = this.lanterns.find((l) => l.id === s.target_lantern_id);
        if (!targetL || !targetL.lit || targetL.fuel_ticks >= 1800 || dist2D(s.pos, targetL.pos) > 2.0) {
          s.state = 'wander';
          s.target_lantern_id = null;
          continue;
        }

        // Đang đứng yên hút dầu
        continue;
      }

      // --- CHASE STATE ---
      if (s.state === 'chase') {
        if (dPlayer > loseR) {
          s.state = 'wander';
        } else if (dPlayer > 0.001) {
          const dirX = (this.player.pos[0] - s.pos[0]) / dPlayer;
          const dirZ = (this.player.pos[2] - s.pos[2]) / dPlayer;
          const nextX = s.pos[0] + dirX * baseSpeed * dt;
          const nextZ = s.pos[2] + dirZ * baseSpeed * dt;

          let blocked = false;
          for (const l of this.lanterns) {
            // Only blocks if lit and fuel >= 30
            if (l.lit && l.fuel_ticks >= 1800 && dist2D([nextX, 0, nextZ], l.pos) < safeR) {
              blocked = true;
              break;
            }
          }

          if (!blocked) {
            s.pos[0] = round3(nextX);
            s.pos[2] = round3(nextZ);
          }
        }
        continue;
      }

      // --- WANDER STATE ---
      if (s.state === 'wander') {
        if (dPlayer <= detectR) {
          s.state = 'chase';
          s.target_lantern_id = null;
          continue;
        }

        // Tìm đèn sáng có fuel < 30 gần nhất
        let weakLanterns = this.lanterns.filter((l) => l.lit && l.fuel_ticks < 1800);
        let targetL = null;

        if (weakLanterns.length > 0) {
          weakLanterns.sort((a, b) => {
            const da = dist2D(s.pos, a.pos);
            const db = dist2D(s.pos, b.pos);
            if (Math.abs(da - db) > 0.001) return da - db;
            return a.id.localeCompare(b.id);
          });
          targetL = weakLanterns[0];
        } else {
          // Đi về đèn tắt gần nhất
          let unlitLanterns = this.lanterns.filter((l) => !l.lit);
          if (unlitLanterns.length > 0) {
            unlitLanterns.sort((a, b) => dist2D(s.pos, a.pos) - dist2D(s.pos, b.pos));
            targetL = unlitLanterns[0];
          }
        }

        if (targetL) {
          s.target_lantern_id = targetL.id;
          const dLantern = dist2D(s.pos, targetL.pos);

          // Nếu cách đèn weak <= 2m -> chuyển sang drain
          if (targetL.lit && targetL.fuel_ticks < 1800 && dLantern <= 2.0) {
            s.state = 'drain';
            s.drain_ticks = 0;
            continue;
          }

          if (dLantern > 0.001) {
            const dirX = (targetL.pos[0] - s.pos[0]) / dLantern;
            const dirZ = (targetL.pos[2] - s.pos[2]) / dLantern;
            const nextX = s.pos[0] + dirX * baseSpeed * dt;
            const nextZ = s.pos[2] + dirZ * baseSpeed * dt;

            let blocked = false;
            for (const l of this.lanterns) {
              if (l.lit && l.fuel_ticks >= 1800 && dist2D([nextX, 0, nextZ], l.pos) < safeR) {
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
    if (this.sim_tick % 240 === 0) {
      const activeCount = this.motes.filter((m) => m.active).length;
      if (activeCount < 30 && this.moteSpawnPoints.length > 0) {
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

    let spawnInterval = 480;
    let maxShades = 6;
    if (this.night === 2) {
      spawnInterval = 420;
      maxShades = 8;
    } else if (this.night === 3) {
      spawnInterval = 360;
      maxShades = 10;
    }

    if (this.sim_tick === 300) {
      for (let i = 0; i < 2 && this.shades.length < maxShades; i++) {
        this.spawnShade();
      }
    } else if (this.sim_tick > 300 && (this.sim_tick - 300) % spawnInterval === 0) {
      if (this.shades.length < maxShades) {
        this.spawnShade();
      }
    }

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
        target_lantern_id: null,
        drain_ticks: 0,
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
    // 1. Loss: flames <= 0 (always loses with no_flames first, even on final tick)
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

    // 2. Dawn check when time expires
    if (this.time_left_s <= 0) {
      const litLanterns = this.lanterns.filter((l) => l.lit);
      const totalCount = this.lanterns.length;
      const threshold = Math.ceil(totalCount * (this.tuning.win_ratio || 0.6));

      if (litLanterns.length >= threshold) {
        // WIN: dawn_survived
        this.state = 'won';

        // Điểm bình minh: +50/mỗi flame, + (50 + floor(fuel))/mỗi đèn đang sáng
        const flameBonus = this.player.flames * (this.tuning.score.dawn_per_flame || 50);
        let lanternBonus = 0;
        for (const l of litLanterns) {
          const f = Math.floor(l.fuel_ticks / 60);
          lanternBonus += (this.tuning.score.dawn_per_lit_lantern || 50) + f;
        }

        this.score += flameBonus + lanternBonus;

        this.pendingEvents.push({
          type: 'event',
          tick: this.tick,
          name: 'game_over',
          data: { result: 'won', reason: 'dawn_survived' },
        });
      } else {
        // LOSE: dawn
        this.state = 'lost';
        this.pendingEvents.push({
          type: 'event',
          tick: this.tick,
          name: 'game_over',
          data: { result: 'lost', reason: 'dawn' },
        });
      }
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
        capacity: this.getCapacity(),
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
        fuel: l.lit ? round1(l.fuel_ticks / 60) : 0,
        ever_lit: !!l.ever_lit,
        relit_count: l.relit_count || 0,
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
