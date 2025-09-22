/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { strict as assert } from "node:assert";

describe('Hexagonal pinch clip', function(){
  this.timeout(180000);

  const clipRel = 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';
  const outDir = path.resolve('September2025/TectangleHexagonal/out');
  const baseName = 'two_hands_stationary_right_then_left_index_pinch_hold_1s_v1';
  const telemetryPath = path.join(outDir, baseName + '.telemetry.json');
  const goldenPath = path.join(outDir, baseName + '.jsonl');

  before(function(){
    execFileSync('node', ['tests/smoke/run_video_collect_golden.js', clipRel], { stdio: 'inherit' });
  });

  it('captures both hands in telemetry', function(){
    const telemetry = JSON.parse(readFileSync(telemetryPath, 'utf8'));
    const perHand = telemetry?.perHand || {};
    assert.equal(perHand.downs?.Right, 1, 'expected Right hand down count');
    assert.equal(perHand.ups?.Right, 1, 'expected Right hand up count');
    assert.equal(perHand.downs?.Left, 1, 'expected Left hand down count');
    assert.equal(perHand.ups?.Left, 1, 'expected Left hand up count');
  });

  it('records left-hand pinch transitions in golden', function(){
    const lines = readFileSync(goldenPath, 'utf8').trim().split(/\n+/);
    const leftPinched = lines.filter(line => line.includes('"hand":"Left"') && line.includes('"state":"Pinched"'));
    assert.ok(leftPinched.length >= 1, 'expected at least one Left hand Pinched state');
  });
});
