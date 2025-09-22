import { strict as assert } from 'assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('MoE Chat (4+2) smoke', function () {
  this.timeout(60000);

  const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

  it('produces conversational lines for TTao + 4 core + Scribe', function () {
    const turnsDir = path.join(base, 'reports', 'turns');
    if (!fs.existsSync(turnsDir) || fs.readdirSync(turnsDir).filter(n => /^turn_.*\.json$/.test(n)).length === 0) {
      // Generate a turn to ground counsel; non-fatal if it fails but try
      try {
        execFileSync('node', [path.join(base, 'tools', 'orchestrator_turn.mjs'), '--out', turnsDir], { stdio: 'inherit' });
      } catch {}
    }

    const out = execFileSync('node', [path.join(base, 'tools', 'moe_chat.mjs'), '--prompt', 'hello champions']).toString();
    const req = ['TTao:', 'Thread Sovereign:', 'Faultline Seeker:', 'Prism Magus:', 'Web Cartographer:', 'Silk Scribe:'];
    for (const k of req) assert.ok(out.includes(k), `missing speaker ${k}`);
    assert.ok(/\[MoE\] Chat saved ->/.test(out), 'did not save chat artifact');

    // No placeholder tokens and includes a glossed term
    assert.ok(!out.includes('<fill>'), 'contains placeholder <fill>');
    assert.ok(/OODA \(observe–orient–decide–act\)/.test(out), 'missing OODA gloss');

    // Validate voices JSON captured
    const chatsDir = path.join(base, 'reports', 'chats');
    const jsons = fs.readdirSync(chatsDir).filter(n => /chat_.*\.json$/.test(n)).map(n => path.join(chatsDir, n));
    assert.ok(jsons.length > 0, 'no chat json artifacts');
    jsons.sort((a,b)=> fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    const data = JSON.parse(fs.readFileSync(jsons[0], 'utf8'));
    assert.ok(data.voices && data.voices.pivot && (data.voices.pivot.persona || data.voices.pivot.canon !== undefined), 'missing voices.pivot');
  });
});
