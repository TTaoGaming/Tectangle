/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// Central feature flag access (environment or in-page overrides)
// Usage: if (flag('FEATURE_GAME_BRIDGE')) { ... }
// Allows tests to override via globalThis.__flags or process.env
export function flag(name, fallback=false){
  if(typeof globalThis !== 'undefined' && globalThis.__flags && name in globalThis.__flags){ return !!globalThis.__flags[name]; }
  if(typeof process !== 'undefined' && process.env && name in process.env){
    const v = process.env[name];
    return v === '1' || v === 'true' || v === 'on';
  }
  return fallback;
}
