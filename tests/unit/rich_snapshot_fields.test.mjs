import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

/**
 * WEBWAY:ww-2025-015
 * Purpose: Ensure rich snapshot exposes index & thumb angles per seat and seats stay isolated.
 * Approach: Launch node script that loads MP4 via existing harness (run_video_collect_golden) with RICH=1
 * then inspect produced .rich.summary.json and .rich.jsonl for seat separation & angle fields.
 * NOTE: This test assumes harness writes files named like <video>.rich.summary.json in same directory.
 */

describe('Rich snapshot fields (dual-seat integrity)', function(){
  this.timeout(45000);

  const sample = 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  const summaryPath = sample + '.rich.summary.json';
  const framesPath = sample + '.rich.jsonl';

  function runHarness(){
    if(fs.existsSync(summaryPath)) fs.unlinkSync(summaryPath);
    if(fs.existsSync(framesPath)) fs.unlinkSync(framesPath);
    const env = { ...process.env, RICH:'1' };
    const res = spawnSync('node', ['tests/smoke/run_video_collect_golden.js', sample], { encoding:'utf8', env });
    if(res.error) throw res.error;
    assert.strictEqual(res.status, 0, 'harness exit status 0');
  }

  it('produces summary & frames with seat + angle fields', ()=>{
    runHarness();
    assert.ok(fs.existsSync(summaryPath), 'summary file exists');
    assert.ok(fs.existsSync(framesPath), 'frames jsonl exists');
    const summary = JSON.parse(fs.readFileSync(summaryPath,'utf8'));
    assert.ok(summary.seatMap, 'seatMap present');
    const frames = fs.readFileSync(framesPath,'utf8').trim().split(/\n/).filter(Boolean).slice(-40).map(l=>{ try{return JSON.parse(l);}catch{return null;} }).filter(Boolean);
    assert.ok(frames.length>0, 'frames parsed');
    const bySeat = new Map();
    frames.forEach(f=>{ if(f.seat){ if(!bySeat.has(f.seat)) bySeat.set(f.seat, []); bySeat.get(f.seat).push(f); } });
    // Expect at least one P1 frame; optionally P2
    assert.ok(bySeat.has('P1'), 'P1 seat frames exist');
    const p1Frames = bySeat.get('P1');
    const withAngles = p1Frames.find(f=> f.indexAngles || f.thumbAngles);
    assert.ok(withAngles, 'at least one P1 frame contains angles');
    if(bySeat.has('P2')){
      const p2Frames = bySeat.get('P2');
      // Isolation: ensure no frame object reused (different references) - approximated by distinct timestamp or idx
      const collision = p1Frames.some(f1=> p2Frames.some(f2=> f1.frameIndex!=null && f1.frameIndex===f2.frameIndex && f1.seat!==f2.seat));
      assert.ok(!collision, 'no frameIndex collision across seats');
    }
  });
});
