// Adapter: fs_env — load Board, health, and doctrine from the nest
import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

export function readBoard(){
  const p = path.join(base, 'BOARD.current.txt');
  const fields = { problem:'', metric:'', constraint:'', horizons:'', current:'' };
  if (!fs.existsSync(p)) return fields;
  let raw = fs.readFileSync(p,'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM if present
  for (const line of raw.split(/\r?\n/)){
    const m = line.match(/^(Problem|Metric|Constraint|Horizons|Current):\s*(.*)$/i);
    if (m) fields[m[1].toLowerCase()] = m[2].trim();
  }
  return fields;
}

export function readHealth(){
  // try latest daily report
  try{
    const dir = path.join(base, 'reports', 'daily');
    if (!fs.existsSync(dir)) return {};
    const files = fs.readdirSync(dir).filter(n=>/\.json$/.test(n));
    if (!files.length) return {};
    files.sort((a,b)=> fs.statSync(path.join(dir,b)).mtimeMs - fs.statSync(path.join(dir,a)).mtimeMs);
    const data = JSON.parse(fs.readFileSync(path.join(dir, files[0]), 'utf8'));
    return {
      frozenPass: !!(data.metrics?.frozenPass),
      smokePass: !!(data.metrics?.smokePass),
      dupTitles: +(data.metrics?.dupTitles||0),
      championsMiss: +(data.metrics?.championsMiss||0),
    };
  }catch{ return {}; }
}

export function readDoctrine(){
  const p = path.join(base, 'honeycomb','champions','ThreadSovereign','knowledge','memory.jsonl');
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p,'utf8').split(/\r?\n/).filter(Boolean);
  return lines.map(l=>{ try{return JSON.parse(l);}catch{return null;} }).filter(Boolean);
}
