// WEBWAY:ww-2025-095: Validate that the JSONL from v3 guard contains Open_Palm entries for both hands
// Usage: node validate_open_palm_jsonl.mjs <jsonlPath>
import fs from 'node:fs/promises';

const path = process.argv[2] || process.env.JSONL;
if(!path){ console.error('[validate] Missing JSONL path'); process.exit(2); }

const raw = await fs.readFile(path, 'utf8').catch(()=>null);
if(!raw){ console.error('[validate] Cannot read JSONL:', path); process.exit(2); }

let left=0, right=0, any=0; let lines=0;
for(const line of raw.split(/\r?\n/)){
  const s = line.trim(); if(!s) continue; lines++;
  try{
    const obj = JSON.parse(s);
    const per = Array.isArray(obj.per) ? obj.per : [];
    for(const p of per){
      if(!p || p.label !== 'Open_Palm') continue;
      any++;
      if(p.handed === 'Left') left++;
      if(p.handed === 'Right') right++;
    }
  }catch{}
}

const pass = (left>0 && right>0 && any>0);
const out = { path, lines, hits: { any, left, right }, pass };
console.log(JSON.stringify(out, null, 2));
if(!pass) process.exit(1);
