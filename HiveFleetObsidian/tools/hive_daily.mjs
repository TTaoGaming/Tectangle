// Hive Daily: one-click maintenance and validation routine
// Steps: normalize -> smith index -> standardize -> smoke -> freeze+verify -> cartography -> champions status -> report -> scribe

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const tools = p => path.join(base, 'tools', p);
const outRoot = path.join(base, 'reports', 'daily');
fs.mkdirSync(outRoot, { recursive: true });
const stamp = new Date().toISOString().slice(0,10);
const jsonPath = path.join(outRoot, `${stamp}.json`);
const mdPath = path.join(outRoot, `${stamp}.md`);

function runNode(script, args=[]) {
  const res = spawnSync('node', [script, ...args], { encoding: 'utf8' });
  return { code: res.status ?? 0, out: (res.stdout||'') + (res.stderr||'') };
}

function step(name, fn){
  try { return { name, ...fn() }; } catch(e){ return { name, error: String(e) }; }
}

const steps = [];

// 1) Normalize ASCII
steps.push(step('normalize', ()=> runNode(tools('normalize_ascii.mjs'), ['--apply'])));

// 2) Smith index
steps.push(step('smith', ()=> runNode(tools('honeycomb_smith.mjs'))));

// 3) Standardize
steps.push(step('standardize', ()=> runNode(tools('smith_standardize.mjs'))));

// 4) Smoke
steps.push(step('smoke', ()=> runNode(tools('run_replay_smoke.mjs'))));

// 5) Freeze expectations and verify frozen
steps.push(step('freeze', ()=> runNode(tools('freeze_expectations_from_smoke.mjs'))));
steps.push(step('frozen', ()=> runNode(tools('run_frozen_smoke.mjs'))));

// 6) Web cartography
steps.push(step('cartography', ()=> runNode(tools('web_cartographer.mjs'))));

// 7) Champions status
const status = step('champions_status', ()=> runNode(tools('champions_status.mjs')));
steps.push(status);

// Parse some metrics
let dupCount = 0; let championsMiss = 0; let smokePass = false; let frozenPass = false;
try {
  const indexPath = path.join(base, 'honeycomb', 'honeycomb_index.json');
  const d = JSON.parse(fs.readFileSync(indexPath,'utf8'));
  const items = d.categories.flatMap(c=>c.items||[]);
  const map = {};
  for (const it of items){ const k = (it.title||'').trim().toLowerCase(); if(!k) continue; (map[k] ||= []).push(it); }
  dupCount = Object.values(map).filter(arr=>arr.length>1).length;
} catch {}

smokePass = /\bSmoke PASS\b/.test((steps.find(s=>s.name==='smoke')?.out)||'');
frozenPass = /\bFrozen smoke PASS\b/.test((steps.find(s=>s.name==='frozen')?.out)||'');
championsMiss = ((status.out||'').match(/\bMISS tools\b/g)||[]).length;

// Write JSON report
const payload = {
  generatedAt: new Date().toISOString(),
  metrics: { dupTitles: dupCount, smokePass, frozenPass, championsMiss },
  steps: steps.map(s=>({ name:s.name, code:s.code??0 }))
};
fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

// Write MD report
let md = `# Hive Daily Report\n\nGenerated: ${payload.generatedAt}\n\n`+
`- Duplicate titles: ${dupCount}\n`+
`- Smoke: ${smokePass?'PASS':'FAIL'}\n`+
`- Frozen: ${frozenPass?'PASS':'FAIL'}\n`+
`- Champions with missing tools: ${championsMiss}\n\n`+
`## Steps\n`;
for (const s of steps){ md += `- ${s.name}: code=${s.code}\n`; }
fs.writeFileSync(mdPath, md, 'utf8');

// Scribe line
const scribe = runNode(tools('append_history.mjs'), [
  '--snapshot', 'Daily maintenance run',
  '--metric', `dup:${dupCount}; smoke:${smokePass?'pass':'fail'}; frozen:${frozenPass?'pass':'fail'}; miss:${championsMiss}`,
  '--lesson', 'Normalize->Smith->Standardize->Freeze->Verify->Map; automate daily'
]);
console.log('[Daily] Report ->', mdPath);

