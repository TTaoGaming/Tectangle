// Composite preflight validator
// Usage: node HiveFleetObsidian/tools/hive_preflight.mjs [--strict]
// Runs: seeds suite, board freshness, history gap audit. Emits JSON summary.
// Platform agnostic: does not assume any specific AI runtime.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const tools = (p) => path.join(base,'tools',p);

function runNode(script, args=[]) {
  const res = spawnSync('node',[script,...args],{ encoding:'utf8' });
  return { code: res.status ?? 0, out: (res.stdout||'')+(res.stderr||'') };
}

function captureJSON(fn){
  try { return JSON.parse(fn()); } catch { return null; }
}

const seeds = runNode(tools('validate_seeds_suite.mjs'));
const board = runNode(tools('board_freshness.mjs'));
const gap = runNode(tools('history_gap_audit.mjs'));

const summary = {
  generated: new Date().toISOString(),
  seeds: { code: seeds.code, ok: seeds.code===0 },
  board: { code: board.code, ok: board.code===0 },
  history_gap: { code: gap.code, ok: gap.code===0 },
  status: 'OK'
};
if(!summary.seeds.ok || !summary.board.ok) summary.status = 'BLOCK';
else if(!summary.history_gap.ok) summary.status = 'WARN';

console.log(JSON.stringify(summary,null,2));
if(summary.status!=='OK') process.exitCode = 2;
