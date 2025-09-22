#!/usr/bin/env node
/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Exercise the CLI entry point end-to-end
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Append SRL (Silk Scribe) line documenting tiered hooks + caching adoption.
// Mirrors patterns in existing *freeze* and *fetch_dino_vendor* scripts.
import { spawnSync } from 'node:child_process';

function appendSRL(snapshot, metric, lesson){
  const r = spawnSync(process.execPath, ['HiveFleetObsidian/tools/append_history.mjs', '--type','srl', '--snapshot', snapshot, '--metric', metric, '--lesson', lesson], { stdio:'inherit' });
  if((r.status ?? 1) !== 0) console.warn('[tiered-hooks] SRL append exit code', r.status);
}

appendSRL('Adopted tiered hooks (cached boundary + focused tests + strict pre-push)', 'ops+1', 'Faster commits (<3s) with daily full golden verification');
appendSRL('Added depcruise hash cache & daily workflow', 'quality+cache', 'Pre-commit skip when no structural change; daily ensures drift detection');