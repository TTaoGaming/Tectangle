// Report champion subsystems: present vs missing
// Usage: node HiveFleetObsidian/tools/champions_status.mjs

import fs from 'node:fs';
import path from 'node:path';
import { champions as registry, pascalFor } from './champion_registry.mjs';

const base = fs.existsSync('HiveFleetObsidian') ? 'HiveFleetObsidian' : 'hive_fleet_obsidian';

const champions = [
  { id: 'silk_scribe', name: 'Silk Scribe (Scribe)', checks: [
    path.join(base,'tools','append_history.mjs'),
    path.join(base,'history','hive_history.jsonl'),
  ]},
  { id: 'honeycomb_smith', name: 'Honeycomb Smith (Scaffold)', checks: [
    path.join(base,'tools','honeycomb_smith.mjs'),
    path.join(base,'honeycomb','honeycomb_index.md'),
  ]},
  { id: 'web_cartographer', name: 'Web Cartographer (Reorient)', checks: [
    path.join(base,'tools','web_cartographer.mjs'),
    path.join(base,'cartography','web_map.md'),
  ]},
  { id: 'thread_sovereign', name: 'Thread Sovereign (Exploit)', checks: [
    path.join(base,'tools','bootstrap.mjs'),
  ]},
  { id: 'faultline_seeker', name: 'Faultline Seeker (Explore)', checks: [
    path.join(base,'tools','portable_replay_from_trace.mjs'),
    path.join(base,'landmarks','right_hand_normal.landmarks.jsonl'),
  ]},
  { id: 'prism_magus', name: 'Prism Magus (Pivot)', checks: [
    path.join(base,'tools','prism_reframe.mjs'),
  ]},
  { id: 'lattice_steward', name: 'Lattice Steward (Stability)', checks: [
    path.join(base,'tools','run_frozen_smoke.mjs'),
    path.join('HiveFleetObsidian','config','smoke_expectations.json'),
  ]},
  { id: 'window_hunter', name: 'Window Hunter (Finisher)', checks: [
    path.join(base,'tools','pack_portable.mjs'),
  ]},
  { id: 'safebreaker', name: 'Safebreaker (Outlaw / Rule-Unlock)', checks: [
    // expected: feature-flag toggles + rules override harness
    path.join(base,'tools','safebreaker_pivot.mjs'),
  ]},
  { id: 'first_principles', name: 'First Principles (Everyman / Clarity)', checks: [
    // expected: summarizer that reduces a doc/code to plain-language core
    path.join(base,'tools','first_principles_summarize.mjs'),
  ]},
  { id: 'swarm_jester', name: 'Swarm Jester (Jester / Creative Breaker)', checks: [
    // expected: idea-generator / alternative probes
    path.join(base,'tools','swarm_jester_ideas.mjs'),
  ]},
  { id: 'concord_weaver', name: 'Concord Weaver (Lover / Adoption & Fit)', checks: [
    // expected: UX/readme adoption checklist generator
    path.join(base,'tools','concord_weaver_checklist.mjs'),
  ]},
  { id: 'signal_warden', name: 'Signal Warden (Innocent / Safety & Integrity)', checks: [
    // expected: safety defaults audit + telemetry opt-in validator
    path.join(base,'tools','signal_warden_audit.mjs'),
  ]},
  { id: 'shadow_auditor', name: 'Shadow Auditor (Shadow / Red-Team)', checks: [
    // expected: red-team probes harness
    path.join(base,'tools','shadow_auditor_probes.mjs'),
  ]},
];

function spaceOk(id){
  const pas = pascalFor(id);
  const p1 = path.join(base,'honeycomb','champions', pas, 'README.md');
  if (fs.existsSync(p1)) return true;
  // legacy snake_case
  const p2 = path.join(base,'honeycomb','champions', id, 'README.md');
  return fs.existsSync(p2);
}

function statusOf(ch) {
  const missing = ch.checks.filter(p => !fs.existsSync(p));
  const present = ch.checks.length > 0 && missing.length === 0;
  return { id: ch.id, name: ch.name, present, missing };
}

const report = champions.map(statusOf);
for (const r of report) {
  const toolsMark = r.present ? 'OK ' : 'MISS';
  const spaceMark = spaceOk(r.id) ? 'OK ' : 'MISS';
  console.log(`${toolsMark} tools | ${spaceMark} space - ${r.name}`);
  if (!r.present && r.missing.length) {
    for (const m of r.missing) console.log(`  - missing: ${m}`);
  }
}
