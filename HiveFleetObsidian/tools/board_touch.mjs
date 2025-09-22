// Update/add Last-Updated line on BOARD.current.txt and optionally set Problem/Metric
// Usage: node HiveFleetObsidian/tools/board_touch.mjs [--problem "..."] [--metric "..."]

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def=''){ const i=process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const problem = arg('problem','');
const metric = arg('metric','');

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const p = path.join(base,'BOARD.current.txt');

let lines=[];
if (fs.existsSync(p)) lines = fs.readFileSync(p,'utf8').split(/\r?\n/);

function setOrPush(prefix, value){
  const rx = new RegExp(`^${prefix}:\\s*`, 'i');
  const i = lines.findIndex(l=> rx.test(l));
  const val = `${prefix}: ${value}`;
  if (i>=0) lines[i] = val; else lines.push(val);
}

const now = new Date().toISOString();
setOrPush('Last-Updated', now);
if(problem) setOrPush('Problem', problem);
if(metric) setOrPush('Metric', metric);

fs.writeFileSync(p, lines.join('\n')+'\n','utf8');
console.log(`[board_touch] Updated ${p}`);
