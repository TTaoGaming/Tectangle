// Board Freshness checker & auto-warn
// Usage: node HiveFleetObsidian/tools/board_freshness.mjs [--max-age-min 90]
// Emits JSON with {ageMinutes, stale:boolean, missing:[fields], path}

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def=''){ const i=process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||'') : def; }
const maxAgeMin = Number(arg('max-age-min','90'));

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const boardPath = path.join(base, 'BOARD.current.txt');
const metaPath = path.join(base, 'history', 'BOARD.meta.json');

function readBoard(){
  if(!fs.existsSync(boardPath)) return { raw:'', fields:{}, mtime:0, lastUpdated:0 };
  const raw = fs.readFileSync(boardPath,'utf8');
  const stat = fs.statSync(boardPath);
  const fields = {};
  let lastUpdated=0;
  for(const line of raw.split(/\r?\n/)){
    const m=line.match(/^(Problem|Metric|Tripwire|Revert|Champion|Plan|Status):\s*(.*)$/i);
    if(m) fields[m[1].toLowerCase()] = m[2].trim();
    const t=line.match(/^Last-Updated:\s*(.*)$/i);
    if(t){ const d=Date.parse(t[1].trim()); if(!isNaN(d)) lastUpdated=d; }
  }
  return { raw, fields, mtime: stat.mtimeMs, lastUpdated };
}

const b = readBoard();
const basis = b.lastUpdated || b.mtime;
const ageMinutes = basis ? (Date.now()-basis)/60000 : Infinity;
const required = ['problem','metric'];
const missing = required.filter(f => !(f in b.fields) || !b.fields[f]);
const stale = ageMinutes > maxAgeMin || missing.length>0;

// Persist meta for rollups
fs.mkdirSync(path.dirname(metaPath), { recursive:true });
let meta = { versions: [] };
try { meta = JSON.parse(fs.readFileSync(metaPath,'utf8')); } catch{}
meta.lastCheck = new Date().toISOString();
meta.ageMinutes = ageMinutes;
meta.stale = stale;
meta.missing = missing;
meta.boardPath = boardPath;
fs.writeFileSync(metaPath, JSON.stringify(meta,null,2));

const out = { ageMinutes: Number(ageMinutes.toFixed(2)), stale, missing, path: boardPath, basis: (b.lastUpdated? 'Last-Updated' : (b.mtime? 'mtime' : 'none')) };
console.log(JSON.stringify(out,null,2));

// Exit non-zero if stale to allow CI hooks
if(stale) process.exitCode = 3;
