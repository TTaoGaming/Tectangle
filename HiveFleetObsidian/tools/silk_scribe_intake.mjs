// Silk Scribe intake: scan recent notes/docs and emit candidate history lines
// Usage:
//   node HiveFleetObsidian/tools/silk_scribe_intake.mjs [--since-days 190] [--out <file>] [--dirs a,b,c]
// Writes a JSONL of {snapshot, metric_delta, lesson, src} to --out. Does not modify history.

import fs from 'node:fs';
import path from 'node:path';

function arg(name, def = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? (process.argv[i + 1] || '') : def;
}

const sinceDays = Number(arg('since-days', '190'));
const outArg = arg('out', '');
const dirsArg = arg('dirs', 'docs,September2025');
const addTommyNotes = true;

const repoRoot = process.cwd();
const baseNest = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const outDefault = path.join(baseNest, 'history', `silk_candidates_${new Date().toISOString().slice(0,10)}.jsonl`);
const outPath = outArg || outDefault;

const dirList = dirsArg.split(',').map(s => s.trim()).filter(Boolean);
const startTime = Date.now() - sinceDays * 24 * 60 * 60 * 1000;

const IGNORE_SEGMENTS = new Set(['node_modules', '.git', '.history', '.husky', '.github', '.devcontainer', '.venv', 'archive-stale']);
const IGNORE_PATH_CONTAINS = ['archive-20', path.join('September2025','modular-index')];

function listFiles(dir) {
  const abs = path.join(repoRoot, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const stack = [abs];
  while (stack.length) {
    const cur = stack.pop();
    const ents = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of ents) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) {
        const seg = e.name;
        if (IGNORE_SEGMENTS.has(seg)) continue;
        const rel = path.relative(repoRoot, p);
        if (IGNORE_PATH_CONTAINS.some(mark => rel.includes(mark))) continue;
        stack.push(p);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (['.md', '.txt'].includes(ext)) {
          const st = fs.statSync(p);
          if (st.mtimeMs >= startTime) out.push(p);
        }
      }
    }
  }
  return out;
}

function pickSnippet(text) {
  const lines = text.split(/\r?\n/).map(s => s.trim());
  // Prefer TL;DR line
  const tldr = lines.find(l => /^tl;dr\s*:|^tldr\s*:/i.test(l));
  if (tldr) return tldr.replace(/^tl;dr\s*:|^tldr\s*:/i, '').trim();
  // Else first markdown heading
  const head = lines.find(l => /^#+\s+/.test(l));
  if (head) return head.replace(/^#+\s+/, '').trim();
  // Else first non-empty line
  const first = lines.find(l => l.length > 0) || '';
  return first.trim();
}

function toSnapshot(baseName) {
  // Snapshot: short, 3-7 words
  const core = baseName.replace(/[_-]+/g, ' ').replace(/\.[^.]+$/, '');
  return `Doc: ${core}`.slice(0, 80);
}

function clamp(s, n = 200) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

const files = [];
for (const d of dirList) files.push(...listFiles(d));
if (addTommyNotes) {
  for (const f of fs.readdirSync(repoRoot)) {
    if (/^TommyNotes.*\.txt$/i.test(f)) {
      const p = path.join(repoRoot, f);
      const st = fs.statSync(p);
      if (st.mtimeMs >= startTime) files.push(p);
    }
  }
}

files.sort((a,b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const out = fs.createWriteStream(outPath, { encoding: 'utf8' });

let count = 0;
for (const f of files) {
  try {
    const raw = fs.readFileSync(f, 'utf8');
    const snippet = pickSnippet(raw);
    if (!snippet) continue;
    const base = path.basename(f);
    const snapshot = toSnapshot(base);
    const lesson = clamp(snippet);
    const rec = { snapshot, metric_delta: 'note', lesson, src: path.relative(repoRoot, f) };
    out.write(JSON.stringify(rec) + '\n');
    count++;
  } catch (e) {
    // skip unreadable files
  }
}

out.end();
console.log(`[Silk] Wrote ${count} candidate line(s) -> ${outPath}`);
