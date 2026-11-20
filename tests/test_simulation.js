import assert from 'assert';
import { Simulation } from '../src/core/simulation.js';

console.log('--- RUNNING REGRESSION SUITE (PHASE 1 ON STANDARDIZED NUMBERS) ---');

// Test 1: Determinism
function testDeterminism() {
  console.log('Testing determinism...');
  const sim1 = new Simulation({ seed: 12345, night: 1 });
  const sim2 = new Simulation({ seed: 12345, night: 1 });

  for (let i = 0; i < 60; i++) {
    sim1.step();
    sim2.step();
  }

  assert.deepStrictEqual(sim1.getSnapshot(), sim2.getSnapshot());
  assert.strictEqual(sim1.score, sim2.score);
  console.log('✓ Determinism test passed!');
}

// Test 2: Mote pickup with standardized pickup_radius = 1.0m
function testMotePickup() {
  console.log('Testing mote pickup (pickup_radius = 1.0m)...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 0 },
    random_motes: false,
    motes: [[0, 0, 0.8]], // within 1.0m
    random_shades: false,
    shades: [],
  });

  const events = sim.step();
  assert.strictEqual(sim.player.carried, 1);
  // Ticket-03 [THAY THẾ]: Điểm mới v1.2 bỏ thưởng điểm khi nhặt đom đóm (+10 cũ bị hủy),
  // chỉ thưởng +5 điểm khi nạp vào đèn (thắp mới/châm dầu)
  assert.strictEqual(sim.score, 0);
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].name, 'mote_picked');
  console.log('✓ Mote pickup test passed!');
}

// Test 3: Depositing and lighting lantern with standardized cost = 10
function testLanternLighting() {
  console.log('Testing lantern deposit & lighting (cost = 10, interact_radius = 2.0m)...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 10 },
    random_motes: false,
    motes: [],
    random_shades: false,
    shades: [],
    lanterns: [{ id: 'L1', pos: [0, 0, 1.5], deposited: 0, lit: false }],
  });

  sim.setInput({ interact: true });
  const events = sim.step();

  const depositEv = events.find((e) => e.name === 'deposit');
  const litEv = events.find((e) => e.name === 'lantern_lit');

  assert.ok(depositEv, 'Deposit event must be emitted');
  assert.strictEqual(depositEv.data.amount, 10);
  assert.ok(litEv, 'Lantern lit event must be emitted');
  assert.strictEqual(litEv.data.lantern_id, 'L1');
  assert.strictEqual(sim.player.carried, 0);
  console.log('✓ Lantern deposit & lighting test passed!');
}

// Test 4: Pulse stuns and pushes shade with standardized pulse_cost = 3
function testPulseStun() {
  console.log('Testing pulse (pulse_cost = 3, stun 120 ticks, push 4m in 15 ticks)...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 3 },
    random_motes: false,
    motes: [],
    random_shades: false,
    shades: [{ id: 'S1', pos: [0, 0, 3.0] }],
  });

  sim.setInput({ pulse: true });
  const events = sim.step();

  const pulseEv = events.find((e) => e.name === 'pulse');
  assert.ok(pulseEv, 'Pulse event must be emitted');
  assert.deepStrictEqual(pulseEv.data.stunned_ids, ['S1']);

  const shade = sim.shades[0];
  assert.strictEqual(shade.state, 'stunned');
  assert.strictEqual(shade.state_ticks_left, 120);
  assert.ok(shade.pos[2] > 3.0, 'Shade must be pushed backwards');
  console.log('✓ Pulse stun test passed!');
}

// Test 5: Shade hits player
function testShadeHitPlayer() {
  console.log('Testing shade attack & recoil...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    player: { pos: [0, 0, 0], carried: 4, flames: 3 },
    random_motes: false,
    motes: [],
    random_shades: false,
    shades: [{ id: 'S1', pos: [0, 0, 0.8] }], // inside hit radius 1.0
  });

  const events = sim.step();
  const hitEv = events.find((e) => e.name === 'player_hit');
  assert.ok(hitEv, 'player_hit event must be emitted');
  assert.strictEqual(hitEv.data.flames, 2);
  assert.strictEqual(hitEv.data.dropped, 2); // 50% of 4
  assert.strictEqual(sim.player.flames, 2);
  assert.strictEqual(sim.player.carried, 2);

  // Check recoil on shade
  const s = sim.shades[0];
  assert.strictEqual(s.state, 'recoil');
  console.log('✓ Shade attack test passed!');
}

// Test 6: Win condition (Ticket-03 [THAY THẾ]: Không còn thắng sớm all_lit, thắng khi hết giờ dawn_survived nếu >= 60% đèn sáng)
function testWinCondition() {
  console.log('Testing win condition (Contract v1.2: dawn_survived when time expires and >= 60% lanterns lit)...');
  const sim = new Simulation({ seed: 42, night: 1 });
  sim.applyScenario({
    lanterns: [
      { id: 'L1', lit: true },
      { id: 'L2', lit: true },
      { id: 'L3', lit: true },
      { id: 'L4', lit: true },
      { id: 'L5', pos: [0, 0, 1.0], deposited: 9, lit: false },
    ],
    player: { pos: [0, 0, 0], carried: 1 },
    random_motes: false,
    random_shades: false,
  });

  sim.setInput({ interact: true });
  const events = sim.step();

  // Ticket-03: Thắp đủ đèn KHÔNG kết thúc game ngay
  const earlyWinEv = events.find((e) => e.name === 'game_over');
  assert.strictEqual(earlyWinEv, undefined, 'Lighting all lanterns must NOT cause early game_over');
  assert.strictEqual(sim.state, 'playing', 'Game must stay playing until dawn');
  assert.strictEqual(sim.lanterns.every(l => l.lit), true, 'All 5 lanterns are lit');

  // Fast forward to dawn (1 tick before end)
  sim.time_left_s = 1 / 60;
  const dawnEvents = sim.step();
  const winEv = dawnEvents.find((e) => e.name === 'game_over');
  assert.ok(winEv, 'game_over event must be emitted at dawn');
  assert.strictEqual(winEv.data.result, 'won');
  assert.strictEqual(winEv.data.reason, 'dawn_survived');
  assert.strictEqual(sim.state, 'won');
  console.log('✓ Win condition (dawn_survived) test passed!');
}

testDeterminism();
testMotePickup();
testLanternLighting();
testPulseStun();
testShadeHitPlayer();
testWinCondition();

console.log('\nALL 6 REGRESSION TESTS PASSED CLEANLY ON STANDARDIZED NUMBERS!');
