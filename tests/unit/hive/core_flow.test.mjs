import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const tools = (p) => path.join(base,'tools',p);
const historyPath = path.join(base,'history','hive_history.jsonl');

function readLastHistory(){
  if(!fs.existsSync(historyPath)) return null;
  const lines = fs.readFileSync(historyPath,'utf8').trim().split(/\n/).filter(Boolean);
  if(!lines.length) return null;
  try { return JSON.parse(lines[lines.length-1]); } catch { return null; }
}

describe('Hive core flow', function(){
  this.timeout(30000);

  it('runs orchestrator turn and appends heartbeat even if guardrail fails', ()=>{
    const res = spawnSync('node', [tools('orchestrator_turn.mjs')], { encoding:'utf8' });
    assert.strictEqual(typeof res.status, 'number');
    assert.ok(/\{\s*"counsel"/m.test(res.stdout), 'expected JSON output with counsel');
    const last = readLastHistory();
    assert.ok(last, 'expected at least one history line');
    assert.ok(/turn|turn-hb/.test(last.type||''), 'expected a turn heartbeat or turn type');
  });

  it('runs moe_chat and appends a chat heartbeat', ()=>{
    const beforeLen = fs.existsSync(historyPath) ? fs.readFileSync(historyPath,'utf8').split(/\n/).filter(Boolean).length : 0;
    const res = spawnSync('node', [tools('moe_chat.mjs'), '--no-llm', '--rounds','1'], { encoding:'utf8' });
    assert.strictEqual(typeof res.status, 'number');
    assert.ok(/Help: Ask anything\./.test(res.stdout), 'expected help banner at end');
    const after = fs.existsSync(historyPath) ? fs.readFileSync(historyPath,'utf8').split(/\n/).filter(Boolean).length : 0;
    assert.ok(after >= beforeLen, 'history should not shrink');
    const last = readLastHistory();
    assert.ok(last, 'expected a history line');
    assert.ok(/chat|chat-mini/.test(last.type||''), 'expected a chat event type');
  });
});
