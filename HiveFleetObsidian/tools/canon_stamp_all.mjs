// Stamp Markdown files with an Updated: ISO timestamp comment at top
// Usage: node HiveFleetObsidian/tools/canon_stamp_all.mjs [--root HiveFleetObsidian/honeycomb]

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def=''){ const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const root = arg('root', path.join('HiveFleetObsidian','honeycomb'));

function listMd(dir){
  if (!fs.existsSync(dir)) return [];
  const out=[]; const stack=[dir];
  while(stack.length){
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur, { withFileTypes:true })){
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && p.toLowerCase().endsWith('.md')) out.push(p);
    }
  }
  return out;
}

function stamp(p){
  const iso = new Date().toISOString();
  let txt = fs.readFileSync(p,'utf8');
  const lines = txt.split(/\r?\n/);
  const tag = /^<!--\s*Updated:\s*[^>]+-->\s*$/i;
  if (lines.length>0 && tag.test(lines[0])){
    lines[0] = `<!-- Updated: ${iso} -->`;
    txt = lines.join('\n');
  } else {
    txt = `<!-- Updated: ${iso} -->\n` + txt;
  }
  fs.writeFileSync(p, txt, 'utf8');
}

const files = listMd(root);
let count=0;
for (const f of files){
  try { stamp(f); count++; } catch {}
}
console.log(`[Canon] Stamped ${count} Markdown file(s) under ${root}`);

