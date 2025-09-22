#!/usr/bin/env node
/**
 * HFO Ship health check: structure drift + key files present
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HFO = path.join(ROOT, 'HiveFleetObsidian');

const REQUIRED = [
  'contracts/VERIFICATION_PORT.md',
  'contracts/ORCHESTRATION_PORT.md',
  'manifests/orchestration.json',
  'manifests/champions.json',
  'manifests/manifest.json',
  'navigation/WORLD_LOCAL_INDEX.md',
  'navigation/GOLD_LOCAL_INDEX.md',
  'manifests/training.json',
  'tools/hfo_ship_index.mjs',
  'tools/hfo_ship_rollup.mjs',
  'tools/hfo_ship_manifest.mjs'
];

async function exists(p){
  try { await fs.access(p); return true; } catch { return false; }
}

async function main(){
  const missing = [];
  for(const rel of REQUIRED){
    const full = path.join(HFO, rel.replace(/\//g, path.sep));
    if(!(await exists(full))) missing.push(rel);
  }
  const report = { when: new Date().toISOString(), missing };
  const out = path.join(HFO, 'ship', 'health_report.json');
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(report, null, 2), 'utf8');
  console.log(missing.length ? `Missing: ${missing.join(', ')}` : 'Ship health OK');
}

main().catch(err => { console.error(err); process.exit(1); });
