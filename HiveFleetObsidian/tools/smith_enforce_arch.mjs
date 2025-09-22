// Enforce Honeycomb architecture shape (report missing dirs/files)
// Usage: node HiveFleetObsidian/tools/smith_enforce_arch.mjs [--apply]

import fs from 'node:fs';
import path from 'node:path';
import { champions } from './champion_registry.mjs';

const APPLY = process.argv.includes('--apply');
const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const root = path.join(base, 'honeycomb', 'champions');

function ensureDir(p){ if (APPLY) fs.mkdirSync(p, { recursive:true }); }
function ensureFile(p, content=''){
  if (!APPLY) return;
  if (!fs.existsSync(p)) fs.writeFileSync(p, content, 'utf8');
}

const reqDirs = ['core','ports','adapters','docs','tests'];

let problems = 0; const lines=[];
for (const c of champions){
  const basePath = path.join(root, c.pascal);
  if (!fs.existsSync(basePath)) { problems++; lines.push(`[MISS] ${c.pascal}: space missing`); continue; }
  // required dirs
  for (const d of reqDirs){
    const p = path.join(basePath, d);
    if (!fs.existsSync(p)) { problems++; lines.push(`[MISS] ${c.pascal}: dir ${d}`); ensureDir(p); }
  }
  // docs
  const docs = path.join(basePath,'docs');
  for (const f of ['persona.md','canon.md']){
    const p = path.join(docs, f);
    if (!fs.existsSync(p)) { problems++; lines.push(`[MISS] ${c.pascal}: docs/${f}`); ensureFile(p, `# ${c.name} — ${f.replace('.md','')}\n`); }
  }
  // ports: if champion_registry lists ports, ensure folder readme exists and .port.mjs for names (optional)
  const portsDir = path.join(basePath,'ports');
  if (!fs.existsSync(path.join(portsDir,'README.md'))) ensureFile(path.join(portsDir,'README.md'), `# Ports for ${c.name}\n`);
}

const outDir = path.join(base,'reports','smith');
fs.mkdirSync(outDir, { recursive:true });
const json = { generatedAt: new Date().toISOString(), apply: APPLY, problems, lines };
fs.writeFileSync(path.join(outDir, 'enforce_arch.json'), JSON.stringify(json, null, 2));
for (const ln of lines) console.log(ln);
if (problems>0 && !APPLY) process.exitCode = 1;

