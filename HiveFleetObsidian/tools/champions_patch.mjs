#!/usr/bin/env node
/**
 * Champions patcher: generate monthly variants from feedback; optional --apply to merge.
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HFO = path.join(ROOT, 'HiveFleetObsidian');
const MANI = path.join(HFO, 'manifests');

function parseArgs(){
  const args = process.argv.slice(2);
  return {
    apply: args.includes('--apply'),
    month: args.find(a => a.startsWith('--month='))?.split('=')[1] // YYYY-MM
  };
}

async function readJson(p, fallback){
  try{ const raw = await fs.readFile(p, 'utf8'); return JSON.parse(raw); } catch { return fallback; }
}

function ym(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function mutateChampion(ch){
  const id2 = `${ch.id}_v${Math.floor(Math.random()*1000)}`;
  const kw = Array.from(new Set([...(ch.keywords||[]), 'variant', 'explore']));
  const notes = (ch.notes||'') + ' | auto-variant';
  return {
    ...ch,
    id: id2,
    displayName: (ch.displayName||ch.id) + ' Variant',
    origin: 'algorithm',
    keywords: kw,
    notes
  };
}

function proposeVariants(state){
  const base = state.champions || [];
  const evidence = state.evidence || [];
  // Simple heuristic: for champions with low evidence count, add one exploration variant.
  const counts = Object.create(null);
  for(const e of evidence){ counts[e.championId] = (counts[e.championId]||0)+1; }
  const variants = [];
  for(const ch of base){
    const c = counts[ch.id]||0;
    if(c < 3) variants.push(mutateChampion(ch));
  }
  return variants;
}

async function writePatchFile(patch){
  const dir = path.join(MANI, 'champions_patches');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `patch_${patch.version}.json`);
  await fs.writeFile(file, JSON.stringify(patch, null, 2), 'utf8');
  return file;
}

async function applyPatch(state, patch){
  const ids = new Set((state.champions||[]).map(c => c.id));
  for(const v of patch.add){ if(!ids.has(v.id)) state.champions.push(v); }
  return state;
}

async function main(){
  const args = parseArgs();
  const ver = args.month || ym();
  const champions = await readJson(path.join(MANI, 'champions.json'), { champions: [], ratings:{}, evidence:[], timeHorizons:{} });
  const add = proposeVariants(champions);
  const patch = { version: ver, ts: new Date().toISOString(), add };
  const patchFile = await writePatchFile(patch);
  console.log(`Wrote ${patchFile} (variants: ${add.length})`);
  if(args.apply){
    const updated = await applyPatch(champions, patch);
    await fs.writeFile(path.join(MANI, 'champions.json'), JSON.stringify(updated, null, 2), 'utf8');
    console.log('Applied patch to manifests/champions.json');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
