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
  console.error('Usage: node tests/replay/validate_analysis_envelopes.mjs <analysis.jsonl>');
  process.exit(2);
}

const path = process.argv[2];
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean);

let downs=0, ups=0, cancels=0, frames=0;
const toiErrors=[];
let lastDownPred=null, lastDownT=null;
let lastPredAbs=null;

for(const ln of lines){
  let obj; try{ obj=JSON.parse(ln); }catch{ continue; }
  if(obj.meta){ continue; }
  if(obj.kind==='frame'){ frames++; /* compute per-frame if needed */ }
  if(obj.kind==='event'){
    if(obj.type==='down'){
      downs++;
      // Prefer absolute prediction
      lastPredAbs = (typeof obj.toiPredAbsV==='number' && isFinite(obj.toiPredAbsV)) ? obj.toiPredAbsV : null;
      lastDownPred = (typeof obj.toiPredV==='number' && isFinite(obj.toiPredV)) ? obj.toiPredV : null;
      lastDownT = obj.t;
    }
    else if(obj.type==='confirm'){
      // Confirm may carry actual absolute enter time
      if(lastPredAbs!=null && typeof obj.toiActualEnterAbs==='number'){
        toiErrors.push(obj.toiActualEnterAbs - lastPredAbs);
        lastPredAbs = null;
      }
    }
    else if(obj.type==='up'){
      ups++;
      const actual = (typeof obj.toiActual==='number') ? obj.toiActual : (lastDownT!=null ? (obj.t - lastDownT) : null);
      if(actual!=null && lastDownPred!=null){ toiErrors.push(actual - lastDownPred); }
      lastDownPred = null; lastDownT = null; lastPredAbs = null;
    }
    else if(obj.type==='cancel'){ cancels++; lastPredAbs = null; }
  }
}

const specCancelRate = downs ? (cancels/downs) : 0;
const meanToiErr = toiErrors.length ? (toiErrors.reduce((a,b)=>a+b,0)/toiErrors.length) : 0;
const maxAbsToiErr = toiErrors.length ? Math.max(...toiErrors.map(e=>Math.abs(e))) : 0;

const result = { downs, ups, cancels, frames, specCancelRate, meanToiErr: Math.round(meanToiErr), maxAbsToiErr: Math.round(maxAbsToiErr) };
console.log(JSON.stringify(result));

// Envelopes (tweak as needed)
let ok = true;
if(specCancelRate > 0.25){ console.error('SpecCancelRate too high:', specCancelRate); ok=false; }
if(maxAbsToiErr > 20){ console.error('TOI error too high:', maxAbsToiErr, 'ms'); ok=false; }
if(downs !== ups){ console.error('Down/Up mismatch:', downs, ups); ok=false; }

process.exit(ok? 0 : 1);
