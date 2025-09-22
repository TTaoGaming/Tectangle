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

// CalibrationAdapter (shim): per-user, per-hand, per-finger calibration for negative-latency
// Not wired; provides a small API and offline helpers to compute offsets from analysis JSONL.
// Contract
// - Inputs: analysis JSONL lines (from AnalysisRecorder) for a session where user pinches on metronome beats.
// - Outputs: per hand+finger recommended lead offset (ms) to apply to predicted TOI (negative values = earlier).
// - Error modes: returns empty map on malformed input.

export class CalibrationAdapter {
  constructor(){ this.sessions = []; }
  startSession(meta){ this.sessions.push({ meta, events: [], frames: [] }); }
  pushLine(line){ try{ const obj = typeof line==='string' ? JSON.parse(line) : line; if(!this.sessions.length) this.startSession({}); const s = this.sessions[this.sessions.length-1]; if(obj.kind==='frame') s.frames.push(obj); else if(obj.kind==='event') s.events.push(obj); }catch{} }
  endSession(){}

  // Compute per-hand offsets by aligning predicted TOI at down with actual time-to-minimum-distance from down (within a 300ms window)
  computeOffsets(){
    const out = new Map(); // key: hand, value: { count, meanErr }
    for(const s of this.sessions){
      // Build quick index of frames by time
      const byT = new Map(); for(const f of s.frames){ byT.set(f.t, f); }
      for(let i=0;i<s.events.length;i++){
        const ev = s.events[i]; if(ev.type!=='down') continue; const hand = ev.hand||'Right';
        // Actual: time from down to min(norm) over next 300ms (frames only)
        const t0 = ev.t; let minNorm = Infinity, tMin = null;
        for(const f of s.frames){ if(f.hand!==hand) continue; if(f.t < t0) continue; if(f.t - t0 > 300) break; if(typeof f.norm==='number' && f.norm < minNorm){ minNorm=f.norm; tMin=f.t; } }
        if(tMin==null) continue; const actual = tMin - t0; // ms
        const pred = (typeof ev.toiPredV==='number' && isFinite(ev.toiPredV)) ? ev.toiPredV : null;
        if(pred==null) continue; const err = actual - pred; // positive => predicted earlier (desired)
        const cur = out.get(hand) || { count:0, sumErr:0 };
        cur.count++; cur.sumErr += err; out.set(hand, cur);
      }
    }
    const offsets = {}; for(const [hand, v] of out){ if(v.count>0){ const meanErr = v.sumErr / v.count; // target a small negative-mean lead (e.g., +20ms earlier)
      // choose offset to push predicted earlier by an extra 20ms beyond mean alignment
      offsets[hand] = Math.round(meanErr + 20); // ms; apply as subtract from scheduled time
    } }
    return offsets; // { Right: 35, Left: 28 }
  }
}
