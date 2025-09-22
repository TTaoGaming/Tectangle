#!/usr/bin/env node
// Freeze/Retire — monthly quarantine of stale docs with manifest
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const KNOW = path.join(ROOT, 'docs','knowledge');
const ARCH = path.join(ROOT, 'archive-stale');
const MANIFEST = path.join(ARCH, `freeze_manifest_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);

const STALE_DAYS = 60; // move docs not touched in 60 days and not linked by ADR index

async function mtime(file){ return (await fs.stat(file)).mtime.getTime(); }
async function walk(dir){
  const out=[]; const ents = await fs.readdir(dir,{withFileTypes:true});
  for (const e of ents){
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}

async function main(){
  await fs.mkdir(ARCH, { recursive: true });
  const files = (await walk(KNOW)).filter(f=> f.toLowerCase().endsWith('.md'));
  const cutoff = Date.now() - STALE_DAYS*24*3600*1000;
  // keep files referenced by ADR index
  const adrIndex = await fs.readFile(path.join(ROOT,'docs','adr','INDEX.md'),'utf8').catch(()=> '');
  const keep = new Set();
  (adrIndex.match(/\(\.\.\/knowledge\/[^)]+\)/g) || []).forEach(m=> {
    keep.add(path.resolve(ROOT, m.slice(1,-1)));
  });
  const moves = [];
  for (const f of files){
    if (keep.has(f)) continue;
    const t = await mtime(f);
    if (t < cutoff){
      const rel = path.relative(KNOW, f).replace(/\\/g,'/');
      const destDir = path.join(ARCH,'retired', path.dirname(rel));
      await fs.mkdir(destDir, { recursive: true });
      const dest = path.join(destDir, path.basename(f));
      await fs.copyFile(f, dest);
      moves.push({ from: f, to: dest, mtime: new Date(t).toISOString() });
    }
  }
  await fs.writeFile(MANIFEST, JSON.stringify({ generated: new Date().toISOString(), moves }, null, 2), 'utf8');
  console.log(`Freeze/retire complete. Moves: ${moves.length}. Manifest: ${MANIFEST}`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
