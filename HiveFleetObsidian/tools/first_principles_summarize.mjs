// First Principles: reduce input doc to core and constraints (plain language)
// Usage: node HiveFleetObsidian/tools/first_principles_summarize.mjs <file>

import fs from 'node:fs';

const file = process.argv[2];
if(!file || !fs.existsSync(file)){
  console.log('Usage: node .../first_principles_summarize.mjs <file>');
  process.exit(0);
}
const txt = fs.readFileSync(file,'utf8');
const lines = txt.split(/\r?\n/).filter(Boolean);
const title = (lines.find(l=>/^#\s+/.test(l))||'').replace(/^#\s+/,'').trim();
const bullets = lines.filter(l=>/^-\s+/.test(l)).slice(0,5).map(l=>l.replace(/^-\s+/,'').trim());
const out = {
  title: title || file,
  objective: lines.find(l=>/objective|goal/i.test(l)) || '<state the objective plainly>',
  constraints: (lines.filter(l=>/constraint|limit|budget/i.test(l)).slice(0,3)),
  core:
    bullets.length ? bullets : ['<extract 3 core facts>', '<extract 3 invariants>'],
};
console.log(JSON.stringify({ first_principles: out }, null, 2));

