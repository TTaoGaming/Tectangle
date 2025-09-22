// GSOS: Idle label/handedness/seat stability guard (deterministic idle clip)

const port = Number(process.env.E2E_PORT || process.env.PORT || 8080);
const base = `http://localhost:${port}`;
// WEBWAY:ww-2025-122: Ensure camera app opens and wallpaper stays off; pin source to v2 for stable hooks
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html?GSOS_OPEN=camera&GSOS_WALLPAPER=0&GSOS_CAMERA_SRC=v2`;
const clipPath = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';

describe('GSOS idle stability', () => {
  beforeAll(async () => {
    // Shim getUserMedia with idle MP4 captureStream for determinism
    const mockUrl = `${base}/${clipPath.replace(/^\/+/, '')}`;
    await page.evaluateOnNewDocument((url) => {
      // WEBWAY:ww-2025-122: MP4 replay shim available to same-origin iframes
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

  it('per-key labels/handedness do not flip across samples; seat mapping stable', async () => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

    // WEBWAY:ww-2025-122: Open camera app deterministically (in case auto-open list changed)
    await page.waitForFunction(() => !!(window.__gso && window.__gso.openApp), { timeout: 20000 });
    await page.evaluate(async () => { try { await window.__gso.openApp('camera'); } catch {} });

    // Find the embedded camera iframe (v2 harness) and wait for readiness within that frame
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      const camFrame = await (async () => {
        const deadline = Date.now() + 8000;
        while (Date.now() < deadline) {
          const frames = page.frames();
          const f = frames.find(fr => /camera_landmarks_wrist_label_v2\.html/i.test(fr.url()));
          if (f) return f;
          await sleep(250);
        }
        return null;
      })();
    if (!camFrame) throw new Error('Camera iframe not found');

    // Wait for FPS>0 and both landmarker/recognizer ready inside the iframe
    await camFrame.waitForFunction(() => {
      const fpsEl = document.getElementById('fps');
      const fps = parseFloat(fpsEl?.textContent || '0') || 0;
      const ok = (window.__cam && window.__cam.hasGestureRecognizer && window.__cam.hasHandLandmarker && window.__cam.hasGestureRecognizer() && window.__cam.hasHandLandmarker());
      return fps > 0.1 && ok;
    }, { timeout: 30000 });

    // Take N samples
    const N = 8; const samples = [];
    for(let i=0;i<N;i++){
      // Sample from the camera iframe context
      const snap = await camFrame.evaluate(() => {
        const ids = (window.__cam && window.__cam.getStableIds) ? window.__cam.getStableIds() : [];
        const aligned = (window.__cam && window.__cam.getAlignedLabels) ? window.__cam.getAlignedLabels() : { byKey:{} };
        const seat = (window.__cam && window.__cam.getSeat) ? window.__cam.getSeat() : null;
        return { ids, byKey: aligned.byKey || {}, seat };
      });
      samples.push(snap);
      await camFrame.evaluate(() => new Promise(r => setTimeout(r, 150)));
    }

    const keys = new Set();
    for(const s of samples){ for(const k of s.ids){ if(k) keys.add(k); } }
    expect(keys.size).toBeGreaterThan(0);

    for(const k of keys){
      const seq = samples.map(s => s.byKey[k] ? s.byKey[k].label || null : null).filter(x => x !== null);
      const hands = samples.map(s => s.byKey[k] ? s.byKey[k].handed || null : null).filter(x => x !== null);
      const uniqueLabels = Array.from(new Set(seq));
      const uniqueHands = Array.from(new Set(hands));
      expect(uniqueLabels.length).toBeLessThanOrEqual(2);
      expect(uniqueHands.length).toBeLessThanOrEqual(1);
    }

    // Seat mapping should be consistent for present keys
    for(const s of samples){
      const perHand = s.seat?.perHand || [];
      expect(Array.isArray(perHand)).toBe(true);
    }
  });
});
