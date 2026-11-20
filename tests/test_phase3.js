import assert from 'assert';
import { Simulation } from '../src/core/simulation.js';

console.log('--- RUNNING PHASE 3 NEW FEATURES TEST SUITE (CONTRACT v1.2) ---');

// Test 1: Fuel decay and lantern_out
function testFuelDecayAndLanternOut() {
  console.log('Testing fuel decay (1.0/s) and lantern_out when fuel reaches 0...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    lanterns: [
      { id: 'L1', pos: [0, 0, 0], lit: true, fuel: 1.0 }, // 1.0 fuel = 60 ticks left
    ],
    player: { pos: [20, 0, 20] },
    random_motes: false,
    random_shades: false,
  });

  // Step 30 ticks (0.5s): fuel should be 0.5
  for (let i = 0; i < 30; i++) {
    sim.step();
  }
  let snap = sim.getSnapshot();
  assert.strictEqual(snap.lanterns[0].lit, true);
  assert.strictEqual(snap.lanterns[0].fuel, 0.5);

  // Step 30 more ticks: fuel hits 0 at tick 60, turns off
  let lanternOutEv = null;
  for (let i = 0; i < 30; i++) {
    const events = sim.step();
    const ev = events.find((e) => e.name === 'lantern_out');
    if (ev) lanternOutEv = ev;
  }

  assert.ok(lanternOutEv, 'lantern_out event must be emitted when fuel reaches 0');
  assert.strictEqual(lanternOutEv.data.lantern_id, 'L1');

  snap = sim.getSnapshot();
  const l1 = snap.lanterns.find((l) => l.id === 'L1');
  assert.strictEqual(l1.lit, false);
  assert.strictEqual(l1.fuel, 0);
  assert.strictEqual(l1.ever_lit, true, 'Lantern must remember ever_lit = true');
  console.log('✓ Fuel decay & lantern_out test passed!');
}

// Test 2: Refuel mechanics (used = min(carried, ceil((100 - fuel)/10)))
function testRefuelMechanics() {
  console.log('Testing refuel formula and full-fuel rejection...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    lanterns: [
      { id: 'L1', pos: [0, 0, 1.0], lit: true, fuel: 75.0 }, // needs ceil((100 - 75)/10) = 3 motes
    ],
    player: { pos: [0, 0, 0], carried: 2 }, // only has 2 motes
    random_motes: false,
    random_shades: false,
  });

  sim.setInput({ interact: true });
  const events = sim.step();

  const refuelEv = events.find((e) => e.name === 'refuel');
  assert.ok(refuelEv, 'refuel event must be emitted');
  assert.strictEqual(refuelEv.data.lantern_id, 'L1');
  assert.strictEqual(refuelEv.data.amount, 2);
  assert.strictEqual(refuelEv.data.fuel, 95.0); // 75 + 2*10 = 95
  assert.strictEqual(sim.player.carried, 0);
  assert.strictEqual(sim.score, 10); // 2 motes * 5 pts

  // Trying to refuel full lantern (100) gives no event and uses 0 motes
  sim.lanterns[0].fuel_ticks = 6000;
  sim.player.carried = 3;
  sim.setInput({ interact: true });
  const eventsFull = sim.step();
  const refuelFull = eventsFull.find((e) => e.name === 'refuel');
  assert.strictEqual(refuelFull, undefined, 'Full lantern (fuel=100) must not accept refuel');
  assert.strictEqual(sim.player.carried, 3, 'No motes consumed on full lantern');
  console.log('✓ Refuel mechanics test passed!');
}

// Test 3: Relighting costs 5 motes for ever_lit lanterns
function testRelightMechanics() {
  console.log('Testing relighting cost (5 motes for ever_lit vs 10 first time)...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    lanterns: [
      { id: 'L1', pos: [0, 0, 1.0], lit: false, ever_lit: true, deposited: 0 },
    ],
    player: { pos: [0, 0, 0], carried: 5 },
    random_motes: false,
    random_shades: false,
  });

  sim.setInput({ interact: true });
  const events = sim.step();

  const litEv = events.find((e) => e.name === 'lantern_lit');
  assert.ok(litEv, 'lantern_lit event must be emitted');
  assert.strictEqual(litEv.data.lantern_id, 'L1');
  assert.strictEqual(litEv.data.relight, true, 'relight flag must be true');

  // Score: 5 motes deposited * 5 = +25, relight bonus = +40 -> total +65
  assert.strictEqual(sim.score, 65);
  assert.strictEqual(sim.lanterns[0].lit, true);
  assert.strictEqual(sim.lanterns[0].fuel_ticks, 6000); // Reset to 100
  assert.strictEqual(sim.lanterns[0].relit_count, 1);
  assert.strictEqual(sim.player.carried, 0);
  console.log('✓ Relight mechanics test passed!');
}

// Test 4: Shade drain and Pulse +15 score bonus
function testShadeDrainAndPulseBonus() {
  console.log('Testing shade drain state and pulse +15 bonus on draining shade...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    lanterns: [
      { id: 'L1', pos: [10, 0, 0], lit: true, fuel: 20.0 }, // fuel < 30 -> no safe zone
    ],
    shades: [
      { id: 'S1', pos: [11, 0, 0], state: 'wander' }, // within 2m (1m away) of weak lantern
    ],
    player: { pos: [30, 0, 0], carried: 3 }, // player far away (>12m) so shade wanders/drains
    random_motes: false,
    random_shades: false,
  });

  // Step 1: Shade wanders, sees L1 has fuel < 30, within 2m -> transitions to drain
  const ev1 = sim.step();
  assert.strictEqual(sim.shades[0].state, 'drain');
  assert.strictEqual(sim.shades[0].target_lantern_id, 'L1');

  // Let it drain for 60 ticks and verify fuel_drain event
  let drainEvent = null;
  for (let i = 0; i < 60; i++) {
    const evs = sim.step();
    const ev = evs.find((e) => e.name === 'fuel_drain');
    if (ev) drainEvent = ev;
  }
  assert.ok(drainEvent, 'fuel_drain event must be emitted');
  assert.strictEqual(drainEvent.data.lantern_id, 'L1');
  assert.strictEqual(drainEvent.data.shade_id, 'S1');

  // Player approaches S1 (within pulse radius 5m) and inputs pulse in same tick.
  // In tick execution order: Step 7 (Pulse) executes BEFORE Step 8 (Shade AI).
  // Therefore S1 is hit while still in 'drain' state!
  sim.player.pos = [11, 0, 3.0];
  sim.setInput({ pulse: true });
  const startScore = sim.score;
  const evPulse = sim.step();

  const pulseEv = evPulse.find((e) => e.name === 'pulse');
  assert.ok(pulseEv, 'pulse event must be emitted');
  assert.deepStrictEqual(pulseEv.data.stunned_ids, ['S1']);

  // Score must gain +15 because S1 was draining right before pulse
  assert.strictEqual(sim.score, startScore + 15, 'Pulse on draining shade must award +15 pts');
  assert.strictEqual(sim.shades[0].state, 'stunned');
  console.log('✓ Shade drain & pulse bonus test passed!');
}

// Test 5: Safe push when refueled to >= 30
function testSafePushOnRefuel() {
  console.log('Testing safe zone pushback when lantern refueled to >= 30...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    lanterns: [
      { id: 'L1', pos: [0, 0, 1.0], lit: true, fuel: 25.0 }, // fuel < 30
    ],
    shades: [
      { id: 'S1', pos: [0, 0, 2.5], state: 'drain', target_lantern_id: 'L1' }, // within 6m
    ],
    player: { pos: [0, 0, 0], carried: 1 }, // 1 mote brings fuel to 35 >= 30
    random_motes: false,
    random_shades: false,
  });

  sim.setInput({ interact: true });
  sim.step();

  // In step 5 safe_push_ticks_left is set to 30; in step 6 updateSafeZones pushes shade and decrements to 29
  assert.strictEqual(sim.shades[0].safe_push_ticks_left, 29);
  assert.strictEqual(sim.shades[0].state, 'wander');
  // Verify shade was pushed away from lantern
  assert.ok(sim.shades[0].pos[2] > 2.5, 'Shade must be pushed outward by safe zone');
  console.log('✓ Safe push on refuel test passed!');
}

// Test 6: Dynamic capacity (10 + 2 * successful_lights, max 20)
function testDynamicCapacity() {
  console.log('Testing dynamic capacity expansion (10 + 2 * successful_lights, max 20)...');
  const sim = new Simulation({ seed: 42, night: 1 });
  assert.strictEqual(sim.getCapacity(), 10);

  // Successfully light 1 lantern
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 10, successful_lights: 0 },
    lanterns: [{ id: 'L1', pos: [0, 0, 1.0], lit: false, deposited: 0 }],
    random_motes: false,
    random_shades: false,
  });

  sim.setInput({ interact: true });
  sim.step();

  assert.strictEqual(sim.player.successful_lights, 1);
  assert.strictEqual(sim.getCapacity(), 12);

  // Set successful_lights to 6 -> capacity = min(20, 10 + 12) = 20
  sim.player.successful_lights = 6;
  assert.strictEqual(sim.getCapacity(), 20);
  console.log('✓ Dynamic capacity test passed!');
}

// Test 7: Dawn survived win vs Dawn loss
function testDawnWinAndLoss() {
  console.log('Testing dawn_survived win (>=60% lit) and dawn loss (<60% lit)...');
  // Sub-case A: Win (3/5 lit in Night 1 = 60%)
  const simWin = new Simulation({ seed: 42, night: 1 });
  simWin.applyScenario({
    lanterns: [
      { id: 'L1', lit: true, fuel: 80.0 },
      { id: 'L2', lit: true, fuel: 80.0 },
      { id: 'L3', lit: true, fuel: 80.0 },
      { id: 'L4', lit: false, fuel: 0.0 },
      { id: 'L5', lit: false, fuel: 0.0 },
    ],
    player: { pos: [0, 0, 0], flames: 3 },
    random_motes: false,
    random_shades: false,
  });

  simWin.time_left_s = 1 / 60;
  const winEvents = simWin.step();
  const winEv = winEvents.find((e) => e.name === 'game_over');
  assert.ok(winEv, 'game_over must trigger at dawn');
  assert.strictEqual(winEv.data.result, 'won');
  assert.strictEqual(winEv.data.reason, 'dawn_survived');
  assert.strictEqual(simWin.state, 'won');

  // Sub-case B: Loss (2/5 lit in Night 1 < 60%)
  const simLoss = new Simulation({ seed: 42, night: 1 });
  simLoss.applyScenario({
    lanterns: [
      { id: 'L1', lit: true, fuel: 80.0 },
      { id: 'L2', lit: true, fuel: 80.0 },
      { id: 'L3', lit: false, fuel: 0.0 },
      { id: 'L4', lit: false, fuel: 0.0 },
      { id: 'L5', lit: false, fuel: 0.0 },
    ],
    player: { pos: [0, 0, 0], flames: 3 },
    random_motes: false,
    random_shades: false,
  });

  simLoss.time_left_s = 1 / 60;
  const lossEvents = simLoss.step();
  const lossEv = lossEvents.find((e) => e.name === 'game_over');
  assert.ok(lossEv, 'game_over must trigger at dawn');
  assert.strictEqual(lossEv.data.result, 'lost');
  assert.strictEqual(lossEv.data.reason, 'dawn');
  assert.strictEqual(simLoss.state, 'lost');

  console.log('✓ Dawn win & loss test passed!');
}

testFuelDecayAndLanternOut();
testRefuelMechanics();
testRelightMechanics();
testShadeDrainAndPulseBonus();
testSafePushOnRefuel();
testDynamicCapacity();
testDawnWinAndLoss();

console.log('\nALL 7 PHASE 3 FEATURE TESTS PASSED CLEANLY (CONTRACT v1.2)!');
