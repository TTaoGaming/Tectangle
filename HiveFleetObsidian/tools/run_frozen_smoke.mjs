// Enforce frozen smoke expectations against replay runner
// Usage: node HiveFleetObsidian/tools/run_frozen_smoke.mjs

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const runner = path.join(repoRoot, 'tests/replay/replay_core_from_trace.mjs');
const cfgPath = path.join('HiveFleetObsidian', 'config', 'smoke_expectations.json');

if (!fs.existsSync(runner)) {
  console.error('[HFO] Replay runner not found:', runner);
  process.exit(2);
}
if (!fs.existsSync(cfgPath)) {
  console.error('[HFO] Expectations file missing:', cfgPath);
  process.exit(2);
}

const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
let failures = 0;
for (const [trace, exp] of Object.entries(cfg)) {
  const abs = path.join(repoRoot, trace);
  if (!fs.existsSync(abs)) {
    console.error(`[HFO] Missing trace: ${trace}`);
    failures++;
    continue;
  }
  const env = { ...process.env, EXPECT_DOWNS: String(exp.downs), EXPECT_UPS: String(exp.ups), ...(exp.env||{}) };
  console.log(`\n[HFO] Frozen smoke ${trace} -> expect downs=${exp.downs} ups=${exp.ups}`);
  const res = spawnSync('node', [runner, abs], { stdio: 'inherit', env });
  if (res.status !== 0) failures++;
}

if (failures > 0) {
  console.error(`\n[HFO] Frozen smoke FAILED on ${failures} case(s)`);
  process.exit(1);
}
console.log('\n[HFO] Frozen smoke PASS');

