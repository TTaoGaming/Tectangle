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

const args = process.argv.slice(2);
if(args.length < 1){
  console.error('Usage: node tests/replay/validate_golden_frames.mjs <golden.jsonl> [--kind pinch|gated]');
  process.exit(2);
}
const file = args[0];
const kindArg = args.includes('--kind') ? args[args.indexOf('--kind')+1] : 'pinch';

const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
let downs=0, ups=0, pre=0, pinched=0, releasePending=0, idle=0, frames=0;
for(const ln of lines){
  let obj; try{ obj = JSON.parse(ln); } catch { continue; }
  if(obj.meta) continue;
  frames++;
  if(obj.state==='PrePinch') pre++;
  if(obj.state==='Pinched') pinched++;
  if(obj.state==='ReleasePending') releasePending++;
  if(obj.state==='Idle') idle++;
  if(obj.event && obj.event.type==='down') downs++;
  if(obj.event && obj.event.type==='up') ups++;
}

const summary = { file, kind: kindArg, frames, downs, ups, states: { Idle: idle, PrePinch: pre, Pinched: pinched, ReleasePending: releasePending } };
console.log(JSON.stringify(summary));

let ok=true;
if(kindArg==='pinch'){
  if(!(downs>=1 && ups>=1)) { console.error('pinch: expected downs>=1 and ups>=1 but got', downs, ups); ok=false; }
  if(downs && ups && downs>ups){ console.error('pinch: more downs than ups', downs, ups); ok=false; }
}
if(kindArg==='gated'){
  if(downs!==0 || ups!==0){ console.error('gated: expected 0 downs/ups but got', downs, ups); ok=false; }
  if(pinched>0 || pre>0){ console.error('gated: expected no pinch states but got', {PrePinch: pre, Pinched: pinched}); ok=false; }
}
process.exit(ok?0:1);
