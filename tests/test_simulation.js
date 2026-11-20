import assert from 'assert';
import fs from 'fs';
import { Simulation, dist2D } from '../src/core/simulation.js';

console.log('--- RUNNING SIMULATION SUITE ---');

// Test 1: Determinism check (Same seed and inputs produce identical output)
function testDeterminism() {
  console.log('Testing determinism...');
  const sim1 = new Simulation({ seed: 12345 });
  const sim2 = new Simulation({ seed: 12345 });

  for (let i = 0; i < 60; i++) {
    sim1.step();
    sim2.step();
  }

  assert.deepStrictEqual(sim1.getSnapshot(), sim2.getSnapshot());
  assert.strictEqual(sim1.score, sim2.score);
  console.log('✓ Determinism test passed!');
}

// Test 2: Mote pickup
function testMotePickup() {
  console.log('Testing mote pickup...');
  const sim = new Simulation({ seed: 42 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 0 },
    random_motes: false,
    motes: [[0, 0, 1.0]], // within pickup radius 1.5
    random_shades: false,
    shades: [],
  });

  const events = sim.step();
  assert.strictEqual(sim.player.carried, 1);
  assert.strictEqual(sim.score, 10);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].name, 'mote_picked');
  assert.strictEqual(events[0].data.carried, 1);
  console.log('✓ Mote pickup test passed!');
}

// Test 3: Depositing and lighting lantern
function testLanternLighting() {
  console.log('Testing deposit and lantern lighting...');
  const sim = new Simulation({ seed: 42 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 5 },
    random_motes: false,
    motes: [],
    random_shades: false,
    shades: [],
    lanterns: [{ id: 'L1', pos: [0, 0, 1.0], deposited: 0, lit: false }],
  });

  // Trigger interact (rising edge)
  sim.setInput({ interact: true });
  const events = sim.step();

  const depositEv = events.find((e) => e.name === 'deposit');
  const litEv = events.find((e) => e.name === 'lantern_lit');

  assert.ok(depositEv, 'Deposit event must be emitted');
  assert.strictEqual(depositEv.data.amount, 5);
  assert.ok(litEv, 'Lantern lit event must be emitted');
  assert.strictEqual(litEv.data.lantern_id, 'L1');
  assert.strictEqual(sim.player.carried, 0);
  console.log('✓ Lantern deposit & lighting test passed!');
}

// Test 4: Pulse stuns and pushes shade
function testPulseStun() {
  console.log('Testing pulse action on shades...');
  const sim = new Simulation({ seed: 42 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 2 },
    random_motes: false,
    motes: [],
    random_shades: false,
    shades: [{ id: 'S1', pos: [0, 0, 3.0] }], // within pulse radius 5.0
  });

  sim.setInput({ pulse: true });
  const events = sim.step();

  const pulseEv = events.find((e) => e.name === 'pulse');
  assert.ok(pulseEv, 'Pulse event must be emitted');
  assert.deepStrictEqual(pulseEv.data.stunned_ids, ['S1']);

  const shade = sim.shades[0];
  assert.strictEqual(shade.state, 'stunned');
  assert.ok(shade.pos[2] > 3.0, 'Shade must be pushed backwards');
  console.log('✓ Pulse stun test passed!');
}

// Test 5: Shade hits player
function testShadeHitPlayer() {
  console.log('Testing shade damaging player...');
  const sim = new Simulation({ seed: 42 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 4, flames: 3 },
    random_motes: false,
    motes: [],
    random_shades: false,
    shades: [{ id: 'S1', pos: [0, 0, 0.5] }], // inside hit radius 1.2
  });

  const events = sim.step();
  const hitEv = events.find((e) => e.name === 'player_hit');
  assert.ok(hitEv, 'player_hit event must be emitted');
  assert.strictEqual(hitEv.data.flames, 2);
  assert.strictEqual(hitEv.data.dropped, 2); // 50% of 4
  assert.strictEqual(sim.player.flames, 2);
  assert.strictEqual(sim.player.carried, 2);
  console.log('✓ Shade attack test passed!');
}

// Test 6: Win condition
function testWinCondition() {
  console.log('Testing win condition (all 5 lanterns lit)...');
  const sim = new Simulation({ seed: 42 });
  sim.applyScenario({
    lanterns: [
      { id: 'L1', lit: true },
      { id: 'L2', lit: true },
      { id: 'L3', lit: true },
      { id: 'L4', lit: true },
      { id: 'L5', pos: [0, 0, 1.0], deposited: 4, lit: false },
    ],
    player: { pos: [0, 0, 0], carried: 1 },
    random_motes: false,
    random_shades: false,
  });

  sim.setInput({ interact: true });
  const events = sim.step();

  const winEv = events.find((e) => e.name === 'game_over');
  assert.ok(winEv, 'game_over event must be emitted');
  assert.strictEqual(winEv.data.result, 'won');
  assert.strictEqual(winEv.data.reason, 'all_lit');
  assert.strictEqual(sim.state, 'won');
  console.log('✓ Win condition test passed!');
}

testDeterminism();
testMotePickup();
testLanternLighting();
testPulseStun();
testShadeHitPlayer();
testWinCondition();

console.log('\nALL 6 SIMULATION UNIT TESTS PASSED SUCCESSFULLY!');
