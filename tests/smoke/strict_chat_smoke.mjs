import { strict as assert } from 'assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

describe('Strict counsel-of-4 chat', function(){
  this.timeout(60000);
  const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

  it('is deterministic and contains all 4 seats without intros', function(){
    const args = [
      `${base}/tools/moe_chat.mjs`,
      '--prompt','strict smoke',
      '--strict',
      '--rounds','2'
    ];
    function sanitize(s){
      return s
        .split(/\r?\n/)
        .filter(l => !/^\[MoE\] Chat saved ->/.test(l))
        .join('\n');
    }
    const out1 = sanitize(execFileSync('node', args).toString());
    const out2 = sanitize(execFileSync('node', args).toString());

    // Four seats present
    for (const s of ['Thread Sovereign:','Faultline Seeker:','Prism Magus:','Web Cartographer:'])
      assert.ok(out1.includes(s), `missing seat ${s}`);

    // No intros in strict mode
    assert.ok(!/Hello\. I’m/.test(out1), 'strict mode should not print intros');

    // Deterministic across runs for same Board
    assert.equal(out1, out2, 'strict output must be deterministic for same Board');

    // Single final line and guardrail present once
    const finalCount = (out1.match(/Final:/g)||[]).length;
    assert.equal(finalCount, 1, 'single final call expected');
    const guardCount = (out1.match(/Ship only if frozen stays green\./g)||[]).length;
    assert.ok(guardCount >= 1, 'guardrail should be present once in final call');
  });
});
