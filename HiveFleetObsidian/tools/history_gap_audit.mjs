// History gap auditor
// Usage: node HiveFleetObsidian/tools/history_gap_audit.mjs [--max-gap-min 60]
// Exit code 3 if a gap larger than threshold detected over last 12h window.

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def=''){ const i=process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||'') : def; }
const maxGap = Number(arg('max-gap-min','60'));

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const historyPath = path.join(base,'history','hive_history.jsonl');

let lines=[];
if (fs.existsSync(historyPath)){
  lines = fs.readFileSync(historyPath,'utf8').split(/\n/).filter(Boolean).map(l=>{ try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}
const cutoff = Date.now() - 12*60*60*1000;
const recent = lines.filter(r=> r.ts && Date.parse(r.ts)>=cutoff).sort((a,b)=> Date.parse(a.ts)-Date.parse(b.ts));
let maxFound = 0;
for (let i=1;i<recent.length;i++){
  const gap = (Date.parse(recent[i].ts)-Date.parse(recent[i-1].ts))/60000;
  if (gap>maxFound) maxFound=gap;
}
const stale = maxFound > maxGap || recent.length===0;
const out = { generated: new Date().toISOString(), windowHours:12, entries: recent.length, maxGapMinutes: Number(maxFound.toFixed(2)), threshold: maxGap, gapViolation: stale };
console.log(JSON.stringify(out,null,2));
if(stale) process.exitCode = 3;
