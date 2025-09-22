// Silk Scribe Review: roll up history into daily/weekly/monthly summaries
// Usage: node HiveFleetObsidian/tools/scribe_review.mjs [--span day|week|month] [--since-days N]
// Optional LLM (HFO_LLM_PROVIDER + keys) to generate narrative patterns.

import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const historyPath = path.join(base, 'history', 'hive_history.jsonl');

function arg(name, def=''){
  const i = process.argv.indexOf(`--${name}`);
  return i>-1 ? (process.argv[i+1]||def) : def;
}

const span = (arg('span','day')||'day').toLowerCase();
const sinceDays = Number(arg('since-days', span==='day'?2: span==='week'?14: 62));

function loadHistory(){
  const out=[]; if(!fs.existsSync(historyPath)) return out;
  for (const line of fs.readFileSync(historyPath,'utf8').split(/\r?\n/)){
    const s=line.trim(); if(!s) continue; try{ out.push(JSON.parse(s)); }catch{}
  }
  return out;
}

function within(d, days){ return (Date.now()-d.getTime()) <= days*24*3600*1000; }

function summarize(recs){
  const counts = {};
  for (const r of recs){ const snap=(r.snapshot||'').split(/[|:]/)[0].trim(); counts[snap]=(counts[snap]||0)+1; }
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const lessons = recs.map(r=>r.lesson).filter(Boolean).slice(-8);
  const metrics = recs.map(r=>r.metric_delta).filter(Boolean).slice(-8);
  return { top, lessons, metrics };
}

async function maybeLLMNarrative(recs){
  try{
    const provider = process.env.HFO_LLM_PROVIDER||''; if(!provider) return '';
    const { generate } = await import('./llm/llm_port.mjs');
    const sample = recs.slice(-40).map(r=>`- ${r.snapshot} | ${r.metric_delta} | ${r.lesson}`).join('\n');
    const sys = 'You are a concise engineering reviewer. Return 5 short bullets: What worked, What broke, Regressions/patterns, Risks, Next focus.';
    const user = `Recent history (latest first):\n${sample}`;
    const res = await generate({ provider, messages:[{role:'system',content:sys},{role:'user',content:user}], maxTokens: 256 });
    return res.text || '';
  }catch{ return ''; }
}

async function main(){
  const all = loadHistory();
  const filtered = all.filter(()=>true); // history lines may lack timestamps; keep recent N days by file mtime instead
  // Fallback: bound by sinceDays using file mtime
  const outDir = path.join(base, 'reports','reviews', span);
  fs.mkdirSync(outDir, { recursive:true });
  const ts = new Date().toISOString().replace(/[:]/g,'-');
  const mdPath = path.join(outDir, `review_${ts}.md`);
  const { top, lessons, metrics } = summarize(all.slice(-Math.max(10, sinceDays)));
  const lines = [];
  lines.push(`# Review (${span}) — ${new Date().toISOString()}`);
  lines.push('');
  lines.push('Top snapshots:');
  for (const [k,v] of top) lines.push(`- ${k} — ${v}`);
  if (metrics.length){ lines.push(''); lines.push('Recent metrics:'); for (const m of metrics) lines.push(`- ${m}`); }
  if (lessons.length){ lines.push(''); lines.push('Recent lessons:'); for (const l of lessons) lines.push(`- ${l}`); }
  const narrative = await maybeLLMNarrative(all);
  if (narrative){ lines.push(''); lines.push('Narrative:'); lines.push(narrative.trim()); }
  fs.writeFileSync(mdPath, lines.join('\n')+'\n', 'utf8');
  console.log('[Scribe] Review ->', mdPath);
}

await main();

