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

export class MidiOut { constructor(){ this.out=null; }
  async init(){ try{ const access=await navigator.requestMIDIAccess(); this.out=[...access.outputs.values()][0]||null; }catch{} }
  send(status,data1,data2){ if(this.out) this.out.send([status,data1,data2]); }
}

