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

export class GoldenRecorder {
  constructor(){ this.lines=[]; this.started=false; }
  start(meta){ if(this.started) return; this.started=true; this.lines.push(JSON.stringify({meta})); }
  frame(obj){ if(!this.started) return; this.lines.push(JSON.stringify(obj)); }
  download(){ const blob=new Blob([this.lines.join('\n')+'\n'],{type:'application/jsonl'}); const url=URL.createObjectURL(blob); const a=Object.assign(document.createElement('a'),{href:url,download:`pinch_golden_${new Date().toISOString().replace(/[:.]/g,'-')}.jsonl`}); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
}

