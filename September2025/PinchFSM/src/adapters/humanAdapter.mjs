// HumanAdapter: normalize Human results into a stable HandSample shape
// Ports: init(config), detect(video|canvas), getMeta()
// Output shape:
// {
//   landmarks: Array<{x: number, y: number, z?: number}>(21) in [0..1] normalized to overlay size
//   keypointCount: number
//   boxPx?: { x:number,y:number,width:number,height:number }
//   coordMode: 'normalized' | 'pixel'
// }

export class HumanAdapter {
  constructor(humanCtor, { backend = 'wasm', modelBasePath, width, height } = {}) {
    this.humanCtor = humanCtor;
    this.cfg = {
      backend,
      modelBasePath,
      warmup: 'none',
      filter: { enabled: false },
      hand: { enabled: true, maxDetected: 1 },
      face: { enabled: false }, body: { enabled: false }, object: { enabled: false }, segmentation: { enabled: false }, gesture: { enabled: false },
      cacheSensitivity: 0,
    };
    this.human = null;
    this.width = width || 640;
    this.height = height || 480;
  }

  async init() {
    this.human = new this.humanCtor(this.cfg);
    await this.human.load();
  }

  setSize({ width, height }){
    if (width) this.width = width; if (height) this.height = height;
  }

  // Returns null if no hand with >=21 kps
  async detect(source) {
    const t0 = performance.now();
    const res = await this.human.detect(source);
    let hands = res?.hands || res?.hand || [];
    if ((!hands || (Array.isArray(hands) && hands.length === 0)) && this.human?.result) {
      hands = this.human.result.hands || this.human.result.hand || [];
    }
    const first = Array.isArray(hands) && hands.length > 0 ? hands[0] : null;
    const kps = first ? (first.keypoints || first.landmarks || first.points || null) : null;
    const kLen = Array.isArray(kps) ? kps.length : 0;
    if (!kps || kLen < 21) return { sample: null, detectMs: performance.now() - t0, hands: Array.isArray(hands)? hands.length : 0 };

    // coord mode heuristic
    const xs = [kps[0].x, kps[5].x, kps[8].x, kps[17].x].filter((v)=>Number.isFinite(v));
    const med = xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)] || 0;
    const alreadyNorm = med > 0 && med <= 2;
    const landmarks = Array.from({length:21}, (_,i)=>({
      x: alreadyNorm ? kps[i].x : (kps[i].x / this.width),
      y: alreadyNorm ? kps[i].y : (kps[i].y / this.height),
      z: (kps[i].z||0)
    }));
    const boxPx = first?.box && Number.isFinite(first.box.x) ? { x:first.box.x, y:first.box.y, width:first.box.width, height:first.box.height } : undefined;

    return {
      sample: { landmarks, keypointCount: kLen, boxPx, coordMode: alreadyNorm ? 'normalized':'pixel' },
      detectMs: performance.now() - t0,
      hands: Array.isArray(hands)? hands.length : 0,
    };
  }

  getMeta(){
    return { backend: this.cfg.backend, width: this.width, height: this.height };
  }
}
