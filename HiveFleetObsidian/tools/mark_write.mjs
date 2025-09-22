// Write a mark JSON under HiveFleetObsidian/marks/active with schema validation-lite
// Usage: node HiveFleetObsidian/tools/mark_write.mjs --type probe_result --topic "..." --signal "..." [--decay 120] [--meta '{"k":"v"}']

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def=''){ const i=process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const type = arg('type','');
const topic = arg('topic','');
const signal = arg('signal','');
const decay = Number(arg('decay','120'));
let meta={};
try{ const m=arg('meta',''); if(m) meta=JSON.parse(m); }catch{}

if(!type || !topic || !signal){
  console.error('Missing required args: --type, --topic, --signal');
  process.exit(2);
}

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const dir = path.join(base,'marks','active');
fs.mkdirSync(dir,{ recursive:true });

const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const rec = { id, ts: new Date().toISOString(), type, topic, signal, decay_after_minutes: decay, meta };
const file = path.join(dir, `${rec.ts.replace(/[:]/g,'-')}_${type}.json`);
fs.writeFileSync(file, JSON.stringify(rec,null,2));
console.log(JSON.stringify({ ok:true, file }, null, 2));
