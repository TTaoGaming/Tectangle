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

// WatchdogManager: evaluate telemetry envelopes against simple rules

export class WatchdogManager {
  constructor(rules){
    this.rules = Object.assign({
      pinch: { minDowns:1, maxSpecCancelRate:0.10, meanLatencyMin:60, meanLatencyMax:400 },
      gated: { maxDowns:0, maxUps:0 },
    }, rules||{});
  }

  check(label, env){
    const v = [];
    if(!env || env.__invalid){ v.push({ code:'ENV_INVALID', msg:'Telemetry envelope invalid', detail: env && env.errors }); return v; }
    if(label==='gated'){
      const r = this.rules.gated;
      if(env.downs>r.maxDowns) v.push({ code:'GATED_DOWNS', msg:`Expected no downs on gated, got ${env.downs}` });
      if(env.ups>r.maxUps) v.push({ code:'GATED_UPS', msg:`Expected no ups on gated, got ${env.ups}` });
    } else {
      const r = this.rules.pinch;
      if(env.downs<r.minDowns) v.push({ code:'PINCH_NO_DOWNS', msg:`Expected >=${r.minDowns} downs, got ${env.downs}`});
      if(env.specCancelRate>r.maxSpecCancelRate) v.push({ code:'SPEC_RATE', msg:`Spec cancel rate ${env.specCancelRate.toFixed(2)} over ${r.maxSpecCancelRate}`});
      if(env.meanDownLatency<r.meanLatencyMin || env.meanDownLatency>r.meanLatencyMax){ v.push({ code:'LATENCY_BAND', msg:`Mean down latency ${env.meanDownLatency}ms outside ${r.meanLatencyMin}-${r.meanLatencyMax}ms`}); }
    }
    return v;
  }
}
