import { Simulation } from '../src/core/simulation.js';

console.log('--- BENCHMARK: FULL NIGHT (21,600 TICKS) HEADLESS SIMULATION ---');

const TOTAL_TICKS = 21600; // 360 seconds at 60Hz (Full Night 3)
const sim = new Simulation({ seed: 42, night: 3 });

const startTime = performance.now();

for (let i = 0; i < TOTAL_TICKS; i++) {
  sim.step();
}

const elapsedMs = performance.now() - startTime;
const elapsedSec = (elapsedMs / 1000).toFixed(3);
const ticksPerSec = Math.round(TOTAL_TICKS / (elapsedMs / 1000));

console.log(`Ticks simulated: ${TOTAL_TICKS}`);
console.log(`Execution time:  ${elapsedSec} seconds (${elapsedMs.toFixed(1)} ms)`);
console.log(`Simulation rate: ${ticksPerSec.toLocaleString()} ticks/second`);
console.log(`Performance DoD requirement (<= 30.0s): ${elapsedSec <= 30.0 ? 'PASS ✓' : 'FAIL ✗'}`);

if (elapsedSec > 30.0) {
  process.exit(1);
} else {
  console.log('✓ Benchmark passed with flying colors!');
  process.exit(0);
}
