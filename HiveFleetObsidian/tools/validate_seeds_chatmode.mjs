#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const SEEDS_DIR = path.resolve('HiveFleetObsidian/Seeds');
const REQUIRED_CHAT_MODE_KEYS = ['purpose','use_when','inputs_required','answer_style'];

let failures = 0;
const notes = [];

function loadYaml(p){
  const raw = fs.readFileSync(p,'utf8');
  return yaml.parse(raw);
}

function listSeedFiles(){
  return fs.readdirSync(SEEDS_DIR).filter(f=>f.endsWith('.seed.yaml'));
}

function checkEnums(seed, file){
  if(seed.metadata?.id === 'faultline_seeker'){
    const levels = seed.chat_mode?.enums?.heat_levels;
    if(!levels || levels.join(',') !== 'Cold,Ember,Warm,Hot,Blazing'){
      fail(file,'faultline_seeker heat_levels must be Cold..Blazing exact order');
    }
  }
}

function fail(file,msg){
  failures++;
  notes.push(`FAIL ${file}: ${msg}`);
}
function warn(file,msg){
  notes.push(`WARN ${file}: ${msg}`);
}

function checkChatMode(seed, file){
  if(!seed.chat_mode){
    fail(file,'missing chat_mode section');
    return;
  }
  for(const k of REQUIRED_CHAT_MODE_KEYS){
    if(!(k in seed.chat_mode)) fail(file,`chat_mode missing key ${k}`);
  }
  // basic length checks
  if(Array.isArray(seed.chat_mode.use_when) && seed.chat_mode.use_when.length>4){
    warn(file,'use_when >4 may be verbose');
  }
  if(seed.chat_mode.inputs_required && seed.chat_mode.inputs_required.length>5){
    warn(file,'inputs_required >5 may be too many');
  }
  // self_check presence
  if(!seed.chat_mode.self_check){
    warn(file,'no self_check list');
  }
  checkEnums(seed,file);
}

function checkCenterGravityIO(seed,file){
  const cg = seed.center_of_gravity;
  if(!cg) return;
  const inputs = new Set((seed.io?.inputs?.fields||[]).map(f=>f.name));
  const outputs = new Set((seed.io?.outputs?.fields||[]).map(f=>f.name));
  for(const i of (cg.inputs||[])) if(!inputs.has(i)) fail(file,`center_of_gravity.inputs includes '${i}' not in io.inputs.fields`);
  for(const o of (cg.outputs||[])) if(!outputs.has(o)) fail(file,`center_of_gravity.outputs includes '${o}' not in io.outputs.fields`);
}

function checkProcedureAlgorithms(seed,file){
  const algos = new Set(seed.center_of_gravity?.algorithms || []);
  // also collect from lineage research
  (seed.lineage?.research||[]).forEach(a=>algos.add(a));
  (seed.procedure?.steps||[]).forEach(step=>{
    if(!step.algorithms || step.algorithms.length===0){
      // allow explicitly empty only for benign cleanup
      fail(file,`procedure step '${step.name}' missing algorithms`);
    } else {
      for(const a of step.algorithms){
        if(!algos.has(a)) warn(file,`algorithm token '${a}' in step '${step.name}' not in center_of_gravity.algorithms or lineage.research`);
      }
    }
  });
}

function validate(){
  const files = listSeedFiles();
  files.forEach(f=>{
    const full = path.join(SEEDS_DIR,f);
    let seed;
    try { seed = loadYaml(full); } catch(e){ fail(f,'YAML parse error '+e.message); return; }
    checkChatMode(seed,f);
    checkCenterGravityIO(seed,f);
    checkProcedureAlgorithms(seed,f);
  });
  if(failures){
    console.error('Seed chat_mode validation FAILED');
    notes.forEach(n=>console.error(n));
    process.exit(1);
  } else {
    console.log('Seed chat_mode validation OK');
    notes.forEach(n=>console.log(n));
  }
}

validate();
