// Hive Start: sequential, reliable startup for counsel-of-4 + 2
// Steps (sequential):
// 1) Summon champions (seed docs)
// 2) Verify champion docs presence
// 3) Status (Board + last history)
// 4) Frozen smoke (gate reliability)
// 5) Cartography (map entrypoints)
// 6) Orchestrator turn (save counsel + chat)

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { champions } from './champion_registry.mjs';
import { base, toolsPath as tools } from './nest_paths.mjs';

function runNode(script, args = [], opts = {}) {
  const res = spawnSync('node', [script, ...args], { stdio: 'inherit', env: { ...process.env, ...(opts.env||{}) } });
  if (res.status !== 0) {
    throw new Error(`[HFO] Step failed: node ${script} ${args.join(' ')}`);
  }
}

function verifyChampionDocs() {
  let missing = 0;
  for (const c of champions) {
    const dir = path.join(base, 'honeycomb', 'champions', c.pascal, 'docs');
    const files = ['persona.md', 'summon.md', 'canon.md'];
    for (const f of files) {
      const p = path.join(dir, f);
      if (!fs.existsSync(p)) {
        console.error(`[HFO] Missing champion doc: ${c.pascal}/docs/${f}`);
        missing++;
      }
    }
  }
  if (missing > 0) {
    throw new Error(`[HFO] Champion docs verification failed (${missing} missing file(s))`);
  }
}

const SAFE = process.env.HFO_SAFE_MODE === '1';

if (!SAFE) {
  console.log('[HFO] Start -> Summon champions (sequential)');
  runNode(tools('champion_summoner.mjs'), ['--apply']);
} else {
  console.log('[HFO] Start (safe) -> Skip summon');
}

console.log('[HFO] Start -> Verify champion docs');
verifyChampionDocs();

console.log('[HFO] Start -> Status');
runNode(tools('status.mjs'));

console.log('[HFO] Start -> Goals tick');
runNode(tools('goals_tick.mjs'));

console.log('[HFO] Start -> Frozen smoke');
runNode(tools('run_frozen_smoke.mjs'));

if (!SAFE) {
  console.log('[HFO] Start -> Cartography');
  runNode(tools('web_cartographer.mjs'));
  console.log('[HFO] Start -> Cards index');
  runNode(tools('cards_index.mjs'));
} else {
  console.log('[HFO] Start (safe) -> Skip cartography & cards');
}

console.log('[HFO] Start -> Orchestrator turn (save)');
runNode(tools('orchestrator_turn.mjs'), ['--run-daily', '--out', path.join(base, 'reports', 'turns')]);

console.log('[HFO] Start -> Turn shape lint');
runNode(tools('latest_turn_lint.mjs'));

console.log('[HFO] Start -> MoE chat (4+2, council)');
{
  const moeArgs = ['--mode','mentor','--tone','casual','--rounds','2','--council','--scribe'];
  const prov = process.env.HFO_LLM_PROVIDER || '';
  const model = process.env.HFO_LLM_MODEL || '';
  if (prov) {
    moeArgs.push('--provider', prov);
    if (model) moeArgs.push('--model', model);
  } else {
    console.log('[HFO] LLM provider not set (HFO_LLM_PROVIDER). Running chat without provider (deterministic counsel fallback).');
  }
  runNode(tools('moe_chat.mjs'), moeArgs);
}

console.log('[HFO] Start -> Heartbeat');
runNode(tools('heartbeat.mjs'));

console.log('\n[HFO] Start sequence PASSED');
