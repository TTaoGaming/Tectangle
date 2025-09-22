#!/usr/bin/env node
/**
 * Report deprecated 'ship/' folder usage and stale files
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HFO = path.join(ROOT, 'HiveFleetObsidian');

async function exists(p){ try { await fs.access(p); return true; } catch { return false; } }

async function listFiles(dir){
  const out = [];
  const stack = [dir];
  while(stack.length){
    const d = stack.pop();
    let entries = [];
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch { continue; }
    for(const e of entries){
      const full = path.join(d, e.name);
      if(e.isDirectory()) stack.push(full); else out.push(full);
    }
  }
  return out;
}

async function main(){
  const shipDir = path.join(HFO, 'ship');
  const report = { when: new Date().toISOString(), deprecatedFiles: [] };
  if(await exists(shipDir)){
    report.deprecatedFiles = (await listFiles(shipDir)).map(p => p.replace(ROOT+path.sep, ''));
  }
  const out = path.join(HFO, 'reports', 'drift', `hfo_drift_${Date.now()}.json`);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(report, null, 2), 'utf8');
  console.log(report.deprecatedFiles.length ? `Deprecated files under ship/: ${report.deprecatedFiles.length}` : 'No deprecated ship/ files');
}

main().catch(err => { console.error(err); process.exit(1); });
