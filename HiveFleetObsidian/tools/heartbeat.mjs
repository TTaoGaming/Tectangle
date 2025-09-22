// Heartbeat: quick health/voice/shape checks + scribe + report
// Usage: node HiveFleetObsidian/tools/heartbeat.mjs

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const tools = (p) => path.join(base, 'tools', p);

function latest(dir, rx){
  if (!fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter(n=> rx.test(n));
  if (!files.length) return '';
  files.sort((a,b)=> fs.statSync(path.join(dir,b)).mtimeMs - fs.statSync(path.join(dir,a)).mtimeMs);
  return path.join(dir, files[0]);
}

function read(p){ try { return fs.readFileSync(p,'utf8'); } catch { return ''; } }

const report = { checks: [], summary: { ok:0, warn:0, fail:0 } };
function add(name, status, note=''){ report.checks.push({ name, status, note }); report.summary[status]++; }

// 0) Smith index + enforce arch
try{
  const smith = spawnSync('node', [tools('honeycomb_smith.mjs')], { encoding:'utf8' });
  const ok = /Indexed/.test((smith.stdout||'')+(smith.stderr||''));
  add('smith.index', ok ? 'ok':'warn', ok ? 'indexed' : 'ran');
}catch(e){ add('smith.index','fail', String(e)); }
try{
  const enf = spawnSync('node', [tools('smith_enforce_arch.mjs')], { encoding:'utf8' });
  const fine = enf.status===0; // non-zero if problems
  add('smith.arch', fine ? 'ok' : 'warn', fine ? 'clean' : 'issues');
}catch(e){ add('smith.arch','fail', String(e)); }

// 1) Turn shape lint
try{
  const dir = path.join(base, 'reports', 'turns');
  const file = latest(dir, /^turn_.*\.json$/);
  if (!file) add('turn.shape', 'warn', 'no turn_*.json');
  else {
    const res = spawnSync('node', [tools('response_shape_lint.mjs'), file], { encoding:'utf8' });
    const ok = (res.stdout||'').includes('[Shape] PASS') || res.status===0;
    add('turn.shape', ok ? 'ok' : 'fail', file);
  }
}catch(e){ add('turn.shape','fail', String(e)); }

// 2) Latest MoE chat contains core voices
try{
  const dir = path.join(base, 'reports', 'chats');
  const file = latest(dir, /^chat_.*\.txt$/);
  if (!file) add('chat.moe', 'warn', 'no chat_*.txt');
  else {
    const txt = read(file);
    const speakers = ['TTao:', 'Thread Sovereign:', 'Faultline Seeker:', 'Prism Magus:', 'Web Cartographer:', 'Silk Scribe:'];
    const missing = speakers.filter(s=> !txt.includes(s));
    if (missing.length) add('chat.moe', 'fail', `missing: ${missing.join(', ')}`);
    else if (/<fill>/.test(txt)) add('chat.moe', 'warn', 'contains <fill> placeholder');
    else add('chat.moe','ok', path.basename(file));
  }
}catch(e){ add('chat.moe','fail', String(e)); }

// 3) Glossary exists
try{
  const p = path.join(base,'honeycomb','plain_language_glossary.json');
  if (fs.existsSync(p)) add('glossary','ok', 'present');
  else add('glossary','warn','missing');
}catch(e){ add('glossary','fail', String(e)); }

// 3b) Ownership stamp exists
try{
  const p = path.join(base,'honeycomb','OWNERSHIP.json');
  if (fs.existsSync(p)) add('ownership','ok', 'STAMP present');
  else add('ownership','warn','missing OWNERSHIP.json');
}catch(e){ add('ownership','fail', String(e)); }

// 4) Core personas/canons do not have <fill>
try{
  const core = ['ThreadSovereign','FaultlineSeeker','PrismMagus','WebCartographer'];
  let bad=[];
  for (const c of core){
    const dp = path.join(base,'honeycomb','champions',c,'docs');
    for (const f of ['persona.md','canon.md']){
      const p = path.join(dp, f);
      if (!fs.existsSync(p)) { bad.push(`${c}/${f}:missing`); continue; }
      if (/<fill>/i.test(read(p))) bad.push(`${c}/${f}:<fill>`);
    }
  }
  if (bad.length) add('docs.core','warn', bad.join('; ')); else add('docs.core','ok','filled');
}catch(e){ add('docs.core','fail', String(e)); }

// 5) Frozen smoke quick check
try{
  const frozen = spawnSync('node', [tools('run_frozen_smoke.mjs')], { encoding:'utf8' });
  const ok = /Frozen smoke PASS/.test((frozen.stdout||'') + (frozen.stderr||''));
  add('frozen.smoke', ok ? 'ok':'fail', ok ? 'PASS' : 'see logs');
}catch(e){ add('frozen.smoke','fail', String(e)); }

// Write report
const outDir = path.join(base, 'reports', 'heartbeat');
fs.mkdirSync(outDir, { recursive:true });
const ts = new Date().toISOString().replace(/[:]/g,'-');
const jsonPath = path.join(outDir, `heartbeat_${ts}.json`);
fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2));

let md = `# Heartbeat\n\nGenerated: ${new Date().toISOString()}\n\n`;
for (const c of report.checks){ md += `- ${c.name}: ${c.status} — ${c.note||''}\n`; }
const mdPath = path.join(outDir, `heartbeat_${ts}.md`);
fs.writeFileSync(mdPath, md, 'utf8');

// Scribe
try{
  spawnSync('node', [tools('append_history.mjs'), '--snapshot', 'heartbeat', '--metric', `ok:${report.summary.ok}; warn:${report.summary.warn}; fail:${report.summary.fail}`, '--lesson', 'Ensure champion voices present; turn shape; glossary; frozen pass'], { stdio:'inherit' });
}catch{}

console.log('[Heartbeat] Report ->', mdPath);
