import assert from 'assert';

// Recreate the mapping logic used in the v2 page for unit verification
const seatColors = {
  P1: { raw: 'rgba(244,63,94,0.6)', smooth: 'rgba(244,63,94,0.9)', hud: '#f43f5e' },
  P2: { raw: 'rgba(59,130,246,0.5)', smooth: 'rgba(59,130,246,0.85)', hud: '#3b82f6' },
  P3: { raw: 'rgba(234,179,8,0.5)', smooth: 'rgba(234,179,8,0.85)', hud: '#eab308' },
  P4: { raw: 'rgba(16,185,129,0.5)', smooth: 'rgba(16,185,129,0.85)', hud: '#10b981' },
  default: { raw: 'rgba(255,255,255,0.35)', smooth: 'rgba(148,163,184,0.8)', hud: '#e5e7eb' }
};

function mapHandToSeatColor(key, seat){
  const order = ['P1','P2','P3','P4'];
  const sname = key ? (order.find(n => seat[n]?.key === key) || null) : null;
  return (sname && seatColors[sname]) ? seatColors[sname] : seatColors.default;
}

describe('seat color mapping', () => {
  it('returns default for unseated hands', () => {
    const seat = { P1:{key:null}, P2:{key:null}, P3:{key:null}, P4:{key:null} };
    const pal = mapHandToSeatColor('id:A', seat);
    assert.equal(pal.hud, seatColors.default.hud);
  });
  it('maps P1 and P2 to distinct palettes', () => {
    const seat = { P1:{key:'id:A'}, P2:{key:'id:B'}, P3:{key:null}, P4:{key:null} };
    const pal1 = mapHandToSeatColor('id:A', seat);
    const pal2 = mapHandToSeatColor('id:B', seat);
    assert.equal(pal1.hud, seatColors.P1.hud);
    assert.equal(pal2.hud, seatColors.P2.hud);
    assert.notEqual(pal1.hud, pal2.hud);
  });
});
