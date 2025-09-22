// Drawing helpers for raw and smoothed landmarks
// Contract:
// - drawRaw(ctx, hands, map, opts)
// - drawSmoothed(ctx, hands, map, opts)

function drawDots(g, points, color, radius) {
  g.fillStyle = color;
  for (const p of points) {
    if (!p) continue;
    const [x, y] = p;
    g.beginPath(); g.arc(x, y, radius, 0, Math.PI * 2); g.fill();
  }
}

export function drawRaw(g, hands, mapper, opts = {}) {
  const defaultColor = opts.color || 'rgba(255,255,255,0.5)';
  const colors = Array.isArray(opts.colors) ? opts.colors : null;
  const r = opts.radius || 3;
  for (let hi = 0; hi < hands.length; hi++) {
    const hand = hands[hi] || [];
    const pts = [];
    for (let pi = 0; pi < hand.length; pi++) {
      const p = hand[pi]; if (!p) continue;
      pts.push(mapper.map(p.x, p.y));
    }
    const color = colors && colors[hi] ? colors[hi] : defaultColor;
    drawDots(g, pts, color, r);
  }
}

export function drawSmoothed(g, hands, mapper, opts = {}) {
  const defaultColor = opts.color || 'rgba(234,179,8,0.7)'; // amber-ish
  const colors = Array.isArray(opts.colors) ? opts.colors : null;
  const r = opts.radius || 2;
  for (let hi = 0; hi < hands.length; hi++) {
    const hand = hands[hi] || [];
    const pts = [];
    for (let pi = 0; pi < hand.length; pi++) {
      const p = hand[pi]; if (!p) continue;
      pts.push(mapper.map(p.x, p.y));
    }
    const color = colors && colors[hi] ? colors[hi] : defaultColor;
    drawDots(g, pts, color, r);
  }
}
