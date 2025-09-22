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

export function createHUD(doc){
  const el = {
    status: doc.getElementById('status'), fps: doc.getElementById('fps'),
    fsmR: doc.getElementById('fsmR'), fsmL: doc.getElementById('fsmL'),
    norm: doc.getElementById('norm'), pg: doc.getElementById('pg'),
    lat: doc.getElementById('lat'), downs: doc.getElementById('downs'), ups: doc.getElementById('ups'), specCancel: doc.getElementById('specCancel'), toiPred: doc.getElementById('toiPred'), toiErr: doc.getElementById('toiErr'),
    // debug per hand
    r_ix_raw: doc.getElementById('r_ix_raw'), r_ix_sm: doc.getElementById('r_ix_sm'), r_tx_raw: doc.getElementById('r_tx_raw'), r_tx_sm: doc.getElementById('r_tx_sm'), r_norms: doc.getElementById('r_norms'), r_ang: doc.getElementById('r_ang'), r_gate: doc.getElementById('r_gate'), r_hyst: doc.getElementById('r_hyst'),
    l_ix_raw: doc.getElementById('l_ix_raw'), l_ix_sm: doc.getElementById('l_ix_sm'), l_tx_raw: doc.getElementById('l_tx_raw'), l_tx_sm: doc.getElementById('l_tx_sm'), l_norms: doc.getElementById('l_norms'), l_ang: doc.getElementById('l_ang'), l_gate: doc.getElementById('l_gate'), l_hyst: doc.getElementById('l_hyst'),
    // outputs
    enterOut: doc.getElementById('enterOut'), exitOut: doc.getElementById('exitOut'), coneOut: doc.getElementById('coneOut'), minCutoffOut: doc.getElementById('minCutoffOut'), betaOut: doc.getElementById('betaOut'), dCutoffOut: doc.getElementById('dCutoffOut')
  };
  function status(msg){ if(el.status) el.status.textContent = msg; }
  function setPalmAngle(hand, ang, gate=true, cone){
    if(!el.pg) return;
        let label = '--';
    let state = 'unknown';
    if(typeof ang === 'number'){
      const deg = Math.round(ang);
      label = `${deg}deg`;
      if(gate === false){
        label += ' x';
        state = 'bad';
      } else {
        state = 'ok';
      }
    } else if(gate === false){
      state = 'bad';
    }
    el.pg.textContent = label;
    if(el.pg.dataset){
      el.pg.dataset.state = state;
      if(typeof cone === 'number') el.pg.dataset.cone = String(Math.round(cone));
    }
    const side = hand === 'Left' ? 'L' : 'R';
    const target = side === 'R' ? el.r_ang : el.l_ang;
    if(target){
      target.textContent = label;
      if(target.dataset){
        target.dataset.state = state;
        if(typeof cone === 'number') target.dataset.cone = String(Math.round(cone));
      }
    }
  }
  function updateRuntime({norm, gate, fps, snapshot, toi}){
    if(el.norm) el.norm.textContent = typeof norm === 'number' ? norm.toFixed(3) : '--';
    if(el.fps) el.fps.textContent = fps ? fps.toFixed(1) : '--';
    if(snapshot){
      if(el.lat) el.lat.textContent = snapshot.meanDownLatency || '--';
      if(el.downs) el.downs.textContent = snapshot.downs;
      if(el.ups) el.ups.textContent = snapshot.ups;
      if(el.specCancel) el.specCancel.textContent = (snapshot.specCancelRate * 100).toFixed(1) + '%';
    }
    if(el.toiPred) el.toiPred.textContent = toi && isFinite(toi) ? Math.round(toi) + ' ms' : '--';
    if(el.toiErr) el.toiErr.textContent = (snapshot && typeof snapshot.lastToiError === 'number') ? (snapshot.lastToiError | 0) + ' ms' : '--';
  }
  function setState(hand, state){ if(hand === 'Right'){ if(el.fsmR) el.fsmR.textContent = state; } else { if(el.fsmL) el.fsmL.textContent = state; } }
  function syncOutputs(doc){
    if(!doc) doc = document;
    if(el.enterOut) el.enterOut.textContent = (+doc.getElementById('enter').value).toFixed(2);
    if(el.exitOut) el.exitOut.textContent = (+doc.getElementById('exit').value).toFixed(2);
    if(el.coneOut) el.coneOut.textContent = (+doc.getElementById('cone').value).toFixed(0) + 'deg';
    if(el.minCutoffOut) el.minCutoffOut.textContent = (+doc.getElementById('minCutoff').value).toFixed(1);
    if(el.betaOut) el.betaOut.textContent = (+doc.getElementById('beta').value).toFixed(3);
    if(el.dCutoffOut) el.dCutoffOut.textContent = (+doc.getElementById('dCutoff').value).toFixed(1);
  }
  function debugUpdate(hand, d){
    const side = hand === 'Left' ? 'L' : 'R';
    const pick = (r, l) => side === 'R' ? r : l;
    const pair = (a, b) => (typeof a === 'number' && typeof b === 'number') ? `${a.toFixed(3)}, ${b.toFixed(3)}` : '--';
    const ix_raw = pick(el.r_ix_raw, el.l_ix_raw), ix_sm = pick(el.r_ix_sm, el.l_ix_sm);
    const tx_raw = pick(el.r_tx_raw, el.l_tx_raw), tx_sm = pick(el.r_tx_sm, el.l_tx_sm);
    const norms = pick(el.r_norms, el.l_norms), gate = pick(el.r_gate, el.l_gate);
    if(ix_raw) ix_raw.textContent = pair(d.ixRaw, d.iyRaw);
    if(ix_sm) ix_sm.textContent = pair(d.ixSm, d.iySm);
    if(tx_raw) tx_raw.textContent = pair(d.txRaw, d.tyRaw);
    if(tx_sm) tx_sm.textContent = pair(d.txSm, d.tySm);
    if(norms) norms.textContent = `${d.rawNorm.toFixed(3)} / ${d.norm.toFixed(3)}`;
    if(gate) gate.textContent = d.gate ? 'OK' : 'X';
  }
  return { status, setPalmAngle, updateRuntime, setState, syncOutputs, debugUpdate };
}

