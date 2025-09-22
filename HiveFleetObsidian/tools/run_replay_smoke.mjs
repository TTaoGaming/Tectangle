// Run core replay smoke checks over available landmark traces
// Usage: node HiveFleetObsidian/tools/run_replay_smoke.mjs

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const externalRunner = path.join(repoRoot, 'tests/replay/replay_core_from_trace.mjs');
const externalTraces = [
  'tests/landmarks/right_hand_normal.landmarks.jsonl',
  'tests/landmarks/right_hand_gated.landmarks.jsonl'
].filter(p => existsSync(p));

const baseNest = existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const internalRunner = path.join(baseNest, 'tools', 'portable_replay_from_trace.mjs');
const internalTraces = [
  path.join(baseNest, 'landmarks', 'right_hand_normal.landmarks.jsonl'),
  path.join(baseNest, 'landmarks', 'right_hand_gated.landmarks.jsonl')
].filter(p => existsSync(p));

const runner = existsSync(externalRunner) ? externalRunner : internalRunner;
const traces = (existsSync(externalRunner) && externalTraces.length) ? externalTraces : internalTraces;

if (!existsSync(runner)) {
  console.error('[HFO] No replay runner available (external or internal).');
  process.exit(2);
}
if (traces.length === 0) {
  console.error('[HFO] No landmark traces found (external or internal).');
  process.exit(2);
}

let failures = 0;
for (const t of traces) {
  console.log(`\n[HFO] Running replay on ${t}`);
  const res = spawnSync('node', [runner, t], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  if (res.status !== 0) failures++;
}

if (failures > 0) {
  console.error(`\n[HFO] Smoke FAILED on ${failures} trace(s)`);
  process.exit(1);
}
console.log('\n[HFO] Smoke PASS');
