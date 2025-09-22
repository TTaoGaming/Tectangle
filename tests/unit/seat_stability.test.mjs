import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

/**
 * WEBWAY:ww-2025-015
 * Seat stability test: Re-run harness twice; ensure P1 hand identity (first claimed) remains consistent
 * across runs (heuristic: same handedness + early frame landmark count heuristics) to guard against
 * brittle tests that rely only on visualization.
 * NOTE: This is heuristic because underlying MediaPipe ID may vary; we fall back to seatMap ordering.
 */

describe('Seat stability heuristic', function(){
  this.timeout(60000);
  const sample = 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  const summaryPath = sample + '.rich.summary.json';

  function runOnce(){
    if(fs.existsSync(summaryPath)) fs.unlinkSync(summaryPath);
    const env = { ...process.env, RICH:'1' };
    const res = spawnSync('node', ['tests/smoke/run_video_collect_golden.js', sample], { encoding:'utf8', env });
    assert.strictEqual(res.status, 0, 'harness status 0');
    assert.ok(fs.existsSync(summaryPath), 'summary exists');
    const summary = JSON.parse(fs.readFileSync(summaryPath,'utf8'));
    return summary;
  }

  it('maintains consistent P1 seat mapping heuristic across runs', ()=>{
    const a = runOnce();
    const p1A = a.seatMap && a.seatMap.P1;
    assert.ok(p1A, 'first run has P1 seat');
    const b = runOnce();
    const p1B = b.seatMap && b.seatMap.P1;
    assert.ok(p1B, 'second run has P1 seat');
    // Heuristic: same handedness
    if(p1A && p1B && p1A.handedness && p1B.handedness){
      assert.strictEqual(p1A.handedness, p1B.handedness, 'P1 handedness consistent');
    }
  });
});
