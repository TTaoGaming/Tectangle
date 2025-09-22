// Viewport mapping for video -> canvas with object-fit cover/contain and optional mirror
// Contract:
// - makeVideoMapper(video, canvas, { fit:'cover'|'contain', mirror:boolean })
// - returns { map(x,y):[px,py], recalc(), state }

export function makeVideoMapper(video, canvas, opts = {}) {
  const state = { fit: opts.fit || 'cover', mirror: !!opts.mirror, vw: 0, vh: 0, W: 0, H: 0, scale: 1, dx: 0, dy: 0, dispW: 0, dispH: 0 };

  function recalc() {
    state.vw = video.videoWidth || video.naturalWidth || video.clientWidth || 1;
    state.vh = video.videoHeight || video.naturalHeight || video.clientHeight || 1;
    state.W = canvas.width || canvas.clientWidth || 1;
    state.H = canvas.height || canvas.clientHeight || 1;
    const rW = state.W / state.vw;
    const rH = state.H / state.vh;
    if (state.fit === 'contain') state.scale = Math.min(rW, rH);
    else state.scale = Math.max(rW, rH); // cover default
    state.dispW = state.vw * state.scale;
    state.dispH = state.vh * state.scale;
    state.dx = (state.W - state.dispW) * 0.5;
    state.dy = (state.H - state.dispH) * 0.5;
  }

  function map(x, y) {
    const nx = state.mirror ? (1 - x) : x;
    const px = state.dx + nx * state.dispW;
    const py = state.dy + y * state.dispH;
    return [px, py];
  }

  return { map, recalc, state };
}
