// HFO Facade: stable action interface (state→action style)
// Usage: node HiveFleetObsidian/tools/hfo.mjs <action>
// Actions: start | status | smoke | frozen | turn | daily | carto | champions:verify

import { spawnSync } from 'node:child_process';
import { toolsPath, joinBase } from './nest_paths.mjs';

function runNode(script, args = []){
  const r = spawnSync('node', [script, ...args], { stdio: 'inherit' });
  if ((r.status ?? 0) !== 0) process.exit(r.status ?? 1);
}

const action = (process.argv[2]||'start').toLowerCase();

switch(action){
  case 'start':
    runNode(toolsPath('start.mjs')); break;
  case 'status':
    runNode(toolsPath('status.mjs')); break;
  case 'smoke':
    runNode(toolsPath('run_replay_smoke.mjs')); break;
  case 'frozen':
    runNode(toolsPath('run_frozen_smoke.mjs')); break;
  case 'turn':
    runNode(toolsPath('orchestrator_turn.mjs'), ['--run-daily','--out', joinBase('reports','turns')]); break;
  case 'daily':
    runNode(toolsPath('hive_daily.mjs')); break;
  case 'carto':
  case 'cartography':
    runNode(toolsPath('web_cartographer.mjs')); break;
  case 'champions:verify':
    runNode(toolsPath('champions_verify_docs.mjs')); break;
  default:
    console.log('HFO actions: start | status | smoke | frozen | turn | daily | carto | champions:verify');
    process.exit(2);
}

