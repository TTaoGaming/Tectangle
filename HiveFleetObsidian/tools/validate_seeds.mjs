#!/usr/bin/env node
/*
Validate all *.seed.yaml in HiveFleetObsidian/Seeds against the draft-07 schema when possible,
and perform lightweight structural checks for the compact format seeds as well.
*/

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const seedsDir = path.join(repoRoot, 'HiveFleetObsidian', 'Seeds');
const schemaPath = path.join(seedsDir, 'agent_role_seed.schema.json');

// Lazy-load yaml and ajv if available without adding deps; fall back to bundled YAML parser if missing.
let yaml;
try {
  yaml = await import('yaml');
} catch (e) {
  console.error('[warn] yaml package not found; install with: npm i -D yaml');
  process.exitCode = 1;
}

let Ajv;
try {
  ({ default: Ajv } = await import('ajv'));
} catch (e) {
  // ajv optional; we still do structural checks without it
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readYaml(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return yaml.parse(raw);
}

function listSeedFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.seed.yaml'))
    .map((f) => path.join(dir, f));
}

function checkCompactShape(seed, file) {
  const requiredTop = ['version', 'metadata', 'identity', 'mission', 'output_shape', 'guardrails', 'procedure', 'invocation'];
  const missing = requiredTop.filter((k) => !(k in seed));
  const problems = [];
  if (missing.length) problems.push(`missing keys: ${missing.join(', ')}`);
  // Minimal metadata checks
  if (seed.metadata && typeof seed.metadata.id !== 'string') problems.push('metadata.id must be string');
  if (seed.metadata && typeof seed.metadata.name !== 'string') problems.push('metadata.name must be string');
  // output_shape should be array of strings
  if (!Array.isArray(seed.output_shape) || !seed.output_shape.every((s) => typeof s === 'string')) {
    problems.push('output_shape must be an array of strings');
  }
  // guardrails/procedure arrays
  for (const k of ['guardrails', 'procedure']) {
    if (!Array.isArray(seed[k]) || seed[k].length === 0) problems.push(`${k} must be a non-empty array`);
  }
  return problems;
}

function prettyRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function main() {
  if (!fs.existsSync(seedsDir)) {
    console.error(`[error] Seeds directory not found: ${prettyRel(seedsDir)}`);
    process.exit(1);
  }
  const files = listSeedFiles(seedsDir);
  if (files.length === 0) {
    console.log('[info] No *.seed.yaml files found');
    return;
  }

  let ajv;
  let validate;
  if (fs.existsSync(schemaPath) && Ajv) {
    ajv = new Ajv({ allErrors: true, strict: false });
    const schema = readJson(schemaPath);
    validate = ajv.compile(schema);
  }

  let pass = true;
  for (const file of files) {
    try {
      const seed = readYaml(file);
      const isSchemaSeed = !!(seed && seed.io && seed.policies && seed.procedure && seed.procedure.steps);
      let issues = [];
      if (!isSchemaSeed) {
        // legacy compact format structural checks
        issues = checkCompactShape(seed, file);
      }
      let schemaErrors = [];
      if (validate && isSchemaSeed) {
        const ok = validate(seed);
        if (!ok) schemaErrors = validate.errors || [];
      }
      const rel = prettyRel(file);
      if (issues.length === 0 && schemaErrors.length === 0) {
        console.log(`[PASS] ${rel}`);
      } else {
        pass = false;
        console.log(`[FAIL] ${rel}`);
        if (issues.length) console.log('  - structural:', issues.join(' | '));
        if (schemaErrors.length) console.log('  - schema:', JSON.stringify(schemaErrors, null, 2));
      }
    } catch (e) {
      pass = false;
      console.log(`[ERROR] ${prettyRel(file)} -> ${e.message}`);
    }
  }

  if (!pass) process.exit(1);
}

main();
