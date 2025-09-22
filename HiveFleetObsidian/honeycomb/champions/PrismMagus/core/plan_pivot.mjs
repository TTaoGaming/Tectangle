// Core: generate 3–5 pivot options in plain language
import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

function readMemory(){
  const p = path.join(base, 'honeycomb','champions','PrismMagus','knowledge','memory.jsonl');
  if(!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean);
  return lines.map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);
}

export function planPivot({ intent='', context='', families=[] }={}){
  const mem = readMemory();
  const fams = families.length ? families : ['method','horizon','constraint','resource','analogy'];
  const picks = [];
  for (const f of fams){
    const m = mem.find(x=>x.family===f) || {};
    let what=''; let why=''; let win=''; let tradeoffs=''; let pathName='';
    if (f==='method'){ pathName='Method swap'; what='Use an adapter, not a rewrite'; why='fast integration keeps momentum'; win='demo works today'; tradeoffs='some debt to tidy later'; }
    if (f==='horizon'){ pathName='Horizon shift'; what='Ship a 1‑hour demo; stage the refactor'; why='evidence now beats perfection'; win='user can pinch→play'; tradeoffs='shortcuts to clean up'; }
    if (f==='constraint'){ pathName='Constraint rewrite'; what='Trim scope; reduce quality settings to unlock motion'; why='remove the blocker quickly'; win='blocked item moves'; tradeoffs='reduced fidelity'; }
    if (f==='resource'){ pathName='Resource pivot'; what='Earn or buy/hire for the hard part'; why='cash cheaper than time today'; win='critical path unblocked'; tradeoffs='spend money'; }
    if (f==='analogy'){ pathName='Analogy mapping'; what='Import a proven pattern from similar domain'; why='lower risk via prior art'; win='pattern fits with minor tweaks'; tradeoffs='fit mismatch risk'; }
    // Use memory text when available
    if (m.principle) what = what || m.principle;
    if (m.analogy) why = why || `Analogy: ${m.analogy}`;
    picks.push({ path: pathName, what, why, win, tradeoffs });
  }
  return { aim: intent || 'keep the aim; change the path', options: picks.slice(0,5) };
}

