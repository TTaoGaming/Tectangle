#!/usr/bin/env node
// Unified validation suite: schema (if desired), chat_mode, tones, algorithms, IO alignment
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const SEEDS_DIR = path.resolve('HiveFleetObsidian/Seeds');

const results = { fail:0, warn:0, notes:[] };
function note(t,m){ results.notes.push(`${t} ${m}`); if(t==='FAIL') results.fail++; if(t==='WARN') results.warn++; }
function loadSeeds(){ return fs.readdirSync(SEEDS_DIR).filter(f=>f.endsWith('.seed.yaml')); }

function parse(file){ try { return yaml.parse(fs.readFileSync(path.join(SEEDS_DIR,file),'utf8')); } catch(e){ note('FAIL',`${file}: YAML parse error ${e.message}`); return null; } }

function checkChatMode(seed,file){
  if(!seed.chat_mode){ note('FAIL',`${file}: missing chat_mode`); return; }
  const cm = seed.chat_mode;
  const required = ['purpose','use_when','inputs_required','answer_style','tone'];
  required.forEach(k=>{ if(!(k in cm)) note('FAIL',`${file}: chat_mode missing ${k}`); });
  if(cm.tone){
    const tr = cm.tone;
    ['persona','style','do','avoid','sample_responses'].forEach(k=>{ if(!(k in tr)) note('FAIL',`${file}: tone missing ${k}`); });
    if(tr.style && tr.style.length<2) note('WARN',`${file}: tone style list short`);
    if(tr.sample_responses && tr.sample_responses.length<2) note('WARN',`${file}: need ≥2 sample_responses`);
  }
}

function checkCOG(seed,file){
  const cg = seed.center_of_gravity; if(!cg) return;
  const inputs = new Set((seed.io?.inputs?.fields||[]).map(f=>f.name));
  const outputs = new Set((seed.io?.outputs?.fields||[]).map(f=>f.name));
  (cg.inputs||[]).forEach(i=>{ if(!inputs.has(i)) note('FAIL',`${file}: center_of_gravity input '${i}' not in io.inputs.fields`); });
  (cg.outputs||[]).forEach(o=>{ if(!outputs.has(o)) note('FAIL',`${file}: center_of_gravity output '${o}' not in io.outputs.fields`); });
}

function checkProcedures(seed,file){
  const algos = new Set([...(seed.center_of_gravity?.algorithms||[]), ...(seed.lineage?.research||[])]);
  (seed.procedure?.steps||[]).forEach(s=>{
    if(!Array.isArray(s.algorithms) || s.algorithms.length===0) note('FAIL',`${file}: step '${s.name}' missing algorithms`);
    else s.algorithms.forEach(a=>{ if(!algos.has(a)) note('WARN',`${file}: step '${s.name}' algorithm '${a}' not in kernel or research`); });
  });
}

function run(){
  loadSeeds().forEach(file=>{
    const seed = parse(file); if(!seed) return;
    checkChatMode(seed,file);
    checkCOG(seed,file);
    checkProcedures(seed,file);
  });
  const status = results.fail? 'FAILED':'OK';
  console.log(`Seed suite validation ${status}`);
  results.notes.forEach(n=>console.log(n));
  if(results.fail) process.exit(1);
}
run();
