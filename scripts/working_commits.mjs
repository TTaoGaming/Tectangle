#!/usr/bin/env node
// WorkingArchaeologyAdapter — lists commits tagged WORKING/WORKDING for rescue
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function exec(cmd, args, opts={}){ return new Promise((res, rej)=> execFile(cmd, args, { ...opts }, (err, stdout, stderr)=> err ? rej(Object.assign(err,{stderr})) : res({stdout, stderr}))); }

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs', 'knowledge', 'WORKING_COMMITS.md');

(async()=>{
  try{
    const { stdout } = await exec('git', ['--no-pager','log','--all','--date=iso','--pretty=%h%x09%ad%x09%s']);
    const lines = stdout.split(/\r?\n/).filter(Boolean);
    const hits = lines.filter(l=> /\bWORKI?D?NG\b|\[WORKING\]/i.test(l));
    const rows = hits.map(l=>{
      const [hash, date, ...rest] = l.split(/\t/);
      const subject = rest.join('\t');
      return { hash, date, subject };
    });
    const md = [
      '# WORKING commits (git archaeology)',
      '',
      `Found ${rows.length} commits with WORKING/WORKDING tags.`,
      '',
      '| Hash | Date | Subject | Rescue |',
      '|---|---|---|---|',
      ...rows.map(r=> `| ${r.hash} | ${r.date} | ${r.subject} | git checkout ${r.hash} |`),
      '',
      'Next steps',
      '- Cherry-pick or branch from promising hashes, run smoke harness, and snapshot as adapters.',
    ].join('\n');
    await fs.mkdir(path.dirname(OUT), { recursive: true });
    await fs.writeFile(OUT, md, 'utf8');
    console.log(`Wrote ${OUT}`);
  } catch (e){
    console.error(e);
    process.exit(1);
  }
})();
