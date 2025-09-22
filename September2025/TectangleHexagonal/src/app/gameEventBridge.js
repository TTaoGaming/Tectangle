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

// GameEventBridge: maps pinch events + wrist orientation to abstract game actions.
// WEBWAY:ww-2025-006: GameEventBridge scaffold (expires 2025-10-07)

/* Contract
Inputs: pinch events { type:'pinch:down'|'pinch:up', t, hand, handId, seat, frame? }
Orientation source: wrist quaternion or fallback planar rotation (frame.wristRotZ)
Outputs: action events { type:'action', action:'BTN_PRIMARY'|'BTN_RELEASE', seat, hand, t, orientBucket }
*/

import { loadGameProfile, listGameProfiles, registerGameProfile as registerProfile } from './gameProfiles/index.js';

function noop(){ /* no-op */ }

function makeTelemetryHooks(telemetry){
  if(!telemetry || typeof telemetry !== 'object'){
    return { record: noop };
  }
  if(typeof telemetry === 'function'){
    return { record: telemetry };
  }
  const record = telemetry.record && typeof telemetry.record === 'function' ? telemetry.record.bind(telemetry) : noop;
  return Object.assign({ record }, telemetry);
}

function toArray(value){
  if(value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function matchesRule(when, ctx){
  if(!when) return true;
  if(when.type && when.type !== ctx.type) return false;
  if(when.hand && when.hand !== ctx.hand) return false;
  if(when.seat && when.seat !== ctx.seat) return false;
  if(when.seats && Array.isArray(when.seats) && !when.seats.includes(ctx.seat)) return false;
  if(when.orientBucket && when.orientBucket !== ctx.orientBucket) return false;
  if(when.orientBuckets && Array.isArray(when.orientBuckets) && !when.orientBuckets.includes(ctx.orientBucket)) return false;
  if(typeof when.orientDegMin === 'number' && ctx.orientDeg < when.orientDegMin) return false;
  if(typeof when.orientDegMax === 'number' && ctx.orientDeg > when.orientDegMax) return false;
  if(typeof when.custom === 'function' && when.custom(ctx) !== true) return false;
  return true;
}

function normalizeAction(action, base){
  if(action == null) return null;
  if(typeof action === 'string'){
    return Object.assign({}, base, { action });
  }
  if(typeof action === 'object'){
    const next = Object.assign({}, base, action);
    if(!next.action) next.action = base.action || 'UNSPECIFIED';
    return next;
  }
  return null;
}

export function createGameEventBridge(options={}){
  const C = Object.assign({
    primaryAction: 'BTN_PRIMARY',
    releaseAction: 'BTN_RELEASE',
    // orientation buckets in degrees (Z rotation or derived facing) -> logical mapping
    buckets: [
      { name:'UP', min:-45, max:45 },
      { name:'RIGHT', min:45, max:135 },
      { name:'DOWN', min:135, max:225 },
      { name:'LEFT', min:225, max:315 }
    ],
    normalizeAngle: a => { let x = a % 360; if(x<0) x+=360; return x; },
    seatFallback: seat => seat || null,
    includeOrientation: true,
    profile: options.profile || 'legacy-primary',
    telemetry: null
  }, options);

  const telemetry = makeTelemetryHooks(C.telemetry);

  const subs = new Set();
  function emit(e){ subs.forEach(h=>{ try{ h(e); }catch{} }); }

  let profile = loadGameProfile(C.profile);

  function setProfile(next){
    try {
      profile = loadGameProfile(next);
      telemetry.record({ kind:'profile:set', profileId: profile.id, label: profile.label });
      return profile;
    } catch(err){
      telemetry.record({ kind:'profile:error', error: err && err.message, request: next });
      throw err;
    }
  }

  function bucketFor(angleDeg){
    const a = C.normalizeAngle(angleDeg);
    for(const b of C.buckets){
      const min = C.normalizeAngle(b.min);
      const max = C.normalizeAngle(b.max);
      // handle wrap by normalizing comparisons
      if(min <= max){ if(a>=min && a<max) return b.name; }
      else { if(a>=min || a<max) return b.name; }
    }
    return 'UP';
  }

  function orientationFromFrame(frame){ // WEBWAY:ww-2025-006 prefer middleMCP for orientation (expires 2025-10-07)
    if(!C.includeOrientation || !frame) return null;
    // For now derive a simple planar rotation if wrist + indexMCP + pinkyMCP available.
    // Vector wrist->indexMCP defines reference; angle relative to +X axis.
    try {
      const ref = frame.middleMCP || frame.indexMCP;
      if(frame.wrist && ref){
        const dx = ref[0]-frame.wrist[0];
        const dy = ref[1]-frame.wrist[1];
        const ang = Math.atan2(dy, dx) * 180/Math.PI; // degrees
        return C.normalizeAngle(ang);
      }
    } catch {}
    return null;
  }

  function applyProfile(evt, ctx){
    const actions = [];
    const rules = Array.isArray(profile.rules) ? profile.rules : [];
    for(const rule of rules){
      if(!matchesRule(rule.when, ctx)) continue;
      const emitted = typeof rule.emit === 'function' ? rule.emit(evt, ctx, profile) : rule.emit;
      const arr = toArray(emitted);
      for(const part of arr){
        const base = {
          type: 'action',
          action: C.primaryAction,
          seat: ctx.seat,
          hand: ctx.hand,
          handId: ctx.handId,
          t: ctx.t,
          orientBucket: ctx.orientBucket,
          orientDeg: ctx.orientDeg,
          profileId: profile.id,
          profileLabel: profile.label,
          ruleId: rule.id,
          payload: null,
          meta: profile.params || null
        };
        const normalized = normalizeAction(part, base);
        if(!normalized) continue;
        if(normalized.payload == null && part && part.payload !== undefined){
          normalized.payload = part.payload;
        }
        if(normalized.action === 'BTN_PRIMARY' && evt.type === 'pinch:up'){
          // maintain backwards compatibility with legacy release action if profile omits up mapping
          normalized.action = C.releaseAction;
        }
        actions.push(normalized);
        telemetry.record({ kind:'profile:action', profileId: profile.id, ruleId: rule.id, action: normalized.action, seat: normalized.seat });
      }
    }
    if(actions.length === 0){
      // fallback to legacy single-action behaviour to keep contracts intact
      const fallbackAction = evt.type === 'pinch:down' ? C.primaryAction : C.releaseAction;
      actions.push({
        type: 'action',
        action: fallbackAction,
        seat: ctx.seat,
        hand: ctx.hand,
        handId: ctx.handId,
        t: ctx.t,
        orientBucket: ctx.orientBucket,
        orientDeg: ctx.orientDeg,
        profileId: profile.id,
        profileLabel: profile.label,
        ruleId: 'fallback',
        payload: null,
        meta: profile.params || null
      });
    }
    return actions;
  }

  function onPinchEvent(evt){
    if(!evt || !evt.type) return;
    if(evt.type !== 'pinch:down' && evt.type !== 'pinch:up') return;
    const orientDeg = orientationFromFrame(evt.frame) ?? 0;
    const orientBucket = bucketFor(orientDeg);
    const seat = C.seatFallback(evt.seat);
    const now = (typeof performance !== "undefined" && typeof performance.now === "function") ? performance.now() : Date.now();
    const ctx = {
      type: evt.type,
      seat,
      hand: evt.hand || null,
      handId: evt.handId ?? null,
      t: evt.t ?? now,
      orientDeg,
      orientBucket
    };
    telemetry.record({ kind:'profile:event', profileId: profile.id, type: evt.type, seat });
    const outputs = applyProfile(evt, ctx);
    outputs.forEach(emit);
  }

  return {
    onPinchEvent,
    on(h){ subs.add(h); return ()=>subs.delete(h); },
    bucketFor,
    orientationFromFrame,
    getProfile(){ return profile; },
    setProfile,
    listProfiles: listGameProfiles,
    registerProfile
  };
}

