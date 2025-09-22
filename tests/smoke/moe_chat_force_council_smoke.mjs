import { strict as assert } from 'assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('MoE Chat --council forces 4 speakers', function(){
  this.timeout(30000);
  const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

  it('prints TTao + 4 seats + Scribe and saves', function(){
    const out = execFileSync('node', [path.join(base,'tools','moe_chat.mjs'), '--council', '--no-llm', '--prompt','counsel of 4 test','--rounds','1']).toString();
    for (const k of ['TTao:','Thread Sovereign:','Faultline Seeker:','Prism Magus:','Web Cartographer:','Silk Scribe:']){
      assert.ok(out.includes(k), `missing ${k}`);
    }
    assert.ok(/\[MoE\] Chat saved ->/.test(out), 'did not save chat');
  });
});

