// WEBWAY:ww-2025-094 clutch FSM v1
// Contract:
// input: scores { open: number, fist: number } plus debounce/hysteresis params
// output: state { idle|primed|armed|active } and transitions

export function createClutchFSM(opts={}){
  const cfg = {
    enter: 0.75,    // score to enter primed (open palm)
    exit: 0.55,     // score to exit primed back to idle
    armMinMs: 120,  // dwell time after primed before armed
    cooldownMs: 200,// block re-arm after release
    now: ()=> performance.now(),
    ...opts,
  };
  let state = 'idle';
  let tPrimed = 0, tCooldownUntil = 0;
  function step(scores){
    const t = cfg.now();
    const open = scores?.open ?? 0;
    const fist = scores?.fist ?? 0;

    // cooldown gate
    if(t < tCooldownUntil){ return { state, primed: state==='primed'||state==='armed', armed: state==='armed', open, fist }; }

    switch(state){
      case 'idle':
        if(open >= cfg.enter){ state='primed'; tPrimed=t; }
        break;
      case 'primed':
        if(open < cfg.exit){ state='idle'; tPrimed=0; }
        else if(t - tPrimed >= cfg.armMinMs){ state='armed'; }
        break;
      case 'armed':
        if(open < cfg.exit){ state='idle'; tCooldownUntil = t + cfg.cooldownMs; }
        break;
    }
    return { state, primed: state==='primed'||state==='armed', armed: state==='armed', open, fist };
  }
  function reset(){ state='idle'; tPrimed=0; tCooldownUntil=0; }
  return { step, reset, get state(){ return state; } };
}
