// Enforce PascalCase champion directories and migrate legacy snake_case
// Usage: node HiveFleetObsidian/tools/enforce_naming.mjs [--force]

import fs from 'node:fs';
import path from 'node:path';
import { champions as registry } from './champion_registry.mjs';

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const champRoot = path.join(baseNest, 'honeycomb', 'champions');
const force = process.argv.includes('--force');

function moveDir(src, dst){
  if (!fs.existsSync(src)) return 'skip';
  if (fs.existsSync(dst)) return 'conflict';
  fs.renameSync(src, dst);
  return 'moved';
}

if (!fs.existsSync(champRoot)) {
  console.log('[Enforce] No champions directory found; nothing to do.');
  process.exit(0);
}

let moved = 0, conflicts = 0;
for (const c of registry){
  const oldDir = path.join(champRoot, c.id);
  const newDir = path.join(champRoot, c.pascal);
  if (fs.existsSync(oldDir) && !fs.existsSync(newDir)){
    if (force) {
      const r = moveDir(oldDir, newDir);
      if (r === 'moved') { console.log(`[Enforce] ${c.id} -> ${c.pascal}`); moved++; }
      else if (r === 'conflict') { console.log(`[Enforce] CONFLICT: ${newDir} exists; leaving ${oldDir}`); conflicts++; }
    } else {
      console.log(`[Enforce] DRY-RUN: would rename ${oldDir} -> ${newDir}`);
    }
  }
}

console.log(`[Enforce] Done. moved=${moved} conflicts=${conflicts} (run with --force to apply).`);

