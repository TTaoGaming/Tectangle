// Read both golden smoke summaries and fail on drift. Hex-only; no Hive tools.
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'September2025/TectangleHexagonal/out';
const twohandsPath = path.join(outDir, 'enriched.v13.golden.twohands.summary.json');
const idlePath = path.join(outDir, 'idle.v13.golden.summary.json');

function readJson(p){ if(!fs.existsSync(p)) throw new Error(`Missing summary: ${p}`); return JSON.parse(fs.readFileSync(p,'utf8')); }

try {
  const two = readJson(twohandsPath);
  const idle = readJson(idlePath);

  let ok = true; const errs = [];
  if(!two.PASS){ ok=false; errs.push('Two-hands golden did not PASS.'); }
  // Basic richness checks
  if(!(two.summary?.P1?.distinctFrames >= 6 && two.summary?.P2?.distinctFrames >= 6)){
    ok=false; errs.push('Two-hands summary did not contain enough distinct frames per seat.');
  }
  if(!(two.summary?.P1?.anglePresence > 0 && two.summary?.P2?.anglePresence > 0)){
    ok=false; errs.push('Two-hands summary missing angle presence for one or both seats.');
  }
  // Idle must be no-lock
  if(idle.PASS !== true || idle.observed?.anyLock !== false){
    ok=false; errs.push('Idle golden indicates a lock or failed to PASS.');
  }

  if(!ok){
    console.error('[hex:verify:goldens] FAIL', { errs, two, idle });
    process.exit(1);
  }
  console.log('[hex:verify:goldens] PASS');
  process.exit(0);
} catch (e) {
  console.error('[hex:verify:goldens] ERROR', e.message);
  process.exit(1);
}
