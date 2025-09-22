/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-17T00:00-06:00
Expires: 2025-09-24T00:00-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// WEBWAY:ww-2025-031: Hex Facade SDK (v0)
// Purpose: Provide a single import/export that app authors can use without touching internals.
// Contract (v0):
//   const api = HexInput.create(opts?)
//   api.startCamera(videoEl)
//   api.startVideoUrl(videoEl, url)
//   api.stop(videoEl?)
//   const off = api.on(handler) // receives events from AppShell.onEvent
//   api.updatePinchConfig(part)
//   api.getRichSnapshot()
// Notes: Designed for DI in tests via opts.factories.createAppShell
// Boundary rule: SDK must NOT import app layer directly. No static imports of ../app/* here.

export const HexInput = {
  /**
   * Create a Hex Input instance.
   * @param {object} opts
   * @param {object} [opts.factories]
   * @param {Function} [opts.factories.createAppShell] - dependency injection for tests
   * @param {Array<string>} [opts.seats] - default ['P1','P2','P3','P4']
   */
  create(opts = {}){
    const factories = opts.factories || {};
    let createAppShell = factories.createAppShell;
    // Optional browser fallback: allow host app to expose a global without static import
    if(!createAppShell && typeof window !== 'undefined' && window.HexAppShell && typeof window.HexAppShell.create === 'function'){
      createAppShell = window.HexAppShell.create;
    }
    if(typeof createAppShell !== 'function'){
      throw new Error('HexInput facade requires factories.createAppShell (DI). The SDK does not import appShell to respect hex boundaries.');
    }
  const shell = createAppShell({ seats: opts.seats || ['P1','P2','P3','P4'] });

    // WEBWAY:ww-2025-074: typed + generic event handlers
    const genericHandlers = new Set();
    const typedHandlers = new Map(); // type -> Set<handler>
    const offShell = shell.onEvent((evt)=>{
      // Dispatch to generic handlers
      genericHandlers.forEach(h=>{ try{ h(evt); }catch{} });
      // Dispatch to typed handlers (if event has a type)
      const t = evt && typeof evt.type === 'string' ? evt.type : null;
      if(t && typedHandlers.has(t)){
        typedHandlers.get(t).forEach(h=>{ try{ h(evt); }catch{} });
      }
    });

    return {
      async startCamera(videoEl){ return shell.startCamera(videoEl); },
      async startVideoUrl(videoEl, url){ return shell.startVideoUrl(videoEl, url); },
      stop(videoEl){ try{ offShell && offShell(); }catch{} return shell.stop(videoEl); },
      /**
       * Subscribe to events. Overloads:
       *  - on(handler)
       *  - on(type, handler)
       */
      on(typeOrHandler, maybeHandler){
        // Overload: on(handler)
        if(typeof typeOrHandler === 'function' && !maybeHandler){
          const h = typeOrHandler;
          genericHandlers.add(h);
          return ()=>genericHandlers.delete(h);
        }
        // Overload: on(type, handler)
        if(typeof typeOrHandler === 'string' && typeof maybeHandler === 'function'){
          const type = typeOrHandler; const h = maybeHandler;
          if(!typedHandlers.has(type)) typedHandlers.set(type, new Set());
          const bucket = typedHandlers.get(type);
          bucket.add(h);
          return ()=>{
            bucket.delete(h);
            if(bucket.size === 0) typedHandlers.delete(type);
          };
        }
        throw new Error('HexInput.on expects a handler or (type, handler)');
      },
      onAction(handler){ return shell.onAction ? shell.onAction(handler) : (()=>{}); },
      updatePinchConfig(part){ return shell.updatePinchConfig ? shell.updatePinchConfig(part) : null; },
  updatePredictionConfig(part){ return shell.updatePredictionConfig ? shell.updatePredictionConfig(part) : null; },
  updateConsensusConfig(part){ return shell.updateConsensusConfig ? shell.updateConsensusConfig(part) : null; },
      getRichSnapshot(){ return shell.getRichSnapshot ? shell.getRichSnapshot() : []; },
      getState(){ return shell.getState ? shell.getState() : { }; },
      // WEBWAY:ww-2025-043: Seat config facade (per-seat presets and params)
      getSeatConfig(seat){ return shell.getSeatConfig ? shell.getSeatConfig(seat) : null; },
      setSeatConfig(seat, partial){ return shell.setSeatConfig ? shell.setSeatConfig(seat, partial) : null; },
      setSeatPreset(seat, presetId){ return shell.setSeatPreset ? shell.setSeatPreset(seat, presetId) : null; },
      // Expose underlying router/hsm for advanced users (documented as unstable)
      _unsafe: { shell }
    };
  }
};

export default HexInput;
