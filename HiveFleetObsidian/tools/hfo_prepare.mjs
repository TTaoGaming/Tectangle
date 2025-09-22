#!/usr/bin/env node
/**
 * HFO Prepare: single entry facade to update indices, manifest, orchestrations, and rollup
 */

import { spawn } from 'child_process';

function run(cmd, args){
  return new Promise((resolve) => {
  const p = spawn(cmd, args, { shell: false, stdio: 'inherit' });
    p.on('close', code => resolve(code));
  p.on('error', () => resolve(1));
  });
}

async function main(){
  const steps = [
    ['node', ['HiveFleetObsidian/tools/hfo_ship_index.mjs']],
    ['node', ['HiveFleetObsidian/tools/hfo_ship_manifest.mjs']],
    ['node', ['HiveFleetObsidian/tools/orchestration_seed.mjs']],
  ['node', ['HiveFleetObsidian/tools/champions_seed.mjs']],
  ['node', ['HiveFleetObsidian/tools/training_seed.mjs']],
  ['node', ['HiveFleetObsidian/tools/hfo_drift_report.mjs']],
    ['node', ['HiveFleetObsidian/tools/hfo_ship_health.mjs']],
    ['node', ['HiveFleetObsidian/tools/hfo_ship_rollup.mjs']]
  ];
  for(const [cmd,args] of steps){
    const code = await run(cmd,args);
    if(code !== 0){ process.exit(code); }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
