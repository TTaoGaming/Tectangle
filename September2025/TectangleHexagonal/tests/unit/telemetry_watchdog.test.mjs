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

import assert from 'assert';
import { TelemetryManager } from '../../src/ports/telemetryManager.js';
import { WatchdogManager } from '../../src/ports/watchdogManager.js';

// Fake window for snapshot
global.window = { __getTelemetry(){ return { downs:1, ups:1, specCancelRate:0.05, meanDownLatency:120, frames:300 }; } };

describe('Telemetry/Watchdog scaffolds', ()=>{
  it('produces a valid envelope and passes pinch rules', ()=>{
    const tm = new TelemetryManager();
    const env = tm.snapshotFromPage('pinch');
    assert(env && !env.__invalid, 'envelope valid');
    const wd = new WatchdogManager();
    const v = wd.check('pinch', env);
    assert.equal(v.length, 0);
  });
  it('flags gated clip downs', ()=>{
    const tm = new TelemetryManager();
    const env = { ...tm.snapshotFromPage('gated'), downs: 2, ups: 1 };
    const wd = new WatchdogManager();
    const v = wd.check('gated', env);
    assert(v.find(x=>x.code==='GATED_DOWNS'));
  });
});
