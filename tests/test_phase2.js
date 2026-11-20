import assert from 'assert';
import { Simulation } from '../src/core/simulation.js';

console.log('--- RUNNING PHASE 2 NEW FEATURES TEST SUITE ---');

// Test 1: Dash mechanism (speed 14 m/s in 12 ticks, cd 90 ticks = 1.5s)
function testDashMechanics() {
  console.log('Testing Dash mechanism (14 m/s, 12 ticks, cooldown 1.5s)...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    player: { pos: [0, 0, 0] },
    random_motes: false,
    random_shades: false,
  });

  // Trigger dash towards +Z
  sim.setInput({ move: [0, 1], dash: true });
  const events = sim.step();

  const dashEv = events.find((e) => e.name === 'dash');
  assert.ok(dashEv, 'Dash event must be emitted');
  assert.strictEqual(sim.player.dash_active_ticks, 11); // 12 - 1
  assert.strictEqual(sim.player.dash_cd_ticks, 90);
  assert.ok(sim.player.pos[2] > 0, 'Player should have moved forward quickly');

  // Step 11 more ticks to finish dash
  for (let i = 0; i < 11; i++) {
    sim.step();
  }
  assert.strictEqual(sim.player.dash_active_ticks, 0);
  // Traveled ~14 * 0.2 = 2.8m
  assert.ok(sim.player.pos[2] >= 2.7 && sim.player.pos[2] <= 2.9, `Traveled ${sim.player.pos[2]}m`);
  console.log('✓ Dash mechanics test passed!');
}

// Test 2: Jump and Gravity (vy=7, g=-20)
function testJumpAndGravity() {
  console.log('Testing Jump and Gravity...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    player: { pos: [0, 0, 0] },
    random_motes: false,
    random_shades: false,
  });

  sim.setInput({ jump: true });
  sim.step();

  assert.strictEqual(sim.player.grounded, false);
  assert.ok(sim.player.pos[1] > 0, 'Player should be in the air');

  // Simulate until landing (around 42 ticks for 7m/s with -20g)
  let landed = false;
  for (let i = 0; i < 60; i++) {
    sim.step();
    if (sim.player.grounded && sim.player.pos[1] === 0) {
      landed = true;
      break;
    }
  }
  assert.ok(landed, 'Player must land safely back on ground');
  console.log('✓ Jump and Gravity test passed!');
}

// Test 3: Fall off island (Y < -10)
function testFallOffIsland() {
  console.log('Testing Fall off island (Y < -10, wait 60 ticks, respawn with 90 invuln)...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    player: { pos: [50, 0, 0], carried: 5, flames: 3 }, // Outside r=40m island -> falling
    random_motes: false,
    random_shades: false,
  });

  // Step until Y < -10 (takes around 65-70 ticks for free fall to -10m)
  let hitEvent = null;
  for (let i = 0; i < 100; i++) {
    const events = sim.step();
    const ev = events.find((e) => e.name === 'player_hit' && e.data.by === 'fall');
    if (ev) {
      hitEvent = ev;
      break;
    }
  }

  assert.ok(hitEvent, 'Fall hit event must occur');
  assert.strictEqual(hitEvent.data.flames, 2);
  assert.strictEqual(hitEvent.data.dropped, 5);
  assert.strictEqual(sim.player.carried, 0);

  // Wait 60 ticks for respawn
  for (let i = 0; i < 60; i++) {
    sim.step();
  }

  assert.strictEqual(sim.player.pos[0], 0);
  assert.strictEqual(sim.player.pos[1], 0);
  assert.strictEqual(sim.player.pos[2], 0);
  assert.ok(sim.player.invuln_ticks >= 89, 'Player must have 90 ticks of invulnerability on respawn');
  console.log('✓ Fall off island test passed!');
}

// Test 4: Wind Charm (speed 7.2, dash 0 cooldown)
function testWindCharm() {
  console.log('Testing Wind Charm pickup and zero-cooldown dash...');
  const sim = new Simulation({ seed: 42, night: 2 });
  sim.applyScenario({
    player: { pos: [35, 0, 0] }, // on top of C1
    charms: [{ id: 'C1', pos: [35, 0, 0], available: true, respawn_ticks: 0 }],
    random_motes: false,
    random_shades: false,
  });

  const events = sim.step();
  const charmEv = events.find((e) => e.name === 'charm_picked');
  assert.ok(charmEv, 'charm_picked event must be emitted');
  assert.strictEqual(charmEv.data.charm_id, 'C1');
  assert.strictEqual(sim.player.charm_ticks, 600);

  // Trigger dash with charm active
  sim.setInput({ dash: true });
  sim.step();
  assert.strictEqual(sim.player.dash_cd_ticks, 0, 'Dash should have 0 cooldown when charm is active');
  console.log('✓ Wind Charm test passed!');
}

// Test 5: Drifter steal and pulse recovery
function testDrifterMechanics() {
  console.log('Testing Drifter steal and pulse drop recovery...');
  const sim = new Simulation({ seed: 42, night: 2 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 6 }, // carried >= 5
    drifters: [{ id: 'D1', pos: [0, 0, 1.0], state: 'chase', stolen: 0 }],
    random_motes: false,
    random_shades: false,
  });

  // Step 1: Drifter steals min(3, carried) = 3
  const ev1 = sim.step();
  const stealEv = ev1.find((e) => e.name === 'drifter_steal');
  assert.ok(stealEv, 'drifter_steal event must be emitted');
  assert.strictEqual(stealEv.data.amount, 3);
  assert.strictEqual(sim.player.carried, 3);

  const drifter = sim.drifters[0];
  assert.strictEqual(drifter.state, 'flee');
  assert.strictEqual(drifter.stolen, 3);

  // Step 2: Player pulses while carrying remaining 3 motes -> drifter drops stolen motes!
  sim.setInput({ pulse: true });
  const ev2 = sim.step();
  const dropEv = ev2.find((e) => e.name === 'drifter_drop');
  assert.ok(dropEv, 'drifter_drop event must be emitted');
  assert.strictEqual(dropEv.data.amount, 3);
  assert.strictEqual(drifter.stolen, 0);

  console.log('✓ Drifter steal and pulse recovery test passed!');
}

// Test 6: Pause handling
function testPauseHandling() {
  console.log('Testing Pause functionality...');
  const sim = new Simulation({ seed: 42, night: 1 });
  const startSimTick = sim.sim_tick;
  const startTime = sim.time_left_s;

  sim.setInput({ pause: true });
  const events = sim.step();
  assert.ok(events.some((e) => e.name === 'paused'));
  assert.strictEqual(sim.state, 'paused');

  // Release pause key
  sim.setInput({ pause: false });
  sim.step();
  assert.strictEqual(sim.sim_tick, startSimTick);
  assert.strictEqual(sim.time_left_s, startTime);

  // Press pause key again (rising edge) to unpause
  sim.setInput({ pause: true });
  const evResume = sim.step();
  assert.ok(evResume.some((e) => e.name === 'resumed'));
  assert.strictEqual(sim.state, 'playing');
  console.log('✓ Pause handling test passed!');
}

testDashMechanics();
testJumpAndGravity();
testFallOffIsland();
testWindCharm();
testDrifterMechanics();
testPauseHandling();

console.log('\nALL PHASE 2 FEATURE TESTS PASSED SUCCESSFULLY!');
