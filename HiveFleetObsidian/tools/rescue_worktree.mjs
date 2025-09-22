#!/usr/bin/env node
/**
 * Rescue automation: checkout WORKING commits and run verification gates
 * - Non-destructive: uses git worktree add --detach into .hfo_rescue/sha
 */

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, '.hfo_rescue');

function sh(cmd, args, cwd){
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd, shell: false, stdio: 'pipe' });
    let out = '', err = '';
    proc.stdout.on('data', d => out += d.toString());
    proc.stderr.on('data', d => err += d.toString());
    proc.on('close', code => resolve({ code, out, err }));
  });
}

async function parseWorkingCommits(){
  const wcPath = path.join(ROOT, 'docs', 'knowledge', 'WORKING_COMMITS.md');
  try{
    const txt = await fs.readFile(wcPath, 'utf8');
    const shas = [...txt.matchAll(/\b[0-9a-f]{7,40}\b/g)].map(m => m[0]);
    return Array.from(new Set(shas)).slice(0, 5); // limit for safety
  } catch { return []; }
}

async function verify(cwd){
  // use existing safe verification
  const step = await sh('npm', ['run', 'hive:freeze:verify'], cwd);
  return step.code === 0;
}

async function main(){
  await fs.mkdir(OUT, { recursive: true });
  const shas = await parseWorkingCommits();
  const results = [];
  for(const sha of shas){
    const wt = path.join(OUT, sha);
    const add = await sh('git', ['worktree', 'add', '--detach', wt, sha], ROOT);
    if(add.code !== 0){ results.push({ sha, status: 'worktree_add_failed', err: add.err }); continue; }
    const ok = await verify(wt);
    results.push({ sha, status: ok ? 'verified' : 'failed' });
  }
  const manifest = { runAt: new Date().toISOString(), results };
  await fs.writeFile(path.join(OUT, 'rescue_manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Rescue complete. See .hfo_rescue/rescue_manifest.json');
}

main().catch(err => { console.error(err); process.exit(1); });
