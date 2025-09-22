// Portable replay: run deterministic pinch events over a JSONL trace
// Usage: node HiveFleetObsidian/tools/portable_replay_from_trace.mjs HiveFleetObsidian/landmarks/right_hand_normal.landmarks.jsonl

import fs from 'node:fs';
import path from 'node:path';
import { createPinchCore } from './pinch_core_portable.mjs';

function readJsonl(p){
  const lines = fs.readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean);
  const frames=[]; let meta=null;
  for(const ln of lines){ const obj = JSON.parse(ln); if(obj.meta){ meta=obj.meta; continue; } frames.push(obj); }
  return { meta, frames };
}

function run(frames){
  const cfg = {
    enterThresh: process.env.ENTER ? +process.env.ENTER : 0.40,
    exitThresh:  process.env.EXIT ? +process.env.EXIT  : 0.60,
    palmConeDeg: process.env.PALMCONE ? +process.env.PALMCONE : 30,
    debounceMs:  process.env.DEBOUNCE ? +process.env.DEBOUNCE : 40,
  };
  const events=[];
  const core = createPinchCore(cfg);
  core.on(e=> events.push(e));
  for (const f of frames) core.update(f);
  return events;
}

function summarize(evts){
  const downs = evts.filter(e=>e.type==='pinch:down').length;
  const ups   = evts.filter(e=>e.type==='pinch:up').length;
  return { downs, ups };
}

const file = process.argv[2];
if(!file){ console.error('Provide a landmarks JSONL file.'); process.exit(2); }
const { frames } = readJsonl(file);
const events = run(frames);
const sum = summarize(events);
console.log('Events:', sum);

if(process.env.EXPECT_DOWNS){
  const want = +process.env.EXPECT_DOWNS;
  if(sum.downs !== want){ console.error(`FAIL: downs=${sum.downs} expected=${want}`); process.exit(1); }
}
if(process.env.EXPECT_UPS){
  const want = +process.env.EXPECT_UPS;
  if(sum.ups !== want){ console.error(`FAIL: ups=${sum.ups} expected=${want}`); process.exit(1); }
}
console.log('PASS');

