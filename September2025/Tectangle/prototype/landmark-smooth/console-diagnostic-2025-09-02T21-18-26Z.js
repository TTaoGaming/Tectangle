/*
console-diagnostic-2025-09-02T21-18-26Z.js
Diagnostic helper for the landmark-smooth prototype.

Instructions:
1) Open your prototype page in the browser:
   /September2025/Tectangle/prototype/landmark-smooth/index-src.html
2) Open DevTools → Console.
3) Paste the entire contents of this file into the console and press Enter.
4) Inspect console output and use the helper functions exposed on window.__TECTANGLE_DIAG__:
   - window.__TECTANGLE_DIAG__.startCameraFallback()  // attempts CameraManager.start
   - window.__TECTANGLE_DIAG__.publishSyntheticFrame()
   - window.__TECTANGLE_DIAG__.publishSyntheticSmoothed()
   - window.__TECTANGLE_DIAG__.subscribeTest()
   - window.__TECTANGLE_DIAG__.unsubscribeAll()

5) After diagnosing, you can remove the helper via: delete window.__TECTANGLE_DIAG__

*/

(function(){
const ts = new Date().toISOString();
console.group(`[Tectangle diag ${ts}]`);
const statusEl = document.getElementById('status');
console.log('Status element text:', statusEl ? statusEl.textContent : 'NOT FOUND');
const mgrs = window.__MANAGERS__ || {};
console.log('window.__MANAGERS__ keys:', Object.keys(mgrs));
const registry = window.ManagerRegistry || (window.__MANAGERS__ && window.__MANAGERS__.ManagerRegistry) || null;
console.log('ManagerRegistry present:', !!registry);
function inspectInstance(inst) {
  if (!inst) return {present:false};
  let proto = inst && inst.constructor ? inst.constructor.name : typeof inst;
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(n => typeof inst[n] === 'function');
  return {present:true, type: String(proto), methods: methods.slice(0,40)};
}
const camera = mgrs.CameraManager || (registry && typeof registry.get === 'function' && registry.get('CameraManager')) || null;
const eventBus = mgrs.EventBusManager || mgrs.EventBus || (registry && registry.get && registry.get('EventBusManager')) || null;
const rawMgr = mgrs.LandmarkRawManager || (registry && registry.get && registry.get('LandmarkRawManager')) || null;
const smoothMgr = mgrs.LandmarkSmoothManager || (registry && registry.get && registry.get('LandmarkSmoothManager')) || null;
console.log('CameraManager:', inspectInstance(camera));
console.log('EventBusManager:', inspectInstance(eventBus));
console.log('LandmarkRawManager:', inspectInstance(rawMgr));
console.log('LandmarkSmoothManager:', inspectInstance(smoothMgr));
const subscriptions = {};
function addListener(bus, name, handler) {
  if (!bus) return null;
  try {
    if (typeof bus.addEventListener === 'function') {
      const unsub = bus.addEventListener(name, handler);
      return typeof unsub === 'function' ? unsub : (()=>{ try{ bus.removeEventListener && bus.removeEventListener(name, handler); } catch(e){}});
    }
    if (typeof bus.on === 'function') {
      bus.on(name, handler);
      return ()=>{ try{ bus.off && bus.off(name, handler); } catch(e){}};
    }
    if (typeof bus.subscribe === 'function') {
      bus.subscribe(name, handler);
      return ()=>{ try{ bus.unsubscribe && bus.unsubscribe(name, handler); } catch(e){}};
    }
  } catch (e) { console.warn('addListener error', e); }
  return null;
}
function subscribeTest() {
  subscriptions.raw = addListener(eventBus, 'landmark:raw', (env)=>console.log('[diag] landmark:raw', env));
  subscriptions.smoothed = addListener(eventBus, 'landmark:smoothed', (env)=>console.log('[diag] landmark:smoothed', env));
  subscriptions.cameraFrame = addListener(eventBus, 'camera:frame', (env)=>console.log('[diag] camera:frame', env));
  subscriptions.cameraParams = addListener(eventBus, 'camera:params', (env)=>console.log('[diag] camera:params', env));
  console.log('Diagnostic subscribers installed. Call window.__TECTANGLE_DIAG__.unsubscribeAll() to remove them.');
}
function unsubscribeAll() {
  for (const k in subscriptions) {
    try {
      const u = subscriptions[k];
      if (typeof u === 'function') u();
    } catch(e){ console.warn('unsubscribe error', e); }
    delete subscriptions[k];
  }
  console.log('All diagnostic subscribers removed');
}
window.__TECTANGLE_DIAG__ = {
  ts,
  showManagers: ()=> console.log('managers',Object.keys(mgrs)),
  camera, eventBus, rawMgr, smoothMgr,
  subscribeTest,
  unsubscribeAll,
  startCameraFallback: async function(){ if(!camera){ console.warn('no CameraManager available'); return null;} try{ const res = await camera.start({source:'webrtc', allowFallback:true, width:640, height:480, fps:30}); console.log('camera.start result',res); return res;}catch(e){ console.error('camera.start threw', e); return null; } },
  publishSyntheticFrame: function(){ const eb = eventBus || (window.__MANAGERS__ && (window.__MANAGERS__.EventBusManager || window.__MANAGERS__.EventBus)); if(!eb || typeof eb.publish !== 'function'){ console.warn('EventBus.publish not available'); return; } const frame = {frameId: Date.now()%100000, timestamp: Date.now(), width:640, height:480, payload:'synthetic' }; try{ eb.publish('camera:frame', frame); console.log('[diag] published synthetic camera:frame', frame); }catch(e){ console.warn('publish failed', e); } },
  publishSyntheticSmoothed: function(){ const eb = eventBus || (window.__MANAGERS__ && (window.__MANAGERS__.EventBusManager || window.__MANAGERS__.EventBus)); if(!eb || typeof eb.publish !== 'function'){ console.warn('EventBus.publish not available'); return; } const payload = { landmarks: [[0.5,0.5,0]], frameId: Date.now()%100000, timestamp: Date.now(), width:640, height:480 }; try{ eb.publish('landmark:smoothed', payload); console.log('[diag] published synthetic landmark:smoothed', payload); } catch(e){ console.warn('publish failed', e); } },
  dumpState: function(){ console.log('statusEl', statusEl ? statusEl.textContent : null); console.log('mgrKeys', Object.keys(mgrs)); console.log('camera',inspectInstance(camera)); console.log('eventBus', inspectInstance(eventBus)); console.log('rawMgr', inspectInstance(rawMgr)); console.log('smoothMgr', inspectInstance(smoothMgr)); },
};
console.log('Diagnostic helper installed: window.__TECTANGLE_DIAG__');
console.groupEnd();
})();