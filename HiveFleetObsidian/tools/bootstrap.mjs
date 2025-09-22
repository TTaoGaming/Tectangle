// Hive Fleet bootstrap: make the nest portable and ready
// - Initializes Board/history if missing
// - Builds Honeycomb index inside the nest
// - Runs internal portable smoke to prove determinism

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const boardPath = path.join(baseNest, 'BOARD.current.txt');
const historyPath = path.join(baseNest, 'history', 'hive_history.jsonl');

function ensureBoard(){
  if (!fs.existsSync(boardPath)) {
    const lines = [
      'Problem: ',
      'Metric: ',
      'Constraint: ',
      'Horizons: 1h= | 1d= | 1w= | 1m=',
      'Current: '
    ].join('\n');
    fs.writeFileSync(boardPath, lines, 'utf8');
    console.log('[HFO] Initialized BOARD.current.txt');
  }
}

function appendHistory(snapshot, metric, lesson){
  fs.mkdirSync(path.dirname(historyPath), { recursive:true });
  const line = JSON.stringify({ snapshot, metric_delta: metric, lesson });
  fs.appendFileSync(historyPath, line + '\n', 'utf8');
}

function run(cmd, args, env={}){
  const res = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (res.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
}

ensureBoard();
appendHistory('bootstrap:portable', 'init', 'Initialized nest and starting internal checks');

// Build Honeycomb index inside the nest
run('node', [path.join(baseNest, 'tools', 'honeycomb_smith.mjs')]);

// Run portable smoke on internal traces with frozen expectations
const portableRunner = path.join(baseNest, 'tools', 'portable_replay_from_trace.mjs');
const traces = [
  path.join(baseNest,'landmarks','right_hand_normal.landmarks.jsonl'),
  path.join(baseNest,'landmarks','right_hand_gated.landmarks.jsonl')
];
run('node', [portableRunner, traces[0]], { EXPECT_DOWNS: '1', EXPECT_UPS: '1' });
run('node', [portableRunner, traces[1]], { EXPECT_DOWNS: '0', EXPECT_UPS: '0' });

appendHistory('bootstrap:portable:ok', 'pass', 'Honeycomb + portable smoke passed');
console.log('\n[HFO] Portable bootstrap PASSED');

