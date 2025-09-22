import { strict as assert } from 'assert';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

describe('MoE Chat paste-in counsel (file) smoke', function(){
  this.timeout(30000);
  const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
  const tmpDir = path.join(base, 'inbox');
  const file = path.join(tmpDir, 'counsel.sample.json');

  before(()=>{ fs.mkdirSync(tmpDir, { recursive:true }); });

  it('renders chat from pasted counsel JSON', function(){
    const sample = {
      counsel: {
        explore: { what:'Try 60s trace on path A', why:'Reduce risk', win:'timeout or signal', warnings:'keep cheap', how:['trace','replay','record'] },
        pivot: { what:'Swap method X→Y', why:'EV higher', win:'no regressions', warnings:'small A/B', how:['baseline','switch','compare'] },
        reorient: { what:'Name seam + smallest adapter', why:'reduce drift', win:'pattern named', warnings:'no heavy deps', how:['name','stub','map'] },
        exploit: { what:'One reversible step', why:'move metric', win:'frozen:pass', warnings:'ship only if green', how:['daily','fix','scribe'] }
      },
      guardrail: 'Ship only if frozen passes.'
    };
    fs.writeFileSync(file, JSON.stringify(sample, null, 2));
    const out = execFileSync('node', [path.join(base,'tools','moe_chat.mjs'), '--council', '--counsel-file', file, '--rounds','1']).toString();
    for (const k of ['TTao:','Thread Sovereign:','Faultline Seeker:','Prism Magus:','Web Cartographer:','Silk Scribe:']){
      assert.ok(out.includes(k), `missing ${k}`);
    }
    assert.ok(/\[MoE\] Chat saved ->/.test(out), 'chat not saved');
  });
});

