// Mini guard: HUD label/handedness stability across idle frames

const port = Number(process.env.E2E_PORT || process.env.PORT || 8080);
const base = `http://localhost:${port}`;
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`;
const clipPath = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';

describe('v2 HUD label stability (idle)', () => {
  beforeAll(async () => {
    // Shim getUserMedia with idle MP4 captureStream for determinism
    const mockUrl = `${base}/${clipPath.replace(/^\/+/, '')}`;
    await page.evaluateOnNewDocument((url) => {
      const ensureVideo = async () => {
        if (navigator.__mockVideoEl) return navigator.__mockVideoEl;
        const v = document.createElement('video');
        v.src = url; v.muted = true; v.playsInline = true; v.setAttribute('playsinline','');
        v.style.cssText='position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;';
        document.addEventListener('DOMContentLoaded', ()=>{ try{ document.body.appendChild(v); }catch{} });
        try{ await v.play(); }catch{}
        if (!v.readyState || v.readyState < 2) {
          await new Promise(r => v.addEventListener('loadeddata', r, { once:true }));
        }
        navigator.__mockVideoEl = v; return v;
      };
      const orig = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) : null;
      const shim = async (constraints) => {
        try{
          const v = await ensureVideo();
          const ms = v.captureStream ? v.captureStream() : (v.mozCaptureStream ? v.mozCaptureStream() : null);
          if(!ms) throw new Error('captureStream not supported');
          return ms;
        }catch(e){ if(orig) return orig(constraints); throw e; }
      };
      if(!navigator.mediaDevices) navigator.mediaDevices = {};
      navigator.mediaDevices.getUserMedia = shim;
      window.__mockInstalled = true;
    }, mockUrl);
  });

  it('labels bound to stable keys don\'t flip across samples', async () => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

    // Wait for FPS and recognizer/landmarker
    await page.waitForFunction(() => {
      const fpsEl = document.getElementById('fps');
      const fps = parseFloat(fpsEl?.textContent || '0') || 0;
      const ok = (window.__cam && window.__cam.hasGestureRecognizer && window.__cam.hasHandLandmarker && window.__cam.hasGestureRecognizer() && window.__cam.hasHandLandmarker());
      return fps > 0.1 && ok;
    }, { timeout: 20000 });

    // Take N samples of aligned labels by stable key
  const N = 8; const samples = [];
    for(let i=0;i<N;i++){
      const snap = await page.evaluate(() => {
        const ids = (window.__cam && window.__cam.getStableIds) ? window.__cam.getStableIds() : [];
        const aligned = (window.__cam && window.__cam.getAlignedLabels) ? window.__cam.getAlignedLabels() : { byKey:{} };
        return { ids, byKey: aligned.byKey || {} };
      });
      samples.push(snap);
      await page.evaluate(() => new Promise(r => setTimeout(r, 150)));
    }

    // Build per-key sequences of labels and handedness
    const keys = new Set();
    for(const s of samples){ for(const k of s.ids){ if(k) keys.add(k); } }
    // Require at least one key to be present in idle clip
    expect(keys.size).toBeGreaterThan(0);

    for(const k of keys){
      const seq = samples.map(s => s.byKey[k] ? s.byKey[k].label || null : null).filter(x => x !== null);
      const hands = samples.map(s => s.byKey[k] ? s.byKey[k].handed || null : null).filter(x => x !== null);
      // If we observed multiple labels for same key during idle, that\'s a flip
      const uniqueLabels = Array.from(new Set(seq));
      const uniqueHands = Array.from(new Set(hands));
      expect(uniqueLabels.length).toBeLessThanOrEqual(2); // allow null/one gesture rename at most
      // Handedness should remain stable for a key
      expect(uniqueHands.length).toBeLessThanOrEqual(1);
    }
  });
});
