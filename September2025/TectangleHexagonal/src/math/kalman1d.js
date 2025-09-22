// WEBWAY:ww-2025-109: 1D constant-velocity Kalman filter helper (zero-dep)
// State: [x, v]^T. Measurement: position (z). Process noise ~ acceleration variance (q).

export function createKalman1D(params = {}) {
  const q = Number(params.q ?? 1e-2); // process noise (accel variance)
  const r = Number(params.r ?? 2e-2); // measurement noise
  let x = Number(params.x ?? 0); // position
  let v = Number(params.v ?? 0); // velocity
  // Covariance matrix P (2x2)
  let p11 = Number(params.p11 ?? 1);
  let p12 = Number(params.p12 ?? 0);
  let p21 = Number(params.p21 ?? 0);
  let p22 = Number(params.p22 ?? 1);

  function predict(dt) {
    // x' = x + v*dt; v' = v
    x = x + v * dt;
    // P' = F P F^T + Q, with F=[[1,dt],[0,1]] and Q scaled by q
    const dt2 = dt * dt;
    const dt3 = dt2 * dt;
    const dt4 = dt2 * dt2;
    const q11 = (dt4 / 4) * q;
    const q12 = (dt3 / 2) * q;
    const q22 = dt2 * q;

    const p11n = p11 + dt * (p21 + p12) + dt2 * p22 + q11;
    const p12n = p12 + dt * p22 + q12;
    const p22n = p22 + q22;
    const p21n = p12n; // symmetry

    p11 = p11n; p12 = p12n; p21 = p21n; p22 = p22n;
  }

  function update(z) {
    // Innovation
    const y = z - x; // H=[1,0]
    const s = p11 + r; // S = H P H^T + R
    const k1 = p11 / s; // K = P H^T S^-1 -> [p11/s, p21/s]^T
    const k2 = p21 / s;
    // State update
    x = x + k1 * y;
    v = v + k2 * y;
    // Covariance update: P = (I - K H) P
    const p11n = (1 - k1) * p11;
    const p12n = (1 - k1) * p12;
    const p21n = p21 - k2 * p11;
    const p22n = p22 - k2 * p12;
    p11 = p11n; p12 = p12n; p21 = p21n; p22 = p22n;
  }

  function step(z, dt) {
    predict(dt);
    update(z);
    return { x, v };
  }

  function getState() { return { x, v, P: { p11, p12, p21, p22 }, q, r }; }

  function reset(nx = 0, nv = 0) { x = nx; v = nv; p11 = 1; p12 = 0; p21 = 0; p22 = 1; }

  return { predict, update, step, getState, reset };
}
