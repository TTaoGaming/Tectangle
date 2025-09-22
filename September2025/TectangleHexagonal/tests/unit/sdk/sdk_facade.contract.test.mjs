import assert from 'assert';
import { HexInput } from '../../../src/sdk/hexInputFacade.js';

// Fake shell to test facade contract without importing app layer
function createFakeShell(){
  const listeners = new Set();
  const actionListeners = new Set();
  const snapshot = [];
  const state = { seats: { P1:null, P2:null, P3:null, P4:null }, hands: {}, telemetry: null, lastFrame: null };
  const shell = {
    onEvent(h){ listeners.add(h); return ()=>listeners.delete(h); },
    onAction(h){ actionListeners.add(h); return ()=>actionListeners.delete(h); },
    startCamera(){ return Promise.resolve({ started:true }); },
    startVideoUrl(){ return Promise.resolve({ started:true }); },
    stop(){ return { stopped:true }; },
    updatePinchConfig(part){ shell._lastPinchCfg = part; return { applied:true, part }; },
    getRichSnapshot(){ return snapshot.slice(); },
    getState(){ return JSON.parse(JSON.stringify(state)); },
    // test hooks
    _emit(evt){ listeners.forEach(h=>{ try{ h(evt); }catch{} }); },
    _act(evt){ actionListeners.forEach(h=>{ try{ h(evt); }catch{} }); },
    _pushSnapshot(entry){ snapshot.push(entry); },
    _setSeat(seat, v){ state.seats[seat] = v; },
  };
  return shell;
}

describe('Hex SDK Facade v0 — contract', () => {
  it('creates via DI and relays events/actions', async () => {
    const fake = createFakeShell();
    const api = HexInput.create({ factories: { createAppShell: () => fake } });
    let seenEvt = null; let seenAction = null;
    const offEvt = api.on(e => { seenEvt = e; });
    const offAct = api.onAction(a => { seenAction = a; });

    fake._emit({ type:'pinch:confirm', t: 1.23, hand:'Right', handId:'r1' });
    fake._act({ type:'keyboard:press', key:'KeyA', seat:'P1' });

    assert.ok(seenEvt && seenEvt.type === 'pinch:confirm');
    assert.ok(seenAction && seenAction.type === 'keyboard:press' && seenAction.key === 'KeyA');

    offEvt(); offAct();
  });

  it('passes through updates and state/snapshot', async () => {
    const fake = createFakeShell();
    fake._pushSnapshot({ hand:'Right', seat:'P1', norm:0.42 });
    fake._setSeat('P1', { hand:'Right', handId:'r1' });
    const api = HexInput.create({ factories: { createAppShell: () => fake } });

    const res = api.updatePinchConfig({ enterThresh:0.4 });
    assert.ok(res && res.applied === true);
    assert.deepStrictEqual(fake._lastPinchCfg, { enterThresh:0.4 });

    const snap = api.getRichSnapshot();
    assert.ok(Array.isArray(snap) && snap.length === 1 && snap[0].seat === 'P1');

    const s = api.getState();
    assert.ok(s && s.seats && Object.prototype.hasOwnProperty.call(s.seats, 'P1'));
  });

  it('supports on(type, handler) without breaking on(handler)', async () => {
    const fake = createFakeShell();
    const api = HexInput.create({ factories: { createAppShell: () => fake } });

    let seenGeneric = 0; let seenTypedDown = 0; let seenTypedUp = 0;
    const offG = api.on(e => { seenGeneric++; });
    const offDown = api.on('pinch:down', e => { if(e && e.type === 'pinch:down') seenTypedDown++; });
    const offUp = api.on('pinch:up', e => { if(e && e.type === 'pinch:up') seenTypedUp++; });

    fake._emit({ type:'pinch:down', seat:'P1' });
    fake._emit({ type:'pinch:up', seat:'P1' });
    fake._emit({ type:'keyboard:press', key:'Space' });

    assert.strictEqual(seenGeneric, 3, 'generic should see all events');
    assert.strictEqual(seenTypedDown, 1, 'typed down sees only down');
    assert.strictEqual(seenTypedUp, 1, 'typed up sees only up');

    // Unsubscribe typed down and emit again
    offDown();
    fake._emit({ type:'pinch:down', seat:'P1' });
    assert.strictEqual(seenTypedDown, 1, 'typed down unsubscribed');

    // Cleanup
    offG(); offUp();
  });
});
