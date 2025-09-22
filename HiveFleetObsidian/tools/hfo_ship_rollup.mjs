#!/usr/bin/env node
/**
 * HFO Ship: Local rollup publisher
 * - Writes a portable rollup with NOT-PRODUCTION-READY disclaimer
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = process.cwd();
const HFO = path.join(ROOT, 'HiveFleetObsidian');
const SHIP = path.join(HFO, 'ship');
const HIST = path.join(HFO, 'historythread');

function toPosix(p){ return p.split('\\').join('/'); }
async function write(file, content){
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

function today(){
  const d = new Date();
  return d.toISOString().slice(0,10);
}

async function main(){
  const date = today();
  const out = path.join(HIST, 'daily', `HFO_ROLLUP_${date}.md`);
  const world = path.join(HFO, 'navigation', 'WORLD_LOCAL_INDEX.md');
  const gold = path.join(HFO, 'navigation', 'GOLD_LOCAL_INDEX.md');

  // Run verification gate (safe): npm run hive:freeze:verify
  const verification = await new Promise((resolve) => {
    const p = spawn('npm', ['run', 'hive:freeze:verify'], { cwd: ROOT, shell: true });
    let out = '', err = '';
    p.stdout.on('data', d => out += d.toString());
    p.stderr.on('data', d => err += d.toString());
    p.on('close', code => resolve({ code, out, err }));
  });
  const verified = verification.code === 0;

  const lines = [];
  lines.push('# HFO Ship — Daily Rollup (Portable)');
  lines.push('');
  lines.push('Policy: NOT-PRODUCTION-READY unless verified via Verification Port.');
  lines.push(`Verification: ${verified ? 'verified: true' : 'verified: false'} (exit ${verification.code})`);
  lines.push('');
  lines.push('Links:');
  lines.push(`- [WORLD local index](${toPosix(path.relative(path.dirname(out), world))})`);
  lines.push(`- [GOLD local index](${toPosix(path.relative(path.dirname(out), gold))})`);
  lines.push('');
  lines.push('Search tags: #HFO #SHIP #PORTABLE #NOT_PRODUCTION_READY');

  await write(out, lines.join('\n'));
  console.log(`HFO Ship rollup written:\n- ${toPosix(out)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
