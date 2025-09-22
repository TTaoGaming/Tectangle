#!/usr/bin/env node
/*
  scribe_rollups.mjs
  Reads HiveFleetObsidian/history/hive_history.jsonl (JSONL), skips invalid lines,
  computes counts per horizon, sample lessons, top recurring keywords.
  Writes JSON + Markdown summary to HiveFleetObsidian/docs/OnePagers/scribe_rollups/

  Usage:
    node HiveFleetObsidian/tools/scribe_rollups.mjs
    node HiveFleetObsidian/tools/scribe_rollups.mjs --history path/to/file.jsonl --out path/to/output/dir

  Non-destructive: reads history only; writes timestamped artifacts (does not modify history).
  Abort behavior: if history file is missing/unreadable, the script exits without writing outputs.
*/

import fs from 'node:fs';
import path from 'node:path';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';
const defaultHistory = path.join(base, 'history', 'hive_history.jsonl');

const argv = process.argv.slice(2);
function argValue(key) { const idx = argv.indexOf(key); return idx !== -1 && argv[idx+1] ? argv[idx+1] : null; }
const historyPath = argValue('--history') || defaultHistory;
const outDir = argValue('--out') || path.join(base, 'docs', 'OnePagers', 'scribe_rollups');

function isoSafe(ts = new Date()) {
  // ISO with colons replaced by hyphens and milliseconds stripped for Windows-safe filenames
  return ts.toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');
}

function nowIso() { return new Date().toISOString(); }

function parseDateLike(v) {
  if (!v) return null;
  if (typeof v === 'number') return new Date(v);
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isNaN(n)) return new Date(n);
  const d = new Date(s);
  if (!isNaN(d)) return d;
  return null;
}

function ensureDirSync(d) { fs.mkdirSync(d, { recursive: true }); }

// Stop rule: abort if history file is missing/unreadable (no artifacts written)
if (!fs.existsSync(historyPath)) {
  console.error(`[ScribeRollups] ERROR: history file not found: ${historyPath}`);
  console.error('[ScribeRollups] Aborting without writing artifacts.');
  process.exit(2);
}

let stat;
try {
  stat = fs.statSync(historyPath);
} catch (err) {
  console.error(`[ScribeRollups] ERROR reading history file stats: ${err.message}`);
  console.error('[ScribeRollups] Aborting without writing artifacts.');
  process.exit(2);
}

let content;
try {
  content = fs.readFileSync(historyPath, 'utf8');
} catch (err) {
  console.error(`[ScribeRollups] ERROR reading history file: ${err.message}`);
  console.error('[ScribeRollups] Aborting without writing artifacts.');
  process.exit(2);
}

// Parse JSONL safely, skip invalid lines
const lines = content.split(/\r?\n/);
const parsed = [];
let invalid = 0;
let lineNumber = 0;
for (const raw of lines) {
  lineNumber++;
  const s = raw.trim();
  if (!s) continue;
  try {
    const j = JSON.parse(s);
    j.__line = lineNumber;
    parsed.push(j);
  } catch (err) {
    invalid++;
  }
}

if (parsed.length === 0) {
  console.warn('[ScribeRollups] Warning: no valid JSON lines parsed (parsed=0). Script will still produce a minimal rollup.');
}

const fallbackDate = new Date(stat.mtimeMs); // fallback per requirement
const nowMs = Date.now();

// Horizons (milliseconds). Approximate day counts for month/quarter/6mo/year as described in the OnePager.
const horizons = [
  ['1d', 1 * 24 * 60 * 60 * 1000],
  ['1w', 7 * 24 * 60 * 60 * 1000],
  ['1m', 30 * 24 * 60 * 60 * 1000],
  ['1q', 90 * 24 * 60 * 60 * 1000],
  ['6mo', 182 * 24 * 60 * 60 * 1000],
  ['1y', 365 * 24 * 60 * 60 * 1000],
  ['5y', 1825 * 24 * 60 * 60 * 1000],
  ['10y', 3650 * 24 * 60 * 60 * 1000],
  ['100y', 36500 * 24 * 60 * 60 * 1000]
];

// Basic stopword list for simple keyword extraction
const stopwords = new Set([
  'the','and','for','with','that','this','from','are','was','were','is','in','on','to','of','a','an',
  'keep','use','per','as','by','or','if','not','be','it','its','we','our','you'
]);

function getTimestampForEntry(j) {
  const candKeys = ['ts','timestamp','time','date','generatedAt','createdAt'];
  for (const k of candKeys) {
    if (k in j) {
      const d = parseDateLike(j[k]);
      if (d) return d;
    }
  }
  // Fallback as required
  return fallbackDate;
}

function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)
    .filter(t => t.length > 2 && !stopwords.has(t));
}

// Prepare per-horizon aggregators
const horizonStats = Object.fromEntries(horizons.map(([k]) => [k, { count: 0, lessons: [], keywords: {} }]));
const overallKeywords = {};

// Walk parsed entries and aggregate
for (const entry of parsed) {
  const tsDate = getTimestampForEntry(entry);
  const deltaMs = nowMs - tsDate.getTime();
  const lesson = (entry.lesson || entry.Lesson || entry.note || '').trim();
  for (const [name, ms] of horizons) {
    if (deltaMs <= ms) {
      const h = horizonStats[name];
      h.count++;
      if (lesson) h.lessons.push(lesson);
      const tokens = tokenize(lesson || (entry.snapshot || ''));
      for (const t of tokens) {
        h.keywords[t] = (h.keywords[t] || 0) + 1;
        overallKeywords[t] = (overallKeywords[t] || 0) + 1;
      }
    }
  }
}

// Helpers to produce sorted top keywords
function topNKeywords(map, n = 10) {
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
}

// Build summary object
const summary = {
  generatedAt: nowIso(),
  source: historyPath,
  totals: { lines: lines.filter(Boolean).length, parsed: parsed.length, invalid },
  horizons: {}
};

for (const [name] of horizons) {
  const h = horizonStats[name];
  const uniqueLessons = Array.from(new Set(h.lessons)).slice(0, 5);
  summary.horizons[name] = {
    count: h.count,
    sample_lessons: uniqueLessons,
    top_keywords: topNKeywords(h.keywords, 10)
  };
}
summary.overall_top_keywords = topNKeywords(overallKeywords, 20);

// Write outputs (idempotent in the sense that it writes timestamped files; does not mutate history)
try {
  ensureDirSync(outDir);
  const isoSafeNow = isoSafe(new Date());
  const jsonPath = path.join(outDir, `scribe_rollups.${isoSafeNow}.json`);
  const mdPath = path.join(outDir, `scribe_rollups.${isoSafeNow}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');

  const mdLines = [];
  mdLines.push(`# Scribe Rollups — Generated: ${summary.generatedAt}`);
  mdLines.push('');
  mdLines.push(`Source: ${historyPath}`);
  mdLines.push('');
  mdLines.push(`- Lines read: ${summary.totals.lines}`);
  mdLines.push(`- Parsed: ${summary.totals.parsed}`);
  mdLines.push(`- Invalid: ${summary.totals.invalid}`);
  mdLines.push('');

  for (const [name] of horizons) {
    const h = summary.horizons[name];
    mdLines.push(`## ${name}`);
    mdLines.push(`- Entries: ${h.count}`);
    if (h.sample_lessons.length) {
      mdLines.push(`- Sample lessons:`);
      for (const s of h.sample_lessons) mdLines.push(`  - "${s.replace(/\n/g, ' ')}"`);
    }
    if (h.top_keywords.length) {
      mdLines.push(`- Top keywords: ${h.top_keywords.map(([k, c]) => `${k} (${c})`).join(', ')}`);
    }
    mdLines.push('');
  }

  if (summary.overall_top_keywords.length) {
    mdLines.push(`## Overall top keywords`);
    mdLines.push(summary.overall_top_keywords.slice(0, 20).map(([k, c]) => `- ${k}: ${c}`).join('\n'));
  }

  mdLines.push('');
  mdLines.push(`Generated JSON: ${jsonPath}`);

  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  console.log('[ScribeRollups] Wrote ->', jsonPath);
  console.log('[ScribeRollups] Wrote ->', mdPath);
} catch (err) {
  console.error('[ScribeRollups] ERROR writing outputs:', err.message);
  process.exit(3);
}