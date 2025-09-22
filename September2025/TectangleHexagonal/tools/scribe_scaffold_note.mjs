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

import { spawnSync } from 'node:child_process';

function srl(snapshot, metric, lesson){
  const r = spawnSync('node', [
    'HiveFleetObsidian/tools/append_history.mjs',
    '--snapshot', snapshot,
    '--metric', metric,
    '--lesson', lesson,
    '--type','srl'
  ], { stdio:'inherit' });
  if(r.status!==0) console.error('[scribe] append failed');
}

srl('Scaffolded ports/adapters for Sigil Rings lab', 'scaffold+1', 'HandInputPort & RingRenderPort; canvas adapter + lab page');
srl('Vision logged: education playground, multiplayer, tilt rings', 'vision', 'Physics + Net ports to follow; bone-ratio hash & greedy neighbor for hand ID');
