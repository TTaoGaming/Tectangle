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

export class Beeper { constructor(){ this.ctx=null; this.osc=null; this.gain=null; } ensure(){ if(!this.ctx){ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); } } down(){ this.ensure(); if(this.osc) return; this.osc=this.ctx.createOscillator(); this.gain=this.ctx.createGain(); this.osc.frequency.value=440; this.gain.gain.value=0.1; this.osc.connect(this.gain).connect(this.ctx.destination); this.osc.start(); } up(){ if(this.osc){ this.osc.stop(); this.osc.disconnect(); this.gain.disconnect(); this.osc=null; this.gain=null; } } }

