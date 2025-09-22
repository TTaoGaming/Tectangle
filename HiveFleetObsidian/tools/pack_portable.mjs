// Create a portable copy of the nest for drag-and-drop
// Usage: node HiveFleetObsidian/tools/pack_portable.mjs [--out HiveFleetObsidian_portable]

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def='') { const i = process.argv.indexOf(`--${name}`); return i>-1 ? (process.argv[i+1]||def) : def; }
const src = 'HiveFleetObsidian';
const out = arg('out','HiveFleetObsidian_portable');

function copyDir(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive:true });
  for (const ent of fs.readdirSync(srcDir, { withFileTypes:true })){
    const sp = path.join(srcDir, ent.name);
    const dp = path.join(dstDir, ent.name);
    if (ent.isDirectory()) copyDir(sp, dp);
    else if (ent.isFile()) fs.copyFileSync(sp, dp);
  }
}

if (!fs.existsSync(src)) { console.error('Missing source nest:', src); process.exit(2); }
if (fs.existsSync(out)) {
  console.log('[Pack] Removing existing', out);
  fs.rmSync(out, { recursive:true, force:true });
}
copyDir(src, out);
console.log(`[Pack] Portable nest created at ./${out}`);

