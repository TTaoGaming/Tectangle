#!/usr/bin/env node
/**
 * Motif Validator
 * Ensures metaphor / motif tokens meant to be exclusive to a role do not leak into others
 * and reports accidental thematic overlap across champion seeds.
 *
 * Sources scanned:
 *   - center_of_gravity.name
 *   - equipment[].name
 * (Can be extended later for identity.motto or algorithms.)
 *
 * Exit codes:
 *   0 = no exclusivity violations (overlap warnings may still print)
 *   1 = exclusivity violation(s) detected
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.join(__dirname, '..', 'Seeds');

// Configuration (can later externalize to JSON if needed)
const config = {
  exclusive: {
    mirror: 'prism_magus',      // Mirror / mirrors motifs only in Prism Magus
    heat: 'faultline_seeker',   // Heat cascade motif exclusive
    thread: 'thread_sovereign', // Thread / weaving motif exclusive
    ledger: 'silk_scribe',      // Ledger / record keeping
  web: 'web_cartographer',    // Web / map motif
  router: 'orchestrator',     // Router / routing motif
  rollback: 'thread_sovereign' // Rollback reserved for exploitation role
  },
  // Tokens to ignore for overlap warnings (generic container nouns or ubiquitous gear words)
  ignore: new Set([
    'the','a','of','and','engine','planner','cascade','gain','scale','mask','lens','spindle','cape','iron','loom','shield','spear','quill','lattice','telescope','compass','frame','basin','abacus','dragline','crucible','brand','shadow','planner','reversible','gain','pre','precedent','overlay','heat','faultline','router','ledger','web','thread'
  ]),
  minTokenLength: 4 // ignore very short tokens for overlap warnings
};

const toTokens = (str) => {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
};

// Very lightweight stemmer (naive) to collapse trivial morphological variants.
// Avoids dependency bloat; sufficient for motif overlap guard.
function stem(token) {
  if (token.length <= 4) return token; // keep short tokens unchanged
  const rules = [
    /(ing|ers|er|ies|ied|ily|ment|ments)$/,
    /(ations|ation|ation|ative)$/,
    /(ed|es|s)$/
  ];
  let t = token;
  for (const r of rules) {
    if (r.test(t)) {
      const cand = t.replace(r, '');
      if (cand.length >= 4) { t = cand; break; }
    }
  }
  return t;
}

function loadSeedFiles() {
  const entries = fs.readdirSync(seedsDir).filter(f => f.endsWith('.seed.yaml'));
  return entries.map(f => ({ file: f, fullPath: path.join(seedsDir, f) }));
}

function extractMotifTokens(doc, roleId) {
  const tokens = new Set();
  // Kernel name
  if (doc.center_of_gravity?.name) {
    toTokens(doc.center_of_gravity.name).forEach(t => tokens.add(t));
  }
  // Kernel description
  if (doc.center_of_gravity?.description) {
    toTokens(doc.center_of_gravity.description).forEach(t => tokens.add(t));
  }
  // Kernel algorithms
  if (Array.isArray(doc.center_of_gravity?.algorithms)) {
    for (const alg of doc.center_of_gravity.algorithms) {
      toTokens(alg).forEach(t => tokens.add(t));
    }
  }
  // Procedure step algorithms (optional extension)
  if (Array.isArray(doc.procedure?.steps)) {
    for (const step of doc.procedure.steps) {
      if (Array.isArray(step.algorithms)) {
        for (const alg of step.algorithms) {
          toTokens(alg).forEach(t => tokens.add(t));
        }
      }
    }
  }
  // Equipment names
  if (Array.isArray(doc.equipment)) {
    for (const eq of doc.equipment) {
      if (eq?.name) toTokens(eq.name).forEach(t => tokens.add(t));
    }
  }
  // Motto
  if (doc.identity?.motto) {
    toTokens(doc.identity.motto).forEach(t => tokens.add(t));
  }
  return tokens;
}

function main() {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const seedFiles = loadSeedFiles();
  const motifMap = {}; // stem -> { roles: Set, originals: Map<role, Set<originalToken>> }
  const roleIds = new Set();

  for (const { file, fullPath } of seedFiles) {
    const raw = fs.readFileSync(fullPath, 'utf8');
    let doc;
    try { doc = yaml.parse(raw); } catch (e) { console.error(`YAML parse error in ${file}:`, e.message); continue; }
    const roleId = doc?.metadata?.id || file.replace('.seed.yaml','');
    roleIds.add(roleId);
    const tokens = extractMotifTokens(doc, roleId);
    for (const tok of tokens) {
      const st = stem(tok);
      if (!motifMap[st]) motifMap[st] = { roles: new Set(), originals: new Map() };
      motifMap[st].roles.add(roleId);
      if (!motifMap[st].originals.has(roleId)) motifMap[st].originals.set(roleId, new Set());
      motifMap[st].originals.get(roleId).add(tok);
    }
  }

  const exclusivityViolations = [];
  for (const [tok, owner] of Object.entries(config.exclusive)) {
    const tokStem = stem(tok);
    const entry = motifMap[tokStem];
    if (!entry) continue; // token not used anywhere → fine
    if (entry.roles.size > 1 || (entry.roles.size === 1 && !entry.roles.has(owner))) {
      exclusivityViolations.push({ token: tok, expected: owner, actual: Array.from(entry.roles) });
    }
  }

  // Overlap warnings (non-exclusive) – tokens appearing in >1 role and not ignored.
  const overlapWarnings = [];
  for (const [stemTok, entry] of Object.entries(motifMap)) {
    if (config.exclusive[stemTok]) continue; // already handled by original key (if any)
    if (entry.roles.size <= 1) continue;
    if (config.ignore.has(stemTok)) continue;
    if (stemTok.length < config.minTokenLength) continue;
    overlapWarnings.push({
      token: stemTok,
      roles: Array.from(entry.roles),
      originals: Array.from(entry.originals.entries()).map(([r,set]) => ({ role: r, forms: Array.from(set) }))
    });
  }

  overlapWarnings.sort((a,b)=> b.roles.length - a.roles.length);

  if (outputJson) {
    const out = { exclusivityViolations, overlapWarnings };
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log('\nMotif Validator Report');
    console.log('=======================' );
    if (exclusivityViolations.length === 0) {
      console.log('No exclusivity violations.');
    } else {
      console.log('\nExclusivity Violations:');
      for (const v of exclusivityViolations) {
        console.log(`  Token "${v.token}" expected only in ${v.expected} but found in: ${v.actual.join(', ')}`);
      }
    }

    if (overlapWarnings.length) {
      console.log('\nOverlap Warnings (non-fatal – review for distinctiveness):');
      for (const w of overlapWarnings) {
        console.log(`  Stem "${w.token}" appears in roles: ${w.roles.join(', ')} (forms: ${w.originals.map(o=> o.role+':'+o.forms.join('|')).join('; ')})`);
      }
    } else {
      console.log('\nNo non-exclusivity motif overlaps beyond ignore set.');
    }

    console.log('\nRoles scanned:', Array.from(roleIds).join(', '));
  }

  if (exclusivityViolations.length) process.exit(1);
}

main();
