// Orchestrator Turn: produce counsel JSON + chat transcript and append a Scribe line
// Usage: node HiveFleetObsidian/tools/orchestrator_turn.mjs [--run-daily] [--out dir]

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const tools = p => path.join(base, 'tools', p);

function runNode(script, args=[]) {
  const res = spawnSync('node', [script, ...args], { encoding: 'utf8' });
  return { code: res.status ?? 0, out: (res.stdout||'') + (res.stderr||'') };
}

function readBoard(){
  const p = path.join(base, 'BOARD.current.txt');
  if (!fs.existsSync(p)) return { raw:'', fields:{} };
  const raw = fs.readFileSync(p,'utf8');
  const fields = {};
  for (const line of raw.split(/\r?\n/)){
    const m = line.match(/^(Problem|Metric|Constraint|Horizons|Current):\s*(.*)$/i);
    if (m) fields[m[1].toLowerCase()] = m[2].trim();
  }
  return { raw, fields };
}

function honeyStats(){
  const idx = path.join(base, 'honeycomb', 'honeycomb_index.json');
  try{
    const d = JSON.parse(fs.readFileSync(idx,'utf8'));
    const items = d.categories.flatMap(c=>c.items||[]);
    const map = {};
    for (const it of items){ const k=(it.title||'').trim().toLowerCase(); if(!k) continue; (map[k] ||= []).push(it); }
    const dup = Object.values(map).filter(a=>a.length>1).length;
    return { docs: items.length, dup };
  }catch{ return { docs: 0, dup: 0 }; }
}

// Optional daily
if (process.argv.includes('--run-daily')) {
  runNode(tools('hive_daily.mjs')); // non-fatal
}

// Metrics
const board = readBoard();
const stats = honeyStats();
const frozen = runNode(tools('run_frozen_smoke.mjs'));
const smokePass = /\bSmoke PASS\b/.test(runNode(tools('run_replay_smoke.mjs')).out);
const frozenPass = /\bFrozen smoke PASS\b/.test(frozen.out);
const champions = runNode(tools('champions_status.mjs')).out;
const miss = (champions.match(/\bMISS tools\b/g)||[]).length;

// Counsel JSON (minimal, grounded to current metrics)
const counsel = {
  explore: {
    what: 'Design 1–3 micro-tests for riskiest assumption in Board; run replay on a new short trace',
    why: 'Reduce uncertainty before we scale parallel work',
    win: 'Stop rule hit (signal or timeout) on at least one probe',
    warnings: 'Keep experiments cheap; archive findings',
    how: ['Name assumption in Board', 'Record 30–60s trace', 'Run replay and log result']
  },
  pivot: {
    what: 'Run prism_reframe.mjs with goal from Board to compare baseline vs new angle',
    why: 'Keep goal, change approach; choose easier path by EV',
    win: 'EV_new > EV_old within constraints; no regressions',
    warnings: 'A/B is a tactic; prefer simplest viable comparison',
    how: ['Define metric and budget', 'Run prism_reframe.mjs --goal "…"', 'Keep winner; archive other']
  },
  reorient: {
    what: 'Adopt ports/adapters for the next seam; land the smallest first step',
    why: 'Pattern reduces drift and enables parallel adapters later',
    win: 'Pattern named; first step merged; links mapped',
    warnings: 'No heavy deps; prefer adapters over rewrites',
    how: ['Name ports', 'Stub one adapter', 'Map links in web_map.md']
  },
  exploit: {
    what: 'Run hive:daily and fill Board; commit one safe improvement (e.g., overview/standardize turn)',
    why: 'Deterministic health first; then one reversible step today',
    win: `dup==0 && smoke:${smokePass?'pass':'fail'} && frozen:${frozenPass?'pass':'fail'} && miss==0`,
    warnings: 'Ship only if frozen PASS; otherwise block and fix',
    how: ['npm run hive:daily', 'Fix any MISS/dup', 'Append Scribe line']
  }
};

const guardrail = 'Ship only if frozen smoke passes and duplicate titles == 0; otherwise block and report.';

const metricDelta = `dup:${stats.dup}; smoke:${smokePass?'pass':'fail'}; frozen:${frozenPass?'pass':'fail'}; miss:${miss}`;
const history = {
  snapshot: 'Orchestrator turn generated (counsel + chat)',
  metric_delta: metricDelta,
  lesson: 'Keep JSON for tools + chat for humans; cite evidence and append Scribe each turn'
};

// Chat Transcript
const lines = [];
const problem = board.fields.problem || '(unset)';
lines.push(`TTao: Set course. Problem: ${problem}. We sail for deterministic ground.`);
lines.push(`Thread Sovereign: One step today: run daily, fix any MISS, then cut the smallest reversible improvement.`);
lines.push(`Faultline Seeker: Probe the riskiest assumption with a 60s trace. Stop on signal or timeout.`);
lines.push(`Prism Magus: Same goal, easier route—compare baseline vs a reframe; keep the winner.`);
lines.push(`Web Cartographer: Adopt ports/adapters here; land the smallest first step and map links.`);
lines.push(`Silk Scribe: Logged: Orchestrator turn | ${metricDelta}`);

// Provenance
const prov = [
  path.join(base,'tools','hive_daily.mjs'),
  path.join(base,'tools','champions_status.mjs'),
  path.join(base,'honeycomb','CHAMPIONS_OVERVIEW.md')
].map(p=>p.replace(/\\/g,'/'));

// Output
const out = { counsel, guardrail, history, chat: lines, provenance: prov };
console.log(JSON.stringify(out, null, 2));

// Optional: persist to reports/turns
const outDir = arg('out', path.join(base, 'reports','turns'));
try{
  fs.mkdirSync(outDir, { recursive:true });
  const ts = new Date().toISOString().replace(/[:]/g,'-');
  const file = path.join(outDir, `turn_${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  const chatFile = file.replace(/\.json$/, '.chat.txt');
  fs.writeFileSync(chatFile, out.chat.join('\n')+'\n', 'utf8');
}catch{}

 // Board freshness check (warn + separate history line if stale)
 try {
   const fres = spawnSync('node', [tools('board_freshness.mjs'), '--max-age-min','90'], { encoding:'utf8' });
   if (fres.status !== 0) {
     lines.unshift('Silk Scribe: WARNING board stale — run hive:board:wizard to refresh problem & metric.');
     spawnSync('node', [tools('append_history.mjs'), '--snapshot','board_stale','--metric',`dup:${stats.dup}`,'--lesson','Board stale warning emitted','--type','warn'], { stdio:'ignore' });
   }
 } catch {}

 // Append Scribe line (guarded) + always append minimal
 const shouldAppend = (stats.dup === 0 && smokePass && frozenPass && miss === 0);
 if (shouldAppend) {
   spawnSync('node', [tools('append_history.mjs'), '--snapshot', history.snapshot, '--metric', history.metric_delta, '--lesson', history.lesson, '--type','turn'], { stdio:'inherit' });
 } else {
   console.log('[Silk] Skipping guarded append — guardrail not satisfied:', JSON.stringify({ dup: stats.dup, smoke: smokePass, frozen: frozenPass, miss }));
 }
 // Minimal heartbeat append
 spawnSync('node', [tools('append_history.mjs'), '--snapshot','turn_heartbeat','--metric',`dup:${stats.dup};miss:${miss}`,'--lesson','Turn executed (heartbeat)','--type','turn-hb'], { stdio:'ignore' });
