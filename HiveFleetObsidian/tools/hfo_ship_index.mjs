#!/usr/bin/env node
/**
 * HFO Ship: Local indices generator
 * - Scans HiveFleetObsidian subtree only
 * - Writes ship-local WORLD and GOLD mirrors
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const HFO = path.join(ROOT, 'HiveFleetObsidian');
const NAV = path.join(HFO, 'navigation');
const KNOW = path.join(HFO, 'knowledge');

function toPosix(p){ return p.split('\\').join('/'); }

async function listFiles(dir, predicate) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries = [];
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (!predicate || predicate(full)) out.push(full);
    }
  }
  return out;
}

async function write(file, content){
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

async function main(){
  const shipIdx = path.join(NAV, 'WORLD_LOCAL_INDEX.md');
  const goldIdx = path.join(NAV, 'GOLD_LOCAL_INDEX.md');
  const mdFiles = (await listFiles(HFO, f => f.endsWith('.md')))
    .map(toPosix)
    .sort();

  const rows = mdFiles
    .filter(f => !f.includes('/historythread/'))
    .map(f => `| ${f.replace(toPosix(ROOT) + '/', '')} | ${path.basename(f)} |`)
    .join('\n');

  const world = `# HFO — WORLD local index (navigation)\n\n| Path | File |\n|---|---|\n${rows}\n`;
  await write(shipIdx, world);

  // GOLD mirror: prioritize knowledge + ADR references
  const goldCand = mdFiles.filter(f => f.includes('/knowledge/') || f.includes('/docs/adr/'));
  const grows = goldCand.map(f => `| ${f.replace(toPosix(ROOT) + '/', '')} |`).join('\n');
  const gold = `# HFO — GOLD local index (navigation)\n\n| Path |\n|---|\n${grows}\n`;
  await write(goldIdx, gold);

  console.log(`HFO Ship index written:\n- ${toPosix(shipIdx)}\n- ${toPosix(goldIdx)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
