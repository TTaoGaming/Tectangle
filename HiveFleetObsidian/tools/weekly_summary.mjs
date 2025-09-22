// Weekly summary synthesizer
// Usage: node HiveFleetObsidian/tools/weekly_summary.mjs
// Combines week rollup + explore/exploit ratios + archive candidate count into reports/weekly_summary_<date>.md

import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const rollupPath = path.join(base,'history','rollups','rollup_week.json');
const historyPath = path.join(base,'history','hive_history.jsonl');
const analysisDir = path.join(base,'analysis');
const outDir = path.join(base,'reports');

function readJSON(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }
function readLines(){ if(!fs.existsSync(historyPath)) return []; return fs.readFileSync(historyPath,'utf8').split(/\n/).filter(Boolean).map(l=>{ try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }

const roll = readJSON(rollupPath) || { summary:{ totalEvents:0 } };
const lines = readLines().slice(-2000); // last chunk

let explore=0, exploit=0, pivot=0, reorient=0;
for (const r of lines){
  const L=(r.lesson||'').toLowerCase();
  if(/explore|probe|assumption/.test(L)) explore++;
  if(/exploit|reversible step|ship/.test(L)) exploit++;
  if(/pivot|reframe|angle/.test(L)) pivot++;
  if(/reorient|adapter|port/.test(L)) reorient++;
}

function latestInventory(){
  if(!fs.existsSync(analysisDir)) return null;
  const files = fs.readdirSync(analysisDir).filter(f=>/^tool_inventory_.*\.json$/.test(f)).map(f=>path.join(analysisDir,f));
  if(!files.length) return null; files.sort((a,b)=> fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  try { return JSON.parse(fs.readFileSync(files[0],'utf8')); } catch { return null; }
}
const inv = latestInventory();
const archiveCount = inv?.archive_candidates?.length || 0;

const totalMode = explore+exploit+pivot+reorient || 1;
function pct(x){ return ((x/totalMode)*100).toFixed(1); }

fs.mkdirSync(outDir,{ recursive:true });
const ts = new Date().toISOString().slice(0,10);
const outFile = path.join(outDir, `weekly_summary_${ts}.md`);
const md = [
  `# Weekly Summary (${ts})`,
  '',
  `Events (week): ${roll.summary?.totalEvents ?? 0}`,
  '',
  '## Mode Ratios (heuristic)',
  `- Explore: ${explore} (${pct(explore)}%)`,
  `- Exploit: ${exploit} (${pct(exploit)}%)`,
  `- Pivot: ${pivot} (${pct(pivot)}%)`,
  `- Reorient: ${reorient} (${pct(reorient)}%)`,
  '',
  `Archive Candidates: ${archiveCount}`,
  '',
  '## Suggested Focus',
  '- Fill missing Board fields early each day.',
  '- Close largest history gap first; keep max gap < 30m on active days.',
  '- Reduce archive candidates by staged review (keep vs retire).',
];
fs.writeFileSync(outFile, md.join('\n')+'\n','utf8');
console.log(JSON.stringify({ out: outFile }, null, 2));
