// WEBWAY:ww-2025-001: unit guard for simple SDK entry
import assert from 'assert';
import { createSpatialInput, FEATURE_FLAG_SPATIAL_SDK_SIMPLE } from '../../../../src/index.js';

function fakeShell(){
  const handlers = new Set();
  return {
    startCamera: async ()=>true,
    startVideoUrl: async ()=>true,
    stop: ()=>true,
    onEvent: (h)=>{ handlers.add(h); return ()=>handlers.delete(h); },
    updatePinchConfig: ()=>{},
    getRichSnapshot: ()=>[],
    getState: ()=>({ ok: true })
  };
}

describe('SDK entry shape', function(){
  it('exports factory and flag', function(){
    assert.strictEqual(typeof createSpatialInput, 'function');
    assert.strictEqual(typeof FEATURE_FLAG_SPATIAL_SDK_SIMPLE, 'string');
  });

  it('creates instance with DI and basic methods', async function(){
    const sdk = createSpatialInput({ factories: { createAppShell: ()=> fakeShell() } });
    assert.strictEqual(typeof sdk.startCamera, 'function');
    assert.strictEqual(typeof sdk.startVideoUrl, 'function');
    assert.strictEqual(typeof sdk.stop, 'function');
    assert.strictEqual(typeof sdk.on, 'function');
    assert.strictEqual(typeof sdk.updatePinchConfig, 'function');
    assert.strictEqual(typeof sdk.getRichSnapshot, 'function');
    assert.strictEqual(typeof sdk.getState, 'function');
    await sdk.startCamera({});
    const off = sdk.on(()=>{}); off();
  });
});
