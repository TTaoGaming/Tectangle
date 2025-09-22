// Copies canonical source MP4s into videos/golden/* with stable names for tests
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('September2025/TectangleHexagonal');
const videosDir = path.join(root, 'videos');
const goldenDir = path.join(videosDir, 'golden');

// Source files (existing in repo)
const SRC_PINCH = path.join(videosDir, 'two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4');
const SRC_IDLE  = path.join(videosDir, 'two_hands_baseline_idle_v1.mp4');

// Golden target names
const DST_PINCH = path.join(goldenDir, 'golden.two_hands_pinch_seq.v1.mp4');
const DST_IDLE  = path.join(goldenDir, 'golden.two_hands_idle.v1.mp4');

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function copyIfChanged(src, dst){
  if(!fs.existsSync(src)) throw new Error(`Source not found: ${src}`);
  let same = false;
  if(fs.existsSync(dst)){
    try {
      const s = fs.statSync(src); const d = fs.statSync(dst);
      same = (s.size === d.size && s.mtimeMs === d.mtimeMs);
    } catch {}
  }
  fs.copyFileSync(src, dst);
}

try {
  ensureDir(goldenDir);
  copyIfChanged(SRC_PINCH, DST_PINCH);
  copyIfChanged(SRC_IDLE, DST_IDLE);
  console.log('[golden] Prepared:', path.relative(root, DST_PINCH), 'and', path.relative(root, DST_IDLE));
  process.exit(0);
} catch (e) {
  console.error('[golden] Prepare failed:', e.message);
  process.exit(1);
}
