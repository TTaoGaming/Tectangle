/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

import fs from 'fs';

if(process.argv.length < 3){
  console.error('Usage: node tests/replay/validate_toi_pred_actual.mjs <analysis.jsonl>');
  process.exit(2);
}

const path = process.argv[2];
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean);

let downs=0, ups=0; const errs=[]; let ok=true; let predAbs=null; let haveActual=false;
for(const ln of lines){ let o; try{ o=JSON.parse(ln); }catch{ continue; }
  if(o.kind==='event' && o.type==='down'){ downs++; predAbs = (typeof o.toiPredAbsV==='number') ? o.toiPredAbsV : null; haveActual = (typeof o.toiActualEnterAbs==='number'); if(predAbs!=null && haveActual){ errs.push(o.toiActualEnterAbs - predAbs); predAbs=null; }
  } else if(o.kind==='event' && o.type==='confirm'){ if(predAbs!=null && typeof o.toiActualEnterAbs==='number'){ errs.push(o.toiActualEnterAbs - predAbs); predAbs=null; }
  } else if(o.kind==='event' && o.type==='up'){ ups++; }
}

const mean = errs.length? errs.reduce((a,b)=>a+b,0)/errs.length : 0;
const maxAbs = errs.length? Math.max(...errs.map(x=>Math.abs(x))) : 0;
console.log(JSON.stringify({ downs, ups, errs: errs.length, meanToiErr: Math.round(mean), maxAbsToiErr: Math.round(maxAbs) }));

if(downs!==ups){ console.error('Down/up mismatch'); ok=false; }
if(maxAbs>30){ console.error('TOI absolute error too high'); ok=false; }
process.exit(ok?0:1);
