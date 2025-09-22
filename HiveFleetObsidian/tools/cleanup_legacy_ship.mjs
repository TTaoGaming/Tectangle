#!/usr/bin/env node
/**
 * Cleanup legacy ship/ files using drift report; requires --confirm to delete.
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HFO = path.join(ROOT, 'HiveFleetObsidian');
const REPORT_DIR = path.join(HFO, 'reports', 'drift');

function parseArgs(){
  const args = process.argv.slice(2);
  return { confirm: args.includes('--confirm') };
}

async function latestReport(){
  try{
    const files = await fs.readdir(REPORT_DIR);
    const picks = files.filter(f => f.startsWith('hfo_drift_') && f.endsWith('.json'))
      .map(f => ({ f, ts: Number(f.replace(/\D/g, '')) }))
      .sort((a,b) => b.ts - a.ts);
    if(!picks.length) return null;
    const p = path.join(REPORT_DIR, picks[0].f);
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch { return null; }
}

async function removeFiles(relPaths){
  const removed = [];
  for(const rel of relPaths){
    const full = path.join(ROOT, rel.replace(/\//g, path.sep));
    try{ await fs.unlink(full); removed.push(rel); }catch{ /* ignore */ }
  }
  return removed;
}

async function main(){
  const { confirm } = parseArgs();
  const rep = await latestReport();
  if(!rep || !rep.deprecatedFiles || rep.deprecatedFiles.length === 0){
    console.log('No legacy ship/ files found.');
    return;
  }
  console.log('Legacy files found under ship/:');
  rep.deprecatedFiles.forEach(f => console.log(' - ' + f));
  if(!confirm){
    console.log('\nDry run. Pass --confirm to delete these files.');
    return;
  }
  const removed = await removeFiles(rep.deprecatedFiles);
  console.log(`\nRemoved ${removed.length} files.`);
}

main().catch(err => { console.error(err); process.exit(1); });
