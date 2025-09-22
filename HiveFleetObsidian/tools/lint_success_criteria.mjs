#!/usr/bin/env node
/*
 Heuristic lint for procedure.steps[*].success_criteria in schema-format seeds.
 Goals (simplicity + extensibility):
  - Enforce max length
  - Require objective signal: comparator, number %, or objective verb token
  - Flag vague adjectives if no objective signal
  - Designed so new rules can be added via small arrays below
*/
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const seedsDir = path.join(repoRoot, 'HiveFleetObsidian', 'Seeds');

let yaml;
try { yaml = await import('yaml'); } catch { console.error('[error] yaml dep missing'); process.exit(1); }

const MAX_LEN = 180; // chars
const objectiveTokens = [
  'sorted','reversible','present','populated','recorded','removed','scheduled','ranked','categorized','confirmed','updated','listed','defined','references','covered','stable','identified','noted','returned','chosen','fsync','checksum','repro','tags','winner','gaps','slice','plan','guardrail'
];
const vagueWords = ['good','nice','appropriate','sufficient','robust','optimal','intuitive','clean','fast','better'];
const comparatorRegex = /[<>]=?|≤|≥|==|!=|\b\d+%|\b\d+\b|tolerance|within|bounds|threshold/i;

function listSeedFiles() {
  return fs.readdirSync(seedsDir).filter(f=>f.endsWith('.seed.yaml')).map(f=>path.join(seedsDir,f));
}

function readSeed(file) {
  return yaml.parse(fs.readFileSync(file,'utf8'));
}

function hasObjective(str){
  if (comparatorRegex.test(str)) return true;
  const lower = str.toLowerCase();
  return objectiveTokens.some(t=>lower.includes(t));
}

function hasVague(str){
  const lower = str.toLowerCase();
  return vagueWords.filter(w=>lower.includes(w));
}

function lintCriteria(str){
  const issues = [];
  if (!str || typeof str !== 'string') { issues.push('missing'); return issues; }
  if (str.length > MAX_LEN) issues.push(`too_long:${str.length}`);
  const objective = hasObjective(str);
  const vague = hasVague(str);
  if (!objective) issues.push('no_objective_signal');
  if (vague.length && !objective) issues.push('vague:'+vague.join(','));
  return issues;
}

let fail = false;
const report = [];
for (const file of listSeedFiles()) {
  const seed = readSeed(file);
  const isSchema = seed && seed.procedure && seed.procedure.steps;
  if (!isSchema) continue; // ignore legacy (none expected now)
  seed.procedure.steps.forEach((step, idx)=>{
    const crit = step.success_criteria;
    const issues = lintCriteria(crit);
    if (issues.length){
      fail = true;
      report.push({ file: path.basename(file), step: step.name || `#${idx}`, issues, criteria: crit });
    }
  });
}

if (report.length){
  console.log('[criteria-lint] FAIL');
  report.forEach(r=>{
    console.log(`  ${r.file} :: ${r.step}`);
    console.log(`    criteria: ${r.criteria}`);
    console.log(`    issues: ${r.issues.join(' | ')}`);
  });
} else {
  console.log('[criteria-lint] PASS (all success_criteria meet heuristics)');
}

process.exit(fail ? 1 : 0);
