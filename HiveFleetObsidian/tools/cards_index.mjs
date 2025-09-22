// Build a simple index of champion cards for quick linking in docs/UI
// Usage: node HiveFleetObsidian/tools/cards_index.mjs

import fs from 'node:fs';
import path from 'node:path';
import { champions } from './champion_registry.mjs';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

function parseFrontMatter(txt){
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)){
    const mm = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (mm) out[mm[1].trim()] = mm[2].replace(/^"|"$/g,'').trim();
  }
  return out;
}

function flavorLine(txt){
  const sec = txt.split(/\n+Flavor\n/)[1];
  if (!sec) return '';
  const first = sec.trim().split(/\r?\n/)[0] || '';
  return first.replace(/^\"|\"$/g,'').trim();
}

const all = [];
for (const c of champions){
  const dir = path.join(base, 'honeycomb', 'champions', c.pascal, 'cards');
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(n=>/\.md$/i.test(n));
  const items = [];
  for (const f of files){
    try{
      const p = path.join(dir, f);
      const txt = fs.readFileSync(p,'utf8');
      const meta = parseFrontMatter(txt);
      const flav = flavorLine(txt);
      items.push({ file: p.replace(/\\/g,'/'), id: meta.id||'', name: meta.name||f, cost: meta.cost||'', type: meta.type_line||'', flavor: flav });
    }catch{}
  }
  if (items.length){
    const outDir = path.join(dir);
    fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), cards: items }, null, 2));
    all.push({ champion: c.pascal, cards: items.map(i=>({ id:i.id, name:i.name, file:i.file })) });
  }
}

const outRoot = path.join(base, 'honeycomb', 'cards');
fs.mkdirSync(outRoot, { recursive: true });
fs.writeFileSync(path.join(outRoot, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), champions: all }, null, 2));
console.log('[Cards] Indexed', all.length, 'champion(s) with cards');

