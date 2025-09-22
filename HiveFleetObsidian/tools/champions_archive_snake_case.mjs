// Archive duplicate snake_case champion directories when PascalCase exists
// Usage: node HiveFleetObsidian/tools/champions_archive_snake_case.mjs [--apply]

import fs from 'node:fs';
import path from 'node:path';
import { champions } from './champion_registry.mjs';

const APPLY = process.argv.includes('--apply');

const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const champRoot = path.join(baseNest, 'honeycomb', 'champions');
const archiveRoot = path.join(champRoot, '_archive_snake_case');

if (!fs.existsSync(champRoot)) {
  console.log('[ArchiveSnake] No champions directory found.');
  process.exit(0);
}

fs.mkdirSync(archiveRoot, { recursive: true });

function copyDir(src, dst){
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive:true });
  for (const e of fs.readdirSync(src, { withFileTypes:true })){
    const sp = path.join(src, e.name);
    const dp = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(sp, dp);
    else if (e.isFile()) fs.copyFileSync(sp, dp);
  }
}

function rimraf(p){
  if (!fs.existsSync(p)) return;
  for (const e of fs.readdirSync(p, { withFileTypes:true })){
    const ep = path.join(p, e.name);
    if (e.isDirectory()) rimraf(ep);
    else fs.unlinkSync(ep);
  }
  fs.rmdirSync(p);
}

function moveDir(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  try { fs.renameSync(src, dst); return 'renamed'; }
  catch (e) {
    // Fallback to copy + delete
    copyDir(src, dst);
    rimraf(src);
    return 'copied';
  }
}

let planned = [];
for (const c of champions) {
  const snake = path.join(champRoot, c.id);
  const pascal = path.join(champRoot, c.pascal);
  if (fs.existsSync(snake) && fs.existsSync(pascal)) {
    const dst = path.join(archiveRoot, c.id);
    planned.push({ from: snake, to: dst });
  }
}

if (planned.length === 0) {
  console.log('[ArchiveSnake] No snake_case duplicates to archive.');
  process.exit(0);
}

console.log(`[ArchiveSnake] candidates=${planned.length} apply=${APPLY ? 'yes' : 'no'}`);
for (const m of planned) {
  if (APPLY) {
    try {
      const mode = moveDir(m.from, m.to);
      console.log(`[MOVE:${mode}] ${m.from} -> ${m.to}`);
    } catch (e) {
      console.log(`[FAIL] ${m.from} -> ${m.to} :: ${e}`);
    }
  } else {
    console.log(`[PLAN] ${m.from} -> ${m.to}`);
  }
}
