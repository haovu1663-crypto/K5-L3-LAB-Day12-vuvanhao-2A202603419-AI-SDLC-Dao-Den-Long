#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { Simulation } from './core/simulation.js';

function parseArgs(args) {
  const options = {
    seed: 42,
    night: 1,
    scenario: null,
    inputs: null,
    ticks: 60,
    out: null,
    snapshotEvery: 10,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--seed' && i + 1 < args.length) {
      options.seed = parseInt(args[++i], 10);
    } else if (arg === '--night' && i + 1 < args.length) {
      options.night = parseInt(args[++i], 10);
    } else if (arg === '--scenario' && i + 1 < args.length) {
      options.scenario = args[++i];
    } else if (arg === '--inputs' && i + 1 < args.length) {
      options.inputs = args[++i];
    } else if (arg === '--ticks' && i + 1 < args.length) {
      options.ticks = parseInt(args[++i], 10);
    } else if (arg === '--out' && i + 1 < args.length) {
      options.out = args[++i];
    } else if (arg === '--snapshot-every' && i + 1 < args.length) {
      options.snapshotEvery = parseInt(args[++i], 10);
    }
  }

  return options;
}

function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options.out) {
    console.error('Error: --out <file.jsonl> parameter is required');
    process.exit(1);
  }

  // Load Scenario if provided
  let scenarioData = null;
  if (options.scenario) {
    try {
      const content = fs.readFileSync(path.resolve(options.scenario), 'utf8');
      scenarioData = JSON.parse(content);
    } catch (err) {
      console.error(`Malformed scenario file: ${err.message}`);
      process.exit(2);
    }
  }

  // Load Inputs if provided
  let inputsData = null;
  if (options.inputs) {
    try {
      const content = fs.readFileSync(path.resolve(options.inputs), 'utf8');
      inputsData = JSON.parse(content);
      if (!inputsData.frames || !Array.isArray(inputsData.frames)) {
        throw new Error('Inputs file missing "frames" array');
      }
      // Check strictly increasing tick
      let lastTick = -1;
      for (const frame of inputsData.frames) {
        if (typeof frame.tick !== 'number' || frame.tick <= lastTick) {
          throw new Error('Frames tick must be strictly increasing');
        }
        lastTick = frame.tick;
      }
    } catch (err) {
      console.error(`Malformed inputs file: ${err.message}`);
      process.exit(2);
    }
  }

  // Initialize simulation
  const sim = new Simulation({
    seed: options.seed,
    night: options.night,
  });

  if (scenarioData) {
    sim.applyScenario(scenarioData);
  }

  // Prepare input map: tick -> input object
  const frameMap = new Map();
  if (inputsData && inputsData.frames) {
    for (const frame of inputsData.frames) {
      frameMap.set(frame.tick, frame);
    }
  }

  // Prepare output file stream
  const outPath = path.resolve(options.out);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outLines = [];

  // Snapshot at tick 0 (before applying input of tick 0)
  outLines.push(JSON.stringify(sim.getSnapshot()));

  const totalSteps = options.ticks;
  for (let k = 0; k < totalSteps; k++) {
    // Check if input frame exists for this tick k
    if (frameMap.has(k)) {
      sim.setInput(frameMap.get(k));
    }

    // Step the simulation
    const events = sim.step();
    for (const ev of events) {
      outLines.push(JSON.stringify(ev));
    }

    // Snapshot every N ticks
    if (sim.tick % options.snapshotEvery === 0) {
      outLines.push(JSON.stringify(sim.getSnapshot()));
    }

    // Check if game ended early
    if (sim.state !== 'playing') {
      break;
    }
  }

  // End report
  outLines.push(JSON.stringify(sim.getEndReport()));

  // Write all to file with newline
  fs.writeFileSync(outPath, outLines.join('\n') + '\n', 'utf8');
  process.exit(0);
}

main();
