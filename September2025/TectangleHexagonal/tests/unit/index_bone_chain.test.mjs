import assert from 'assert';
import { normalizeIndexBoneChain } from '../../src/core/indexBoneChain.js';

function lmPoint(x,y,z=0){ return [x,y,z]; }

// Build a minimal plausible hand layout in 2D for index/thumb test
function buildLandmarks(){
  const lm = new Array(21).fill(0).map(()=>lmPoint(0,0,0));
  // wrist
  lm[0] = lmPoint(0.0, 0.0);
  // thumb: simple diagonal
  lm[1]=lmPoint(-0.05, 0.02); lm[2]=lmPoint(-0.04, 0.03); lm[3]=lmPoint(-0.03, 0.04); lm[4]=lmPoint(-0.02, 0.05);
  // index: roughly horizontal to the right
  lm[5]=lmPoint(0.02, 0.00); // MCP
  lm[6]=lmPoint(0.05, 0.00); // PIP
  lm[7]=lmPoint(0.08, 0.00); // DIP
  lm[8]=lmPoint(0.11, 0.00); // TIP
  // middle/ring/pinky MCPs to define knuckle span (use pinky MCP far right for simplicity)
  lm[17]=lmPoint(0.10, 0.02); // pinky MCP
  return lm;
}

describe('indexBoneChain.normalize', ()=>{
  it('returns angles and tip gap in cm with default knuckle span', ()=>{
    const lm = buildLandmarks();
    const out = normalizeIndexBoneChain(lm, { knuckleSpanCm: 8.0 });
    assert.ok(out.ok, 'normalization ok');
    assert.ok(typeof out.tipGapCm === 'number' && isFinite(out.tipGapCm), 'tipGapCm numeric');
    assert.equal(out.knuckleSpanCm, 8.0);
  });
  it('fails gracefully on bad landmarks', ()=>{
    const out = normalizeIndexBoneChain(null);
    assert.equal(out.ok, false);
  });
});
