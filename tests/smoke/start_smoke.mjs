import { strict as assert } from 'assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('Start (safe) smoke', function(){
  this.timeout(120000);

  it('runs start (safe) and produces turn shape PASS and counsel-of-4 chat', function(){
    const env = { ...process.env, HFO_SAFE_MODE: '1' };
    const res = spawnSync('node', ['HiveFleetObsidian/tools/start.mjs'], { encoding:'utf8', env });
    const out = (res.stdout||'') + (res.stderr||'');
    assert.ok(/\[Shape\] PASS/.test(out), 'missing shape PASS');
    for (const s of ['Thread Sovereign:', 'Faultline Seeker:', 'Prism Magus:', 'Web Cartographer:'])
      assert.ok(out.includes(s), `missing seat ${s}`);
    assert.ok(/Help: Ask anything\./.test(out), 'help banner missing');

    // Heartbeat artifact exists
    const hbDir = path.join('HiveFleetObsidian','reports','heartbeat');
    assert.ok(fs.existsSync(hbDir), 'heartbeat dir missing');
  });
});

