import { strict as assert } from 'assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

describe('Mentor Workshop chat smoke', function(){
  this.timeout(60000);

  const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

  it('prints counsel-of-4 and help banner', function(){
    const out = execFileSync('node', [
      `${base}/tools/moe_chat.mjs`,
      '--prompt','smoke: mentor workshop',
      '--mode','mentor',
      '--tone','casual',
      '--rounds','2'
    ]).toString();

    const seats = ['Thread Sovereign:', 'Faultline Seeker:', 'Prism Magus:', 'Web Cartographer:'];
    for (const s of seats){
      assert.ok(out.includes(s), `missing seat line: ${s}`);
    }

    // One-line help banner present
    assert.ok(/Help: Ask anything\./.test(out), 'missing help banner');

    // Single final guardrail in Sovereign final call
    const finalCount = (out.match(/Final:/g)||[]).length;
    assert.ok(finalCount === 1, `expected single final call, found ${finalCount}`);
    assert.ok(/Ship only if frozen stays green\./.test(out), 'missing guardrail in final call');
  });
});

