// Orchestrator Facade: progressive disclosure, background automation, concise report
// Usage: node HiveFleetObsidian/tools/orchestrator_facade.mjs [--prompt "..."] [--metric "..."] [--verbose]
// Behavior:
//  1) Touch board (Problem/Metric if provided) and set Last-Updated
//  2) Preflight: seeds + board + gap audit
//  3) Generate counsel (orchestrator_turn)
//  4) Run seeker probes to produce marks
//  5) Decide recommended champion & step (simple policy: if health green => exploit; else explore)
//  6) Produce Summary (short), Evidence (optional), and save JSON/MD report
//  7) Append scribe line (typed)

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function arg(name, def=''){ const i=process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const prompt = arg('prompt','').trim();
const metric = arg('metric','').trim();
const verbose = process.argv.includes('--verbose');

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const tools = (p)=> path.join(base,'tools',p);

function runNode(script, args=[], enc='utf8'){
  const res = spawnSync('node', [script, ...args], { encoding: enc });
  return { code: res.status ?? 0, out: (res.stdout||'') + (res.stderr||'') };
}

// 1) Touch board
const touchArgs = [];
if (prompt) touchArgs.push('--problem', prompt);
if (metric) touchArgs.push('--metric', metric);
if (touchArgs.length) runNode(tools('board_touch.mjs'), touchArgs);

// 2) Preflight
const pre = runNode(tools('hive_preflight.mjs'));
let preJson = {}; try { preJson = JSON.parse(pre.out); } catch {}

// 3) Counsel (turn)
const turnRes = runNode(tools('orchestrator_turn.mjs'));
let turnJson = {}; try { turnJson = JSON.parse(turnRes.out); } catch {}

// 4) Seeker probes
runNode(tools('faultline_probes.mjs'));

// 5) Decide champion & step
function pickChampion(){
  const ok = preJson?.status === 'OK';
  const counsel = turnJson?.counsel || {};
  if (ok && counsel.exploit) return { id:'thread_sovereign', what: counsel.exploit.what, why: counsel.exploit.why, how: counsel.exploit.how };
  if (counsel.explore) return { id:'faultline_seeker', what: counsel.explore.what, why: counsel.explore.why, how: counsel.explore.how };
  // fallback
  return { id:'web_cartographer', what:'Adopt ports/adapters at next seam; land smallest step', why:'Reduce drift; enable parallel adapters', how:['Name ports','Stub one adapter','Map links'] };
}
const rec = pickChampion();

// 6) Report
const ts = new Date().toISOString().replace(/[:]/g,'-');
const sessionsDir = path.join(base,'reports','sessions');
fs.mkdirSync(sessionsDir,{ recursive:true });
const jsonPath = path.join(sessionsDir, `session_${ts}.json`);
const mdPath = path.join(sessionsDir, `session_${ts}.md`);

const summary = {
  generatedAt: new Date().toISOString(),
  board: { problem: prompt || '(see BOARD)', metric: metric || '(see BOARD)' },
  preflight: preJson || null,
  guardrail: turnJson?.guardrail || 'Ship only if frozen smoke passes.',
  recommended: { champion: rec.id, step: rec.what, why: rec.why, plan: rec.how || [] },
  provenance: { counsel: 'orchestrator_turn', marksDir: 'marks/active', cartography: 'cartography/web_map.md' }
};

// Progressive disclosure: print compact summary, keep details in files
const compact = [
  `BOARD: ${prompt || '(unchanged)'} | Metric: ${metric || '(unchanged)'} `,
  `STATUS: ${preJson?.status || 'unknown'} | Guardrail: ${summary.guardrail}`,
  `RECOMMEND: ${rec.id} → ${rec.what}`,
  `WHY: ${rec.why}`
].join('\n');

console.log(compact);

fs.writeFileSync(jsonPath, JSON.stringify({ summary, preflight: preJson, counsel: turnJson?.counsel || {}, chat: null }, null, 2));
const md = [
  `# Orchestrator Session (${summary.generatedAt})`,
  '',
  '## Summary',
  `- Status: ${preJson?.status || 'unknown'}`,
  `- Guardrail: ${summary.guardrail}`,
  `- Champion: ${rec.id}`,
  `- Step: ${rec.what}`,
  `- Why: ${rec.why}`,
  `- Plan: ${(rec.how||[]).join(' → ')}`,
  '',
  '## Evidence (for later)',
  '- Counsel: orchestrator_turn.mjs (latest run)',
  '- Marks: HiveFleetObsidian/marks/active',
  '- Cartography: HiveFleetObsidian/cartography/web_map.md',
];
fs.writeFileSync(mdPath, md.join('\n')+'\n','utf8');

// 7) Append scribe
runNode(tools('append_history.mjs'), ['--snapshot','orchestrator_facade','--metric',`status:${preJson?.status||'unknown'}; champion:${rec.id}`,'--lesson',rec.what,'--type','orchestrate']);

console.log(`\n[save] ${mdPath}`);
