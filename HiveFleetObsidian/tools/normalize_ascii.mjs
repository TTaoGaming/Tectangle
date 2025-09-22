// Normalize ASCII in .md and .txt files under HiveFleetObsidian
// Replaces curly quotes/dashes/ellipsis/non-breaking space and removes U+FFFD
// Usage: node HiveFleetObsidian/tools/normalize_ascii.mjs [--apply]

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const root = 'HiveFleetObsidian';

function listFiles(dir){
  const out=[]; const stack=[dir];
  while(stack.length){
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur,{withFileTypes:true})){
      const p = path.join(cur, e.name);
      if (e.isDirectory()) { if (e.name.startsWith('.')) continue; stack.push(p); }
      else if (e.isFile()){
        const ext = path.extname(e.name).toLowerCase();
        if (ext === '.md' || ext === '.txt') out.push(p);
      }
    }
  }
  return out;
}

function normalize(txt){
  return txt
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/\uFFFD/g, '')
    .replace(/\r\n/g, '\n');
}

const files = listFiles(root);
let changed=0;
for (const f of files){
  try{
    const txt = fs.readFileSync(f,'utf8');
    const norm = normalize(txt);
    if (norm !== txt){
      changed++;
      if (APPLY) fs.writeFileSync(f, norm, 'utf8');
      console.log(`[${APPLY?'FIX':'DRY'}] ${f}`);
    }
  }catch{}
}
console.log(`[NormalizeASCII] files=${files.length} changed=${changed} apply=${APPLY?'yes':'no'}`);

