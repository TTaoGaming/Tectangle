// MetricsAdapter: small helper to track FPS and expose rolling metrics
export class MetricsAdapter {
  constructor(){
    this.lastTs = performance.now();
    this.fps = 0;
  }
  tick(){
    const now = performance.now();
    const dt = now - this.lastTs;
    this.fps = this.fps*0.8 + (1000/dt)*0.2;
    this.lastTs = now;
    return { fps: this.fps };
  }
}
