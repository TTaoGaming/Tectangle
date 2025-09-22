// Honeycomb Consolidate: plan and optionally apply duplicate cleanup
// - Reads Honeycomb index, finds duplicate titles, and consolidates by moving
//   non-canonical files into a local 'archive' folder next to their source.
// Usage:
//   node HiveFleetObsidian/tools/honeycomb_consolidate.mjs [--apply] [--canon-dir docs/two-pagers]
//   Optional: --since-days 365 (passed through to smith if you choose to run it before)

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def='') { const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const APPLY = process.argv.includes('--apply');
const canonDir = arg('canon-dir', path.join('docs','two-pagers')).replace(/\\/g,'/');

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const honeyRoot = path.join(baseNest, 'honeycomb');
const indexPath = path.join(honeyRoot, 'honeycomb_index.json');
const outDir = path.join(honeyRoot, 'consolidation');
fs.mkdirSync(outDir, { recursive: true });

function readIndex(){
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Honeycomb index not found at ${indexPath}. Run: npm run hive:smith`);
  }
  const data = JSON.parse(fs.readFileSync(indexPath,'utf8'));
  const items = data.categories.flatMap(c=>c.items||[]);
  return items;
}

function normTitle(t){ return (t||'').trim().toLowerCase(); }

function groupDuplicates(items){
  const byTitle = {};
  for(const it of items){
    const k = normTitle(it.title);
    if(!k) continue;
    (byTitle[k] ||= []).push(it);
  }
  const dups = Object.entries(byTitle)
    .map(([k, arr])=>({ key:k, items:arr }))
    .filter(g=>g.items.length>1)
    .sort((a,b)=> b.items.length - a.items.length);
  return dups;
}

function chooseCanonical(group){
  // Prefer canonDir if present; else newest by mtimeMs
  const withCanonDir = group.items.filter(it => it.path.replace(/\\/g,'/').startsWith(canonDir + '/'));
  if (withCanonDir.length) {
    // newest within canonDir
    return withCanonDir.slice().sort((a,b)=>(b.mtimeMs||0)-(a.mtimeMs||0))[0];
  }
  return group.items.slice().sort((a,b)=>(b.mtimeMs||0)-(a.mtimeMs||0))[0];
}

function planMoves(group, canonical){
  const moves=[];
  for(const it of group.items){
    if(it.path === canonical.path) continue;
    const p = it.path.replace(/\\/g,'/');
    if(/(^|\/)archive(\/|$)/i.test(p)) continue; // already archived
    const dir = path.dirname(p);
    const targetDir = path.join(dir, 'archive');
    const target = path.join(targetDir, path.basename(p));
    moves.push({ from: p, to: target.replace(/\\/g,'/') });
  }
  return moves;
}

function ensureDir(p){ fs.mkdirSync(p, { recursive:true }); }

function applyMoves(moves){
  let ok=0, fail=0; const errors=[];
  for(const m of moves){
    try{
      ensureDir(path.dirname(m.to));
      fs.renameSync(m.from, m.to);
      ok++;
      console.log(`[MOVE] ${m.from} -> ${m.to}`);
    }catch(e){
      fail++; errors.push({ move:m, error: String(e) });
      console.log(`[FAIL] ${m.from} -> ${m.to} :: ${e}`);
    }
  }
  return { ok, fail, errors };
}

function writePlan(out){
  const planPath = path.join(outDir, 'plan.json');
  fs.writeFileSync(planPath, JSON.stringify(out, null, 2));
  const mdPath = path.join(outDir, 'report.md');
  let md = `# Consolidation Report (generated)\n\nGenerated: ${new Date().toISOString()}\n\n`;
  md += `Duplicates: ${out.duplicates}\n\n`;
  for(const g of out.groups){
    md += `## ${g.title} (x${g.count})\n`;
    md += `- Canonical: ${g.canonical.path}\n`;
    for(const m of g.moves){ md += `- Move: ${m.from} -> ${m.to}\n`; }
    md += `\n`;
  }
  if(out.applied){
    md += `\n## Apply Summary\n- ok: ${out.applySummary.ok}\n- fail: ${out.applySummary.fail}\n`;
  }
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log(`[Consolidate] Plan written -> ${planPath}`);
}

// Main
const items = readIndex();
const dups = groupDuplicates(items);

const groups = [];
let totalMoves = 0;
for(const g of dups){
  const canonical = chooseCanonical(g);
  const moves = planMoves(g, canonical);
  if(moves.length === 0) continue;
  totalMoves += moves.length;
  groups.push({ title: g.items[0].title, count: g.items.length, canonical, moves });
}

const out = { generatedAt: new Date().toISOString(), canonDir, duplicates: dups.length, plannedMoves: totalMoves, groups };

if (APPLY && totalMoves > 0){
  const flatMoves = groups.flatMap(g=>g.moves);
  const summary = applyMoves(flatMoves);
  out.applied = true;
  out.applySummary = summary;
}

writePlan(out);
console.log(`[Consolidate] duplicates=${dups.length} plannedMoves=${totalMoves} apply=${APPLY?'yes':'no'}`);

