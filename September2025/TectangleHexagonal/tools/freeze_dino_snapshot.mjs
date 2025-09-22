/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Exercise the CLI entry point end-to-end
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Freeze a working snapshot of Hexagonal + Dino vendor
// Usage: node September2025/TectangleHexagonal/tools/freeze_dino_snapshot.mjs
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const SRC_DIR = path.resolve('September2025/TectangleHexagonal');
const TS = new Date().toISOString().replace(/[:.]/g,'-');
const SNAP_NAME = `archive-${TS}-working-dino-index-to-thumb-hysteresis-tube`;
const OUT_DIR = path.resolve(SNAP_NAME);

function write(file, data){ fs.mkdirSync(path.dirname(file), { recursive:true }); fs.writeFileSync(file, data); }

function appendSRL(snapshot, metric, lesson){
  const args = [
    'HiveFleetObsidian/tools/append_history.mjs',
    '--snapshot', snapshot,
    '--metric', metric,
    '--lesson', lesson,
    '--type', 'srl'
  ];
  const r = spawnSync('node', args, { stdio:'inherit' });
  if(r.status !== 0) console.warn('[freeze] SRL append exited with', r.status);
}

function filterCopy(src, dst){
  // Copy entire app tree; skip transient outputs if present
  const skip = new Set(['node_modules', '.git', 'out', 'reports']);
  const entries = fs.readdirSync(src, { withFileTypes:true });
  fs.mkdirSync(dst, { recursive:true });
  for(const e of entries){
    if(skip.has(e.name)) continue;
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if(e.isDirectory()) filterCopy(s, d); else fs.copyFileSync(s, d);
  }
}

function main(){
  if(!fs.existsSync(SRC_DIR)) throw new Error('Hexagonal source directory missing');
  fs.mkdirSync(OUT_DIR, { recursive:true });
  const dstApp = path.join(OUT_DIR, 'September2025', 'TectangleHexagonal');
  console.log('[freeze] Copying app to', dstApp);
  filterCopy(SRC_DIR, dstApp);

  // Write snapshot metadata
  const manifest = {
    ts: TS,
    name: 'Working Dino • Index→Thumb with Hysteresis Tube',
    origin: 'September2025/TectangleHexagonal',
    entry: 'dev/pinch_dino.html',
    vendor: 'vendor/dino (t-rex-runner BSD-3)',
    bridge: 'postMessage pinch-key (Z/X) → Space inside game iframe',
    status: 'Prototype works; deterministic bridge pass',
    next: ['Tune thresholds','Local multiplayer','Orientation gate','Bone-ratio hash','Greedy-neighbor hand ID']
  };
  write(path.join(OUT_DIR, 'freeze_manifest.json'), JSON.stringify(manifest, null, 2));

  const readme = `# Working Dino — Index→Thumb with Hysteresis Tube (Frozen)\n\n`+
`Snapshot: ${TS}\n\n`+
`This is a frozen reference of the Hexagonal pinch demo side-by-side with an official BSD-3 T‑Rex Runner.\n`+
`It maps pinch Z/X to Space via an iframe bridge. \n\n`+
`Highlights:\n`+
`- Deterministic event bridge: down/up order validated.\n`+
`- Hysteresis tube (enter=0.50, exit=0.80) for stable presses.\n`+
`- Orientation gate + palm cone available (toggle in Controls).\n`+
`- Vendor: wayou/t-rex-runner (gh-pages).\n\n`+
`Use Cases:\n`+
`- Reference implementation for 1-button pinch → key mapping.\n`+
`- Baseline for further tuning or multiplayer extensions.\n\n`+
`Notices:\n`+
`- This folder is frozen. Do not modify; copy elsewhere to iterate.\n\n`+
`Next Steps (not in this freeze):\n`+
`1) Tune thresholds per hand.\n`+
`2) Local multiplayer: two hands or two players.\n`+
`3) Orientation gating to reduce false positives.\n`+
`4) Bone-ratio hash for stable hand identity.\n`+
`5) Greedy-neighbor controller for robust hand ID.\n\n`+
`Entrypoint: September2025/TectangleHexagonal/dev/pinch_dino.html\n`;
  write(path.join(OUT_DIR, 'SNAPSHOT_README.md'), readme);
  write(path.join(OUT_DIR, '.frozen'), 'read-only\n');

  // Silk Scribe SRL lines
  appendSRL('Froze Working Dino (pinch→Space) snapshot with hysteresis tube', 'freeze+1', 'Stable 1-button demo archived for reference');
  appendSRL('Prototype works; needs tuning + local multiplayer plan', 'todo:next', 'Add orientation gate strictness, bone-ratio hash, greedy-neighbor hand ID');

  console.log('[freeze] Done ->', OUT_DIR);
}

main();
