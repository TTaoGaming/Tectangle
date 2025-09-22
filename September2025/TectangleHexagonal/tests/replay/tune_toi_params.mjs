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
import path from 'path';
import child_process from 'child_process';

if(process.argv.length < 3){
  console.error('Usage: node tests/replay/tune_toi_params.mjs <landmarks.jsonl>');
  process.exit(2);
}

const inPath = process.argv[2];
const ENTERS = [0.40,0.45,0.50];
const EXITS  = [0.60,0.70,0.80];
const MINC   = [1.4, 2.2];
const BETAS  = [0.02, 0.04];
const DC     = [1.0, 1.2];
const CONES  = [25,30];

function run(cmd){ try{ return child_process.execSync(cmd, { stdio:['ignore','pipe','pipe'] }).toString('utf8'); }catch(e){ return e.stdout?.toString('utf8') || ''; } }

let best=null;
for(const enter of ENTERS){ for(const exit of EXITS){ if(exit<=enter) continue; for(const minCutoff of MINC){ for(const beta of BETAS){ for(const dCutoff of DC){ for(const cone of CONES){
  const out = path.resolve('September2025/TectangleHexagonal/out/analysis.tune.tmp.jsonl');
  run(`node "September2025/TectangleHexagonal/tests/replay/compute_toi_offline.mjs" "${inPath}" --enter ${enter} --exit ${exit} --cone ${cone} --gate true --minCutoff ${minCutoff} --beta ${beta} --dCutoff ${dCutoff} --out "${out}"`);
  const res = run(`node "September2025/TectangleHexagonal/tests/replay/validate_toi_pred_actual.mjs" "${out}"`);
  let obj=null; try{ obj=JSON.parse(res.slice(res.indexOf('{'))); }catch{}
  if(!obj) continue;
  const score = (obj.downs===1 && obj.ups===1 ? 1000 : 0) + (30 - Math.min(30, Math.abs(obj.meanToiErr||0))) + (30 - Math.min(30, obj.maxAbsToiErr||30));
  const cand = { enter, exit, cone, minCutoff, beta, dCutoff, downs:obj.downs, ups:obj.ups, meanToiErr:obj.meanToiErr, maxAbsToiErr:obj.maxAbsToiErr, score };
  if(!best || cand.score>best.score) best=cand;
}}}}}}

console.log(JSON.stringify({ best }, null, 2));
