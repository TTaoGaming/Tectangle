// Response Shape Lint: enforce plain-language chat + counsel JSON presence
// Usage: node HiveFleetObsidian/tools/response_shape_lint.mjs <turn.json>

import fs from 'node:fs';

const file = process.argv[2];
if(!file || !fs.existsSync(file)){
  console.error('Usage: node .../response_shape_lint.mjs <turn.json>');
  process.exit(2);
}
const data = JSON.parse(fs.readFileSync(file,'utf8'));

let ok = true; const errs = [];

// 1) Counsel JSON present with 4 seats and fields
const seats = ['explore','pivot','reorient','exploit'];
if(!data.counsel) { ok=false; errs.push('Missing counsel'); }
else {
  for(const s of seats){
    const v = data.counsel[s];
    if(!v){ ok=false; errs.push(`Missing counsel.${s}`); continue; }
    for(const k of ['what','why','win','warnings','how']){
      if(!(k in v)) { ok=false; errs.push(`Missing counsel.${s}.${k}`); }
    }
  }
}

// 2) Chat transcript present; each line starts with a known speaker
const speakers = ['TTao','Thread Sovereign','Faultline Seeker','Prism Magus','Web Cartographer','Silk Scribe'];
if(!Array.isArray(data.chat) || data.chat.length===0){ ok=false; errs.push('Missing chat[]'); }
else {
  for(const line of data.chat){
    if(!speakers.some(sp=> line.startsWith(sp+':'))){ ok=false; errs.push('Chat line without speaker: '+line); break; }
    // Plain language heuristic: max 160 chars per line
    if(line.length>180) errs.push('Long chat line (>180 chars): '+line.slice(0,60)+'…');
  }
}

// 3) Guardrail + history present
if(!data.guardrail) { ok=false; errs.push('Missing guardrail'); }
if(!data.history || !data.history.snapshot || !data.history.metric_delta) { ok=false; errs.push('Missing history fields'); }

// Output
if(!ok){
  console.log('[Shape] FAIL');
  for(const e of errs) console.log(' -', e);
  process.exit(1);
}
console.log('[Shape] PASS');

