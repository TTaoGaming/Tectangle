import { strict as assert } from 'assert';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

describe('Counsel varies by Board (mock LLM)', function(){
  this.timeout(60000);
  const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
  const boardPath = path.join(base, 'BOARD.current.txt');

  function writeBoard(problem){
    const now = new Date().toISOString();
    const content = [
      `Problem: ${problem}`,
      `Metric: deck_shape_test`,
      `Constraint: Node>=18; reversible steps`,
      `Horizons: 1h=<today> | 1d=<tomorrow> | 1w=<week> | 1m=<month>`,
      `Current: test; updated: ${now}`
    ].join('\n');
    fs.writeFileSync(boardPath, content, 'utf8');
  }

  function latestTurnJson(){
    const dir = path.join(base,'reports','turns');
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(n=>/^turn_.*\.json$/.test(n)).map(n=>path.join(dir,n)) : [];
    if (files.length===0) return null;
    files.sort((a,b)=> fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    return JSON.parse(fs.readFileSync(files[0],'utf8'));
  }

  let originalBoard='';
  before(function(){ if (fs.existsSync(boardPath)) originalBoard = fs.readFileSync(boardPath,'utf8'); });
  after(function(){ if (originalBoard) fs.writeFileSync(boardPath, originalBoard, 'utf8'); });

  it('produces different explore.what for different problems', function(){
    writeBoard('Map cards and images');
    execFileSync('node', [path.join(base,'tools','moe_chat.mjs'), '--provider','mock','--model','mock','--prompt','deck test','--rounds','1'], { stdio: 'ignore' });
    const t1 = latestTurnJson();
    assert.ok(t1 && t1.counsel && t1.counsel.explore, 'missing counsel after first run');
    const w1 = String(t1.counsel.explore.what||'');

    writeBoard('Speed up replay traces');
    execFileSync('node', [path.join(base,'tools','moe_chat.mjs'), '--provider','mock','--model','mock','--prompt','deck test','--rounds','1'], { stdio: 'ignore' });
    const t2 = latestTurnJson();
    const w2 = String(t2.counsel.explore.what||'');

    assert.notStrictEqual(w1, w2, 'explore.what did not vary by board problem');
    // Shape is deterministic: ensure keys exist
    for (const seat of ['explore','pivot','reorient','exploit']){
      const c = t2.counsel[seat];
      assert.ok(c.what && c.why && c.win && Array.isArray(c.how) && c.how.length>=1, `missing fields for ${seat}`);
    }
  });
});

