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

// fingerGeometryCore: computes index finger joint (approximate planar) angles
// WEBWAY:ww-2025-007 finger geometry scaffold (expires 2025-10-08)
/* Contract
Input frame landmark expectations (subset):
  indexMCP, indexPIP, indexDIP, indexTip each [x,y,z]
  t (ms)
Output events via on(listener):
  { type:'finger:index:angles', t, mcpDeg, pipDeg, dipDeg }
Angles: interior flexion angles in degrees (0 = fully straight, increasing with flexion) approximated using 2D projection (x,y).
*/
export function createFingerGeometryCore(opts={}){
  const subs = new Set();
  function emit(e){ subs.forEach(h=>{ try{ h(e); }catch{} }); }

  function angleBetween(a,b,c){ // angle at b formed by a-b-c using 2D vectors
    if(!a||!b||!c) return null;
    const v1x = a[0]-b[0], v1y = a[1]-b[1];
    const v2x = c[0]-b[0], v2y = c[1]-b[1];
    const dot = v1x*v2x + v1y*v2y;
    const m1 = Math.hypot(v1x,v1y)||1, m2=Math.hypot(v2x,v2y)||1;
    let cos = dot/(m1*m2); if(cos>1) cos=1; if(cos<-1) cos=-1;
    const ang = Math.acos(cos) * 180/Math.PI;
    return ang; // 0 straight line continuation, up to 180 folded back
  }

  const enableThumb = opts.enableThumbAngles || (globalThis.__flags && globalThis.__flags.FEATURE_FINGER_GEOM_THUMB);

  function update(frame){
    if(!frame) return;
    const { indexMCP, indexPIP, indexDIP, indexTip } = frame;
    if(!indexMCP||!indexPIP||!indexDIP||!indexTip) return;
  const mcpGeom = angleBetween(indexPIP, indexMCP, frame.wrist || indexPIP); // 180 straight
  const pipGeom = angleBetween(indexMCP, indexPIP, indexDIP);
  const dipGeom = angleBetween(indexPIP, indexDIP, indexTip);
  // Convert to flexion degrees where 0=straight, positive=increasing curl
  const toFlex = g => g==null?null : 180 - g;
  const mcpDeg = toFlex(mcpGeom);
  const pipDeg = toFlex(pipGeom);
  const dipDeg = toFlex(dipGeom);
  emit({ type:'finger:index:angles', t: frame.t, mcpDeg, pipDeg, dipDeg });

  if(enableThumb){
    const { thumbCMC, thumbMCP, thumbIP, thumbTip } = frame;
    if(thumbCMC && thumbMCP && thumbIP && thumbTip){
      const cmcGeom = angleBetween(thumbMCP, thumbCMC, frame.wrist || thumbMCP);
      const mcpThumbGeom = angleBetween(thumbCMC, thumbMCP, thumbIP);
      const ipGeom = angleBetween(thumbMCP, thumbIP, thumbTip);
      const cmcDeg = toFlex(cmcGeom);
      const mcpThumbDeg = toFlex(mcpThumbGeom);
      const ipDeg = toFlex(ipGeom);
      emit({ type:'finger:thumb:angles', t: frame.t, cmcDeg, mcpDeg: mcpThumbDeg, ipDeg }); // WEBWAY:ww-2025-012 thumb angles
    }
  }
  }

  return { update, on(fn){ subs.add(fn); return ()=>subs.delete(fn); } };
}
