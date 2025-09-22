// WEBWAY:ww-2025-012 TDD: seat assignment on first two pinch:down events
// This test uses a minimal fake event bus to verify assignment logic we will factor into v8 console or a helper.

import assert from 'node:assert';

describe('seat assignment simple helper', () => {
  function createSeatAssigner(){
    const seats = { P1:null, P2:null };
    function onEvent(ev){
      if(ev.type==='pinch:down'){
        if(!seats.P1){ seats.P1 = ev.handKey || 'H?'; }
        else if(!seats.P2 && seats.P1 !== ev.handKey){ seats.P2 = ev.handKey || 'H?'; }
      }
    }
    return { seats, onEvent };
  }

  it('first two distinct pinch:down map to P1/P2', () => {
    const sa = createSeatAssigner();
    sa.onEvent({ type:'pinch:down', handKey:'Hleft' });
    sa.onEvent({ type:'pinch:down', handKey:'Hleft' }); // duplicate should not claim P2
    sa.onEvent({ type:'pinch:down', handKey:'Hright' });
  assert.strictEqual(sa.seats.P1, 'Hleft');
  assert.strictEqual(sa.seats.P2, 'Hright');
  });
});
