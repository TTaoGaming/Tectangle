// Jest-Puppeteer e2e: Replay idle golden MP4 on v2 page and export JSONL telemetry
// Outputs: HiveFleetObsidian/reports/telemetry/v2_idle_<timestamp>.jsonl and summary JSON
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

describe('v2 idle golden → JSONL export', () => {
  const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
  const base = `http://localhost:${port}`;
  const pageUrl = `${base}/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`;
  const clip = process.env.CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';
  const outDir = 'HiveFleetObsidian/reports/telemetry';
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const outJsonl = path.join(outDir, `v2_idle_${ts}.jsonl`);
  const outSummary = path.join(outDir, `v2_idle_${ts}.summary.json`);

  beforeAll(async () => {
    // Install getUserMedia shim that plays the golden MP4
    const mockUrl = `${base}/${clip.replace(/^\/+/, '')}`;
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

  it('exports JSONL telemetry (idle)', async () => {
    await fsp.mkdir(outDir, { recursive: true });
    const fh = fs.openSync(outJsonl, 'w');
    try{
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

      // Wait for FPS to start and models to initialize
      const ok = await page.waitForFunction(() => {
        const fps = parseFloat(document.getElementById('fps')?.textContent || '0') || 0;
        const hasLm = !!(window.__cam && window.__cam.hasHandLandmarker && window.__cam.hasHandLandmarker());
        const hasGr = !!(window.__cam && window.__cam.hasGestureRecognizer && window.__cam.hasGestureRecognizer());
        return fps > 0.1 && hasLm && hasGr;
      }, { timeout: 30000 }).catch(()=> null);
      expect(ok).toBeTruthy();

      // Sample for ~6 seconds at ~10 Hz
      const start = Date.now();
      let count = 0; let maxHands = 0; let seatsMax = 0; let fpsAvg = 0; let fpsSamples = 0;
      while(Date.now() - start < 6000){
        const frame = await page.evaluate(() => {
          const ts = Date.now();
          const fps = parseFloat(document.getElementById('fps')?.textContent || '0') || 0;
          const ids = (window.__cam?.getStableIds?.() || []);
          const seat = (window.__cam?.getSeat?.() || {});
          const gest = (window.__cam?.getGesture?.() || null);
          const last = (window.__cam?.getLast?.() || null);
          // Extract wrists
          const wrists = Array.isArray(last?.landmarks) ? last.landmarks.map(h => (Array.isArray(h)&&h[0]) ? { x:h[0].x, y:h[0].y, z:h[0].z||0 } : null) : [];
          const labels = Array.isArray(gest?.gestures) ? gest.gestures.map(arr => (arr && arr[0]) ? { name: arr[0].categoryName, score: arr[0].score } : null) : [];
          return { ts, fps, ids, seat, labels, wrists };
        });
        // write JSONL
        fs.writeSync(fh, JSON.stringify(frame) + '\n');
        count++;
        fpsAvg += frame.fps; fpsSamples++;
        const seatsUsed = Array.isArray(frame.seat?.perHand) ? frame.seat.perHand.filter(x=>x && x!=='unseated').length : 0;
        seatsMax = Math.max(seatsMax, seatsUsed);
        const handsNow = Array.isArray(frame.ids) ? frame.ids.filter(Boolean).length : 0;
        maxHands = Math.max(maxHands, handsNow);
        await new Promise(r=>setTimeout(r, 100));
      }

      const summary = { page: pageUrl, clip, lines: count, fpsAvg: fpsSamples? (fpsAvg/fpsSamples) : 0, maxHands, seatsMax };
      await fsp.writeFile(outSummary, JSON.stringify(summary, null, 2), 'utf8');
      // Minimal guard: we should have collected at least 20 lines and seen at least one hand
      expect(summary.lines).toBeGreaterThanOrEqual(20);
      expect(summary.maxHands).toBeGreaterThanOrEqual(1);
    } finally {
      try{ fs.closeSync(fh); }catch{}
    }
  });
});
