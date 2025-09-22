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

// Reads a golden JSONL (pinch.jsonl) and checks README claims:
// - events present (down then up)
// - states transition through PrePinch/Pinched/ReleasePending
// - gate true during active pinch phases most of the time

const file = process.argv[2];
if(!file){
  console.error('Usage: node tests/replay/assert_docs_vs_outputs.mjs <pinch.jsonl>');
  process.exit(2);
}

const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
let seenDown=false, seenUp=false, orderOk=true;
let pre=0, pinched=0, rel=0, gateActiveDuringPinch=0, pinchFrames=0;
let frames=0;
let firstDownIndex=-1, firstUpIndex=-1;

for(let i=0;i<lines.length;i++){
  let obj; try{ obj=JSON.parse(lines[i]); }catch{ continue; }
  if(obj.meta) continue;
  frames++;
  if(obj.event){
    if(obj.event.type==='down'){
      if(seenUp) orderOk=false;
      seenDown=true; if(firstDownIndex<0) firstDownIndex=i;
    }
    if(obj.event.type==='up'){
      seenUp=true; if(firstUpIndex<0) firstUpIndex=i;
    }
  }
  if(['PrePinch','Pinched','ReleasePending'].includes(obj.state)){
    pinchFrames++;
    if(obj.gate) gateActiveDuringPinch++;
  }
  if(obj.state==='PrePinch') pre++;
  if(obj.state==='Pinched') pinched++;
  if(obj.state==='ReleasePending') rel++;
}

const gateRate = pinchFrames? gateActiveDuringPinch/pinchFrames : 0;
const summary = { frames, seenDown, seenUp, orderOk, states: { PrePinch: pre, Pinched: pinched, ReleasePending: rel }, gateRate: Number(gateRate.toFixed(2)) };
console.log(JSON.stringify(summary));

let ok=true;
if(!(seenDown && seenUp && orderOk)) { console.error('Docs mismatch: expected down→up sequence present'); ok=false; }
if(pinched===0){ console.error('Docs mismatch: expected Pinched states during pinch clip'); ok=false; }
if(gateRate < 0.8){ console.error('Docs mismatch: gate not active enough during pinch phases', gateRate); ok=false; }
process.exit(ok?0:1);
