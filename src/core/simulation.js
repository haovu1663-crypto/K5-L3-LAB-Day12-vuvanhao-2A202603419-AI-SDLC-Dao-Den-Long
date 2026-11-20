import { PRNG } from './prng.js';
import fs from 'fs';
import path from 'path';

export function round3(val) {
  return Number(Number(val).toFixed(3));
}

export function dist2D(p1, p2) {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export class Simulation {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 42;
    this.rng = new PRNG(this.seed);
    this.night = options.night || 1;

    // Load tuning from game.contract.json if not provided
    this.tuning = options.tuning || this.loadDefaultTuning();

    this.tick = 0;
    this.sim_tick = 0;
    this.state = 'playing'; // playing | won | lost
    this.score = 0;
    this.time_left_s = this.tuning.night1_duration_s;

    // Player state
    this.player = {
      pos: [0, 0, 0],
      carried: 0,
      flames: this.tuning.flames,
      invuln_timer_s: 0,
      pulse_cooldown_s: 0,
    };

    // Lanterns (L1 .. L5)
    this.lanterns = this.createDefaultLanterns();

    // Motes & Shades
    this.motes = [];
    this.shades = [];
    this.nextMoteId = 1;
    this.nextShadeId = 1;

    // Active inputs state
    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false,
    };
    this.prevInput = { ...this.currentInput };

    // Events generated in current tick
    this.pendingEvents = [];

    // Initialize default island layout
    this.initDefaultWorld();
  }

  loadDefaultTuning() {
    try {
      const contractPath = path.resolve('game.contract.json');
      const data = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      return data.tuning;
    } catch {
      return {
        player_speed: 6.0,
        carry_capacity: 10,
        lantern_cost: 5,
        lantern_count_night1: 5,
        pickup_radius: 1.5,
        interact_radius: 2.5,
        pulse_cost: 1,
        pulse_radius: 5.0,
        night1_duration_s: 300,
        flames: 3,
        invuln_s: 1.5,
        hit_drop_ratio: 0.5,
        pulse_stun_s: 3.0,
        pulse_push_m: 3.0,
        pulse_cooldown_s: 1.0,
        safe_radius: 6.0,
        shade_speed: 3.5,
        shade_hit_radius: 1.2,
        fall_enabled: false,
        score: {
          per_mote: 10,
          per_lantern: 100,
          per_stun: 20,
          per_second_left: 1,
          per_flame_left: 50,
        },
      };
    }
  }

  createDefaultLanterns() {
    const lanterns = [];
    const count = this.tuning.lantern_count_night1 || 5;
    const radius = 25.0;
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      lanterns.push({
        id: `L${i + 1}`,
        pos: [round3(radius * Math.sin(angle)), 0, round3(radius * Math.cos(angle))],
        lit: false,
        deposited: 0,
      });
    }
    return lanterns;
  }

  initDefaultWorld() {
    // Generate initial motes scattered on island
    for (let i = 0; i < 20; i++) {
      const r = this.rng.range(5, 35);
      const theta = this.rng.range(0, 2 * Math.PI);
      this.motes.push({
        id: `M${this.nextMoteId++}`,
        pos: [round3(r * Math.sin(theta)), 0, round3(r * Math.cos(theta))],
        active: true,
      });
    }

    // Generate initial 2 shades
    for (let i = 0; i < 2; i++) {
      const r = this.rng.range(20, 35);
      const theta = this.rng.range(0, 2 * Math.PI);
      const sid = `S${this.nextShadeId++}`;
      this.shades.push({
        id: sid,
        pos: [round3(r * Math.sin(theta)), 0, round3(r * Math.cos(theta))],
        state: 'chase',
        stun_timer_s: 0,
      });
      // Do not emit spawn events during setup
    }
  }

  applyScenario(scenario) {
    if (!scenario) return;

    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
    }

    if (scenario.time_left_s !== undefined) {
      this.time_left_s = scenario.time_left_s;
    }

    // Lanterns update
    if (scenario.lanterns) {
      for (const update of scenario.lanterns) {
        const lantern = this.lanterns.find((l) => l.id === update.id);
        if (lantern) {
          if (update.pos) lantern.pos = [...update.pos];
          if (update.deposited !== undefined) lantern.deposited = update.deposited;
          if (update.lit !== undefined) lantern.lit = update.lit;
        } else {
          this.lanterns.push({
            id: update.id,
            pos: update.pos ? [...update.pos] : [0, 0, 0],
            lit: update.lit || false,
            deposited: update.deposited || 0,
          });
        }
      }
    }

    // Motes
    if (scenario.random_motes === false || scenario.motes !== undefined) {
      this.motes = [];
      if (scenario.motes) {
        for (const m of scenario.motes) {
          this.motes.push({
            id: `M${this.nextMoteId++}`,
            pos: [m[0], m[1] || 0, m[2]],
            active: true,
          });
        }
      }
    }

    // Shades
    if (scenario.random_shades === false || scenario.shades !== undefined) {
      this.shades = [];
      if (scenario.shades) {
        for (const s of scenario.shades) {
          this.shades.push({
            id: s.id || `S${this.nextShadeId++}`,
            pos: s.pos ? [...s.pos] : [10, 0, 10],
            state: s.state || 'chase',
            stun_timer_s: 0,
          });
        }
      }
    }
  }

  setInput(newInputFields) {
    // Save previous frame input for rising-edge detection
    this.prevInput = { ...this.currentInput };
    // Only update provided fields
    this.currentInput = {
      ...this.currentInput,
      ...newInputFields,
    };
  }

  step() {
    if (this.state !== 'playing') {
      return [];
    }

    const dt = 1 / 60; // 60 ticks/s
    this.tick += 1;
    this.sim_tick += 1;
    this.time_left_s = Math.max(0, this.time_left_s - dt);
    this.pendingEvents = [];

    // Cooldown timers
    if (this.player.invuln_timer_s > 0) {
      this.player.invuln_timer_s = Math.max(0, this.player.invuln_timer_s - dt);
    }
    if (this.player.pulse_cooldown_s > 0) {
      this.player.pulse_cooldown_s = Math.max(0, this.player.pulse_cooldown_s - dt);
    }

    // 1. Process Player Movement
    this.updatePlayerMovement(dt);

    // 2. Process Actions (Rising edge trigger)
    const interactTriggered = this.currentInput.interact && !this.prevInput.interact;
    const pulseTriggered = this.currentInput.pulse && !this.prevInput.pulse;

    if (pulseTriggered) {
      this.handlePulse();
    }

    if (interactTriggered) {
      this.handleInteract();
    }

    // 3. Check Mote Pickups
    this.checkMotePickups();

    // 4. Update Shades AI
    this.updateShades(dt);

    // 5. Check Win / Loss Conditions
    this.checkGameConditions();

    // Reset prevInput to currentInput at end of step
    this.prevInput = { ...this.currentInput };

    return this.pendingEvents;
  }

  updatePlayerMovement(dt) {
    const [mx, mz] = this.currentInput.move;
    let len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0.0001) {
      let nx = mx;
      let nz = mz;
      if (len > 1.0) {
        nx = mx / len;
        nz = mz / len;
      }
      // World angle transform:
      // theta in radians
      // x' = x*cos(theta) + z*sin(theta)
      // z' = -x*sin(theta) + z*cos(theta)
      const rad = ((this.currentInput.cam_yaw_deg || 0) * Math.PI) / 180;
      const cosT = Math.cos(rad);
      const sinT = Math.sin(rad);

      const wx = nx * cosT + nz * sinT;
      const wz = -nx * sinT + nz * cosT;

      const speed = this.tuning.player_speed || 6.0;
      this.player.pos[0] = round3(this.player.pos[0] + wx * speed * dt);
      this.player.pos[2] = round3(this.player.pos[2] + wz * speed * dt);
    }
  }

  checkMotePickups() {
    const pickupR = this.tuning.pickup_radius || 1.5;
    const capacity = this.tuning.carry_capacity || 10;

    for (const mote of this.motes) {
      if (!mote.active) continue;
      if (dist2D(this.player.pos, mote.pos) <= pickupR) {
        if (this.player.carried < capacity) {
          mote.active = false;
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
  }

  handleInteract() {
    const interactR = this.tuning.interact_radius || 2.5;
    const cost = this.tuning.lantern_cost || 5;

    for (const lantern of this.lanterns) {
      if (lantern.lit) continue;
      if (dist2D(this.player.pos, lantern.pos) <= interactR) {
        if (this.player.carried > 0) {
          const needed = cost - lantern.deposited;
          const toDeposit = Math.min(this.player.carried, needed);
          lantern.deposited += toDeposit;
          this.player.carried -= toDeposit;

          this.pendingEvents.push({
            type: 'event',
            tick: this.tick,
            name: 'deposit',
            data: {
              lantern_id: lantern.id,
              amount: toDeposit,
              deposited: lantern.deposited,
            },
          });

          if (lantern.deposited >= cost) {
            lantern.lit = true;
            this.score += this.tuning.score.per_lantern || 100;
            this.pendingEvents.push({
              type: 'event',
              tick: this.tick,
              name: 'lantern_lit',
              data: { lantern_id: lantern.id },
            });
          }
          break; // interact with one lantern at a time
        }
      }
    }
  }

  handlePulse() {
    const pulseCost = this.tuning.pulse_cost || 1;
    if (this.player.carried < pulseCost) return;
    if (this.player.pulse_cooldown_s > 0) return;

    this.player.carried -= pulseCost;
    this.player.pulse_cooldown_s = this.tuning.pulse_cooldown_s || 1.0;

    const pulseR = this.tuning.pulse_radius || 5.0;
    const stunDuration = this.tuning.pulse_stun_s || 3.0;
    const pushM = this.tuning.pulse_push_m || 3.0;
    const stunnedIds = [];

    for (const shade of this.shades) {
      const d = dist2D(this.player.pos, shade.pos);
      if (d <= pulseR) {
        shade.state = 'stunned';
        shade.stun_timer_s = stunDuration;
        stunnedIds.push(shade.id);
        this.score += this.tuning.score.per_stun || 20;

        // Push back
        if (d > 0.0001) {
          const pushDirX = (shade.pos[0] - this.player.pos[0]) / d;
          const pushDirZ = (shade.pos[2] - this.player.pos[2]) / d;
          shade.pos[0] = round3(shade.pos[0] + pushDirX * pushM);
          shade.pos[2] = round3(shade.pos[2] + pushDirZ * pushM);
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
    const shadeSpeed = this.tuning.shade_speed || 3.5;
    const hitRadius = this.tuning.shade_hit_radius || 1.2;
    const safeRadius = this.tuning.safe_radius || 6.0;

    for (const shade of this.shades) {
      if (shade.state === 'stunned') {
        shade.stun_timer_s -= dt;
        if (shade.stun_timer_s <= 0) {
          shade.state = 'chase';
        }
        continue;
      }

      // Chase player
      const d = dist2D(shade.pos, this.player.pos);
      if (d > 0.001) {
        const dirX = (this.player.pos[0] - shade.pos[0]) / d;
        const dirZ = (this.player.pos[2] - shade.pos[2]) / d;

        const nextX = shade.pos[0] + dirX * shadeSpeed * dt;
        const nextZ = shade.pos[2] + dirZ * shadeSpeed * dt;

        // Check if inside safe zone of any lit lantern
        let inSafeZone = false;
        for (const lantern of this.lanterns) {
          if (lantern.lit && dist2D([nextX, 0, nextZ], lantern.pos) < safeRadius) {
            inSafeZone = true;
            break;
          }
        }

        if (!inSafeZone) {
          shade.pos[0] = round3(nextX);
          shade.pos[2] = round3(nextZ);
        }
      }

      // Check hit player
      if (
        this.player.invuln_timer_s <= 0 &&
        dist2D(shade.pos, this.player.pos) <= hitRadius
      ) {
        this.player.flames -= 1;
        this.player.invuln_timer_s = this.tuning.invuln_s || 1.5;

        const ratio = this.tuning.hit_drop_ratio || 0.5;
        const dropped = Math.floor(this.player.carried * ratio);
        this.player.carried -= dropped;

        this.pendingEvents.push({
          type: 'event',
          tick: this.tick,
          name: 'player_hit',
          data: {
            by: 'shade',
            flames: this.player.flames,
            dropped: dropped,
          },
        });
      }
    }
  }

  checkGameConditions() {
    // Win: All 5 lanterns lit
    const allLit = this.lanterns.length > 0 && this.lanterns.every((l) => l.lit);
    if (allLit) {
      this.state = 'won';
      // Calculate bonus
      const timeBonus = Math.floor(this.time_left_s) * (this.tuning.score.per_second_left || 1);
      const flameBonus = this.player.flames * (this.tuning.score.per_flame_left || 50);
      this.score += timeBonus + flameBonus;

      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'game_over',
        data: {
          result: 'won',
          reason: 'all_lit',
        },
      });
      return;
    }

    // Lose: No flames
    if (this.player.flames <= 0) {
      this.state = 'lost';
      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'game_over',
        data: {
          result: 'lost',
          reason: 'no_flames',
        },
      });
      return;
    }

    // Lose: Dawn (time expires)
    if (this.time_left_s <= 0) {
      this.state = 'lost';
      this.pendingEvents.push({
        type: 'event',
        tick: this.tick,
        name: 'game_over',
        data: {
          result: 'lost',
          reason: 'dawn',
        },
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
      time_left_s: round3(this.time_left_s),
      score: this.score,
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        flames: this.player.flames,
        carried: this.player.carried,
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
