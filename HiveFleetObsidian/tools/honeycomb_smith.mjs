// Honeycomb Smith: build a categorized index of key knowledge
// Usage: node HiveFleetObsidian/tools/honeycomb_smith.mjs [--since-days 365] [--out docs/knowledge/honeycomb]
// Scans markdown/txt under selected roots and emits index.json and index.md

import fs from 'node:fs';
import path from 'node:path';
import { champions as registry } from './champion_registry.mjs';

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }

const sinceDays = Number(arg('since-days','365'));
const includeArchive = process.argv.includes('--include-archive');
const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const outDir = arg('out', path.join(baseNest,'honeycomb'));
const roots = [
  path.join('docs','knowledge'),
  path.join('docs','two-pagers'),
  path.join('docs','aichat'),
  path.join('September2025','Tectangle','docs'),
  path.join('September2025','PinchFSM','docs')
];

const IGNORE_SEGMENTS = new Set([
  'node_modules',
  '.git',
  '.history',
  '.husky',
  '.github',
  '.devcontainer',
  '.venv',
  ...(includeArchive ? [] : ['archive']),
  'archive-stale'
]);
const IGNORE_PATH_CONTAINS = [
  'archive-20', // timestamped archive folders
  ...(includeArchive ? [] : ['/archive/']),  // generic archive subfolders
  'modular-index/node_modules'
];
const startTime = Date.now() - sinceDays * 24*60*60*1000;

function listDocs(dir){
  if (!fs.existsSync(dir)) return [];
  const out=[]; const stack=[dir];
  while(stack.length){
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur,{withFileTypes:true})){
      const p = path.join(cur, e.name);
      if (e.isDirectory()){
        if (IGNORE_SEGMENTS.has(e.name)) continue;
        const rel = path.relative(process.cwd(), p);
        if (IGNORE_PATH_CONTAINS.some(m => rel.includes(m))) continue;
        stack.push(p);
      } else if (e.isFile()){
        const ext = path.extname(e.name).toLowerCase();
        if (!['.md','.txt'].includes(ext)) continue;
        const st = fs.statSync(p);
        if (st.mtimeMs >= startTime) out.push(p);
      }
    }
  }
  return out;
}

function readSnippet(p){
  try{
    const txt = fs.readFileSync(p,'utf8');
    const lines = txt.split(/\r?\n/);
    const titleLine = lines.find(l => /^#\s+/.test(l));
    const tldr = lines.find(l => /^tl;dr\s*:|^tldr\s*:/i.test(l));
    const nonEmpty = lines.find(l => l.trim().length>0);
    const title = titleLine ? titleLine.replace(/^#\s+/,'').trim() : path.basename(p).replace(/[_-]+/g,' ').replace(/\.[^.]+$/,'');
    const snippet = tldr ? tldr.replace(/^tl;dr\s*:|^tldr\s*:/i,'').trim() : (nonEmpty||'').trim();
    const st = fs.statSync(p);
    return { title, snippet: snippet.slice(0,240), mtime: new Date(st.mtimeMs).toISOString(), mtimeMs: st.mtimeMs };
  }catch{ return { title: path.basename(p), snippet: ''}; }
}

const cats = [
  { id:'decisions', name:'Decisions', tests:[/decision/i,/adr/i] },
  { id:'plans', name:'Plans', tests:[/plan|roadmap|two-?pager|todo/i] },
  { id:'diagnostics', name:'Diagnostics', tests:[/diagnostic|triage|root[_-]?cause/i] },
  { id:'testing', name:'Testing & CI', tests:[/golden|smoke|replay|ci/i] },
  { id:'algorithms', name:'Algorithms', tests:[/algorithm|oneeuro|fsm|rapier|pinch/i] },
  { id:'architecture', name:'Architecture', tests:[/hexagonal|ports|adapter|architecture/i] },
  { id:'ux', name:'UX & Demo', tests:[/ui|demo|sidepanel|smoothing|telemetry/i] },
  { id:'sdk', name:'SDK & API', tests:[/sdk|api|managerregistry/i] },
  { id:'notes', name:'Notes & Logs', tests:[/tommynotes|aichat|summary/i] },
  { id:'games', name:'Games', tests:[/game|piano|pachinko|ufo/i] },
];

function classify(p, textMeta){
  const rel = path.relative(process.cwd(), p).replace(/\\/g,'/');
  const hay = `${rel}\n${textMeta.title}\n${textMeta.snippet}`;
  for (const c of cats){ if (c.tests.some(rx => rx.test(hay))) return c.id; }
  return 'uncategorized';
}

const files = [...new Set(roots.flatMap(listDocs))].sort();
const itemsByCat = Object.fromEntries([...cats.map(c=>[c.id,[]]), ['uncategorized',[]]]);

for (const p of files){
  const meta = readSnippet(p);
  const cat = classify(p, meta);
  itemsByCat[cat].push({ path: p.replace(/\\/g,'/'), title: meta.title, snippet: meta.snippet, mtime: meta.mtime, mtimeMs: meta.mtimeMs });
}

fs.mkdirSync(outDir, { recursive:true });
const jsonPath = path.join(outDir, 'honeycomb_index.json');
fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), categories: Object.keys(itemsByCat).map(id=>({ id, name: (cats.find(c=>c.id===id)?.name)||'Uncategorized', count: itemsByCat[id].length, items: itemsByCat[id] })) }, null, 2));

const mdPath = path.join(outDir, 'honeycomb_index.md');
let md = `# Honeycomb Index (generated)\n\nGenerated: ${new Date().toISOString()}\n\n`;
for (const id of Object.keys(itemsByCat)){
  const name = (cats.find(c=>c.id===id)?.name)||'Uncategorized';
  const arr = itemsByCat[id];
  if (arr.length === 0) continue;
  md += `## ${name} (${arr.length})\n`;
  for (const it of arr.slice(0,30)){
    md += `- ${it.title} — ${it.snippet}\n  - ${it.path}\n`;
  }
  md += `\n`;
}
fs.writeFileSync(mdPath, md, 'utf8');

// Champion-specific indices (keyword routing)
const championDefs = registry.map(c=>({ id: c.id, pascal: c.pascal, name: c.name, tests: c.routeTests }));

function routeChampion(item){
  const hay = `${item.title}\n${item.snippet}\n${item.path}`;
  const bucket = [];
  for (const c of championDefs){ if (c.tests.some(rx=>rx.test(hay))) bucket.push(c.id); }
  return bucket;
}

const champRoot = path.join(outDir, 'champions');
fs.mkdirSync(champRoot, { recursive:true });
const flatItems = Object.values(itemsByCat).flat();
const byChampion = Object.fromEntries(championDefs.map(c=>[c.id,[]]));
for (const it of flatItems){
  for (const id of routeChampion(it)) byChampion[id].push(it);
}
for (const c of championDefs){
  const dir = path.join(champRoot, c.pascal);
  fs.mkdirSync(dir, { recursive:true });
  // sort by newest first
  const items = (byChampion[c.id] || []).slice().sort((a,b)=> (b.mtimeMs||0) - (a.mtimeMs||0));
  const canonical = items[0] || null;
  fs.writeFileSync(path.join(dir,'index.json'), JSON.stringify({ generatedAt:new Date().toISOString(), canonical, items }, null, 2));
  let mdC = `# ${c.name} — Honeycomb Index (generated)\n\n`;
  if (canonical) {
    mdC += `Canonical: ${canonical.title} — ${canonical.path} (${canonical.mtime})\n\n`;
  }
  const list = items.slice(0,40);
  for (const it of list){ mdC += `- ${it.title} — ${it.snippet}\n  - ${it.path} (${it.mtime})\n`; }
  fs.writeFileSync(path.join(dir,'index.md'), mdC, 'utf8');
}

// Canon manifest (per champion)
const canonDir = path.join(outDir, 'canon');
fs.mkdirSync(canonDir, { recursive:true });
const manifest = { generatedAt: new Date().toISOString(), champions: [] };
for (const c of championDefs){
  const items = (byChampion[c.id] || []).slice().sort((a,b)=> (b.mtimeMs||0) - (a.mtimeMs||0));
  const canonical = items[0] || null;
  manifest.champions.push({ id: c.id, name: c.name, pascal: c.pascal, canonical });
}
fs.writeFileSync(path.join(canonDir, 'canon_manifest.json'), JSON.stringify(manifest, null, 2));

let report = `# Canon Report (generated)\n\nGenerated: ${new Date().toISOString()}\n\n`;
for (const c of manifest.champions){
  report += `## ${c.name}\n`;
  if (c.canonical) report += `- Canonical: ${c.canonical.title}\n  - ${c.canonical.path} (${c.canonical.mtime})\n\n`;
  else report += `- Canonical: (none)\n\n`;
}
fs.writeFileSync(path.join(canonDir, 'canon_report.md'), report, 'utf8');

console.log(`[Honeycomb] Indexed ${files.length} files; champions routed; canon written -> ${mdPath}`);
