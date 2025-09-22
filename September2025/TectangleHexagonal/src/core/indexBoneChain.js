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

// indexBoneChain: basic helper to compute index joint angles and absolute tip gap in centimeters
// Inputs: MediaPipe 21-point landmarks array (each [x,y,z]) and options { knuckleSpanCm=8, toleranceCm=1.5 }
// Output: { mcpDeg, pipDeg, dipDeg, tipGapCm, knuckleSpanCm, ok }

import { computeHandJointAngles } from './handGeometry.js';

const IDX = {
  WRIST: 0,
  TH_TIP: 4,
  IX_MCP: 5, IX_PIP: 6, IX_DIP: 7, IX_TIP: 8,
  PK_MCP: 17,
};

function dist2D(a,b){ return Math.hypot((a?.[0]??0)-(b?.[0]??0), (a?.[1]??0)-(b?.[1]??0)); }

export function normalizeIndexBoneChain(landmarks, { knuckleSpanCm=8.0, toleranceCm=1.5 } = {}){
  if(!Array.isArray(landmarks) || landmarks.length < 21){ return { ok:false, reason:'bad-landmarks' }; }
  const ang = computeHandJointAngles(landmarks);
  const index = ang && ang.index ? ang.index : null;
  const mcpDeg = index ? (180 - (index.MCP||180)) : null; // convert geometry to flexion convention if needed
  const pipDeg = index ? (180 - (index.PIP||180)) : null;
  const dipDeg = index ? (180 - (index.DIP||180)) : null;
  const ixTip = landmarks[IDX.IX_TIP];
  const thTip = landmarks[IDX.TH_TIP];
  const ixMcp = landmarks[IDX.IX_MCP];
  const pkMcp = landmarks[IDX.PK_MCP];
  const knNorm = dist2D(ixMcp, pkMcp);
  if(!(knNorm>1e-6)) return { ok:false, reason:'knuckle-missing' };
  const gapNorm = dist2D(ixTip, thTip);
  const tipGapCm = (gapNorm/knNorm) * knuckleSpanCm;
  const knuckleSpan = knuckleSpanCm;
  return { ok:true, mcpDeg, pipDeg, dipDeg, tipGapCm, knuckleSpanCm: knuckleSpan, toleranceCm };
}

export default { normalizeIndexBoneChain };
