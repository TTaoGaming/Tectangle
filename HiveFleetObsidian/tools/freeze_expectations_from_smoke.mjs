// Freeze frozen-smoke expectations from current replay results
// Usage: node HiveFleetObsidian/tools/freeze_expectations_from_smoke.mjs

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const runner = path.join(repoRoot, 'tests/replay/replay_core_from_trace.mjs');
const cfgPath = path.join('HiveFleetObsidian', 'config', 'smoke_expectations.json');

if (!fs.existsSync(runner)) {
  console.error('[Freeze] Replay runner not found:', runner);
  process.exit(2);
}

// Load existing expectations (or seed with known traces)
let cfg = {};
if (fs.existsSync(cfgPath)) {
  try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch { cfg = {}; }
}
if (Object.keys(cfg).length === 0) {
  cfg = {
    'tests/landmarks/right_hand_normal.landmarks.jsonl': { downs: 0, ups: 0, env: {} },
    'tests/landmarks/right_hand_gated.landmarks.jsonl': { downs: 0, ups: 0, env: {} },
  };
}

let updated = 0; let failures = 0; const results = {};
for (const trace of Object.keys(cfg)) {
  const abs = path.join(repoRoot, trace);
  if (!fs.existsSync(abs)) { console.warn('[Freeze] Missing trace, skipping:', trace); continue; }
  const res = spawnSync('node', [runner, abs], { encoding: 'utf8' });
  const out = (res.stdout || '') + (res.stderr || '');
  const m = out.match(/Events:\s*\{\s*downs:\s*(\d+)\s*,\s*ups:\s*(\d+)\s*\}/i);
  if (!m) {
    console.error('[Freeze] Could not parse events for', trace);
    failures++; continue;
  }
  const downs = Number(m[1]);
  const ups = Number(m[2]);
  results[trace] = { downs, ups };
  cfg[trace] = { ...(cfg[trace]||{}), downs, ups, env: cfg[trace]?.env || {} };
  updated++;
}

if (failures > 0) {
  console.error(`[Freeze] Failed to compute ${failures} trace(s)`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
console.log('[Freeze] Updated expectations ->', cfgPath);
for (const [t, r] of Object.entries(results)) console.log(` - ${t}: downs=${r.downs} ups=${r.ups}`);

