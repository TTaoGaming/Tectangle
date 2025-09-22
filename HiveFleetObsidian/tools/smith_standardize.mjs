// Smith Standardize: run a tidy pass and validate champion honeycombs
// Usage: node HiveFleetObsidian/tools/smith_standardize.mjs [--include-archive]

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { champions as registry } from './champion_registry.mjs';

function run(cmd, args){
  const r = spawnSync(cmd, args, { stdio:'pipe', encoding:'utf8' });
  return { code: r.status ?? 0, out: (r.stdout||'')+(r.stderr||'') };
}

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const honeyRoot = path.join(baseNest, 'honeycomb');
const champRoot = path.join(honeyRoot, 'champions');

// 1) Normalize ASCII in nest
run('node',[path.join(baseNest,'tools','normalize_ascii.mjs'),'--apply']);

// 2) Build honeycomb index (optionally include archives)
const includeArchive = process.argv.includes('--include-archive');
const smithArgs = [path.join(baseNest,'tools','honeycomb_smith.mjs')];
if (includeArchive) smithArgs.push('--include-archive');
run('node', smithArgs);

// 3) Load index and compute duplicate titles
const indexPath = path.join(honeyRoot, 'honeycomb_index.json');
let dupCount = 0; let dupGroups = [];
try{
  const d = JSON.parse(fs.readFileSync(indexPath,'utf8'));
  const items = d.categories.flatMap(c=>c.items||[]);
  const map = {};
  for(const it of items){ const k = (it.title||'').trim().toLowerCase(); if(!k) continue; (map[k] ||= []).push(it); }
  dupGroups = Object.values(map).filter(arr=>arr.length>1);
  dupCount = dupGroups.length;
}catch{}

// 4) Validate champion docs
function read(p){ try { return fs.readFileSync(p,'utf8'); } catch { return ''; } }
function hasLine(txt, prefix){ return txt.split(/\r?\n/).some(l=>l.trim().toLowerCase().startsWith(prefix.toLowerCase())); }
function missingField(txt, prefix){
  const line = txt.split(/\r?\n/).find(l=>l.trim().toLowerCase().startsWith(prefix.toLowerCase()));
  if(!line) return true;
  return /<one line>|<comma-separated>|<fill>|<rule 1>/i.test(line);
}

const perChampion = [];
for (const c of registry){
  const b = path.join(champRoot, c.pascal);
  const persona = read(path.join(b,'docs','persona.md'));
  const canon = read(path.join(b,'docs','canon.md'));
  const needs = [];
  if (!persona) needs.push('persona.md missing');
  else {
    const req = [
      '- Intro:',
      '- Main bias:',
      '- Tradeoffs:',
      '- Myth/archetype lineage:',
      '- Historical lineage:',
      '- Alt names:'
    ];
    for (const r of req){ if (!hasLine(persona, r) || missingField(persona, r)) needs.push(`persona:${r}`); }
  }
  if (!canon) needs.push('canon.md missing');
  else {
    if (!hasLine(canon, 'One-liner:')) needs.push('canon:One-liner');
    if (!/Rules I keep/i.test(canon)) needs.push('canon:Rules');
    if (!hasLine(canon, 'Success criteria:')) needs.push('canon:Success criteria');
  }
  perChampion.push({ id:c.id, name:c.name, pascal:c.pascal, needs });
}

const missing = perChampion.filter(x=>x.needs.length>0);

// 5) Write report
fs.mkdirSync(honeyRoot, { recursive:true });
const reportJson = path.join(honeyRoot, 'smith_report.json');
const reportMd = path.join(honeyRoot, 'smith_report.md');
const payload = { generatedAt: new Date().toISOString(), dupCount, missing, totals:{ champions: registry.length, missing: missing.length } };
fs.writeFileSync(reportJson, JSON.stringify(payload, null, 2));

let md = `# Smith Report (standardize)\n\nGenerated: ${payload.generatedAt}\n\n`+
`- Champions: ${payload.totals.champions}\n`+
`- Champions with issues: ${payload.totals.missing}\n`+
`- Duplicate titles: ${dupCount}\n\n`;
for (const g of dupGroups.slice(0,10)){
  md += `## Duplicate: ${g[0].title}\n`; for (const it of g) md += `- ${it.path}\n`; md += `\n`;
}
if (missing.length){
  md += `## Missing Fields\n`;
  for (const m of missing){ md += `- ${m.name} (${m.pascal}): ${m.needs.join(', ')}\n`; }
}
fs.writeFileSync(reportMd, md, 'utf8');

// 6) Changelog line
const changelog = path.join(honeyRoot, 'SMITH_CHANGELOG.md');
const line = `- ${new Date().toISOString()} standardize: dup=${dupCount} missing=${missing.length}`;
fs.appendFileSync(changelog, line+'\n', 'utf8');

console.log(`[Smith] Standardize complete -> ${reportMd}`);

