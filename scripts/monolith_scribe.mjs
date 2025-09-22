#!/usr/bin/env node
// MonolithScribe — extract key header tags from modular monolith HTML
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'archive-2025-09-01T19-13-05Z','root_contents','offline-dependencies','index-modular-monolithv25.7.26.1730.html');
const OUT = path.join(ROOT, 'docs','knowledge','MONOLITH_SCRIBE.md');

async function main(){
  const html = await fs.readFile(SRC,'utf8').catch(()=> null);
  if (!html){
    await fs.writeFile(OUT, '# Monolith Scribe\n\nSource not found. Verify archive path.', 'utf8');
    console.log('Wrote MONOLITH_SCRIBE with missing source note');
    return;
  }
  // pull comment block lines that look like tags
  const lines = html.split(/\r?\n/).map(l=> l.trim());
  const picks = lines.filter(l=> /(STATUS|PIPELINE STATUS|PHASE 2|TAG-BASED NAVIGATION|SYSTEM ARCHITECTURE|PROJECT STRUCTURE|EVENT SYSTEM|QUALITY STANDARDS)/i.test(l));
  const md = [
    '# Modular Monolith — key tags (scraped)',
    '',
    `Source: ${path.relative(ROOT, SRC).replace(/\\/g,'/')}`,
    '',
    'Extracted:',
    ...picks.map(l=> `- ${l.replace(/^<!--\s*|\s*-->$/g,'')}`),
    '',
    'Notes',
    '- Use this as a seed to re-name ports and isolate adapters in current repo.',
  ].join('\n');
  await fs.writeFile(OUT, md, 'utf8');
  console.log(`Wrote ${OUT}`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
