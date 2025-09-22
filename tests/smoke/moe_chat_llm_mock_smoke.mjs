import { strict as assert } from 'assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('MoE Chat with LLM (mock) smoke', function(){
  this.timeout(60000);
  const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

  it('generates a turn via LLM mock and saves chat', function(){
    const env = { ...process.env };
    const out = execFileSync('node', [path.join(base,'tools','moe_chat.mjs'), '--prompt','llm mock run','--provider','mock','--model','mock','--rounds','1'], { env }).toString();
    assert.ok(/\[MoE\] Chat saved ->/.test(out), 'chat not saved');
    // Find latest chat json and resolve counselRef -> turn JSON
    const chatsDir = path.join(base,'reports','chats');
    const jsons = fs.readdirSync(chatsDir).filter(n=>/chat_.*\.json$/.test(n)).map(n=>path.join(chatsDir,n));
    jsons.sort((a,b)=> fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    const latest = JSON.parse(fs.readFileSync(jsons[0],'utf8'));
    assert.ok(latest.counselRef, 'missing counselRef');
    const turn = JSON.parse(fs.readFileSync(latest.counselRef.replace(/\\/g,'/'), 'utf8'));
    assert.ok(turn.llm && turn.llm.provider === 'mock', 'turn not generated via mock');
    assert.ok(turn.counsel && turn.counsel.explore && turn.counsel.explore.what, 'counsel missing explore.what');
  });
});

