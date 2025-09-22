// History Rollup generator
// Usage: node HiveFleetObsidian/tools/history_rollup.mjs --span hour|day|week|month|quarter|year [--out dir]
// Reads history/hive_history.jsonl and emits an aggregate summary JSON + md

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def=''){ const i=process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||'') : def; }
const span = arg('span','day');
const outDirArg = arg('out','');

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const historyPath = path.join(base,'history','hive_history.jsonl');
const outDir = outDirArg || path.join(base,'history','rollups');

const now = Date.now();
const spansMs = {
  hour: 60*60*1000,
  day: 24*60*60*1000,
  week: 7*24*60*60*1000,
  month: 30*24*60*60*1000,
  quarter: 90*24*60*60*1000,
  year: 365*24*60*60*1000
};

const rangeMs = spansMs[span] || spansMs.day;

function readLines(){
  if(!fs.existsSync(historyPath)) return [];
  return fs.readFileSync(historyPath,'utf8').split(/\n/).map(l=>l.trim()).filter(Boolean).map(l=>{ try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

const lines = readLines();
const recent = lines.filter(r => r.ts && (now - Date.parse(r.ts)) <= rangeMs);

function groupBySnapshot(arr){
  const map = {};
  for(const r of arr){ const k=r.snapshot||'unknown'; (map[k] ||= []).push(r); }
  return Object.entries(map).map(([k,v])=>({ snapshot:k, count:v.length }));
}

function topLessons(arr, limit=5){
  return arr.map(r=>r.lesson||'').filter(Boolean).slice(-limit);
}

const summary = {
  span,
  totalEvents: recent.length,
  distinctSnapshots: new Set(recent.map(r=>r.snapshot)).size,
  newestTs: recent.reduce((a,r)=> !a || r.ts>a ? r.ts : a, null),
  oldestTs: recent.reduce((a,r)=> !a || r.ts<a ? r.ts : a, null),
  topSnapshots: groupBySnapshot(recent).sort((a,b)=>b.count-a.count).slice(0,5),
  sampleLessons: topLessons(recent,7)
};

fs.mkdirSync(outDir, { recursive:true });
const jsPath = path.join(outDir, `rollup_${span}.json`);
fs.writeFileSync(jsPath, JSON.stringify(summary,null,2));

const mdLines = [
  `# History Rollup (${span})`,
  `Events: ${summary.totalEvents}`,
  `Window: ${summary.oldestTs} → ${summary.newestTs}`,
  '',
  '## Top Snapshots',
  ...summary.topSnapshots.map(t=>`- ${t.snapshot}: ${t.count}`),
  '',
  '## Sample Lessons',
  ...summary.sampleLessons.map(s=>`- ${s}`)
];
const mdPath = path.join(outDir, `rollup_${span}.md`);
fs.writeFileSync(mdPath, mdLines.join('\n')+'\n','utf8');

console.log(JSON.stringify({ json: jsPath, md: mdPath, summary }, null, 2));
