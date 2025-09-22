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

// AnalysisRecorder: capture detailed per-frame analysis and event deltas into JSONL
// Lines schema (mixed):
// - { meta: { sha, source, cfg } }
// - { t, kind:'frame', hand, state, gate, ang, norm, rawNorm, vRel, aRel,
//     toiPredV, toiPredA, toiPredAbsV, toiPredAbsA,
//     raw: { indexTip, thumbTip, wrist, indexMCP, pinkyMCP },
//     smoothed: { indexTip, thumbTip } }
// - { t, kind:'event', type:'down'|'up'|'cancel'|'hold'|'confirm', hand, spec,
//     toiPredV, toiPredA, toiPredAbsV, toiPredAbsA,
//     toiActualEnterAbs }
export class AnalysisRecorder {
  constructor(){ this.lines=[]; this.started=false; }
  start(meta){ if(this.started) return; this.started=true; this.lines.push(JSON.stringify({ meta })); }
  frame(obj){ if(!this.started) return; this.lines.push(JSON.stringify({ kind:'frame', ...obj })); }
  event(obj){ if(!this.started) return; this.lines.push(JSON.stringify({ kind:'event', ...obj })); }
  stop(){ this.started=false; }
  get(){ return [...this.lines]; }
  clear(){ this.lines.length = 0; this.started = false; }
  download(){ const blob=new Blob([this.lines.join('\n')+'\n'],{type:'application/jsonl'}); const url=URL.createObjectURL(blob); const a=Object.assign(document.createElement('a'),{href:url,download:`analysis_${new Date().toISOString().replace(/[:.]/g,'-')}.jsonl`}); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
}
