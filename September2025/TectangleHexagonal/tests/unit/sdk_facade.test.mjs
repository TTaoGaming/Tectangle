import assert from 'assert';
import { HexInput } from '../../src/sdk/hexInputFacade.js';

function makeFakeShell(){
  const listeners = new Set();
  return {
    startCamera: async()=>{},
    startVideoUrl: async()=>{},
    stop: ()=>{},
    onEvent: (h)=>{ listeners.add(h); return ()=>listeners.delete(h); },
    onAction: (h)=>{ listeners.add(h); return ()=>listeners.delete(h); },
    updatePinchConfig: (p)=>({ ...p }),
    getRichSnapshot: ()=>[{ hand:'Right', norm:0.5, velocity:-0.1 }],
    getState: ()=>({ seats:{}, hands:{} }),
    _emit(e){ listeners.forEach(fn=>fn(e)); }
  };
}

describe('Hex SDK Facade v0', ()=>{
  it('creates API and relays events', ()=>{
    const fake = makeFakeShell();
    const api = HexInput.create({ factories: { createAppShell: ()=>fake } });
    let got=null; const off = api.on(e=>{ got=e; });
    fake._emit({ type:'pinch:down', t:123, hand:'Right' });
    assert.ok(got && got.type==='pinch:down', 'should relay pinch events');
    off();
  });
  it('exposes getRichSnapshot', ()=>{
    const fake = makeFakeShell();
    const api = HexInput.create({ factories: { createAppShell: ()=>fake } });
    const snap = api.getRichSnapshot();
    assert.ok(Array.isArray(snap) && snap.length>0, 'rich snapshot present');
  });
  it('updatePinchConfig passes through', ()=>{
    const fake = makeFakeShell();
    const api = HexInput.create({ factories: { createAppShell: ()=>fake } });
    const cfg = api.updatePinchConfig({ enterThresh:0.42 });
    assert.equal(cfg.enterThresh, 0.42);
  });
});
