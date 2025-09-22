import assert from 'assert';
import { HexInput } from '../../../src/sdk/hexInputFacade.js';

function createFakeShell(){
  const listeners = new Set();
  const state = { seats: { P1:null, P2:null }, lastFrame:null };
  const shell = {
    onEvent(h){ listeners.add(h); return ()=>listeners.delete(h); },
    getState(){ return JSON.parse(JSON.stringify(state)); },
    // Simulate router pairing: first confirm claims P1
    _pairFirst(evt){
      if(evt.type==='pinch:confirm' && !state.seats.P1){ state.seats.P1 = { hand: evt.hand, handId: evt.handId||'h1' }; }
      listeners.forEach(h=>{ try{ h({ ...evt, seat: state.seats.P1? 'P1': null }); }catch{} });
    }
  };
  return shell;
}

describe('SDK — controller pairing & persistence (simulated)', () => {
  it('claims P1 on first pinch:confirm and exposes in getState', async () => {
    const fake = createFakeShell();
    const api = HexInput.create({ factories: { createAppShell: () => fake } });
    let lastSeat = null;
    const off = api.on(e => { if(e.type==='pinch:confirm') lastSeat = e.seat||null; });
    fake._pairFirst({ type:'pinch:confirm', t: 2.0, hand:'Right', handId:'r1' });
    off();

    const st = api.getState();
    assert.strictEqual(lastSeat, 'P1');
    assert.ok(st.seats.P1 && st.seats.P1.hand === 'Right');
  });
});
