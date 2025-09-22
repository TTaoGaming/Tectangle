/**
 * Jest-Puppeteer e2e: v3 Kalman demo telemetry from MP4
 * - Plays: right_hand_index_pinch_two_slow_then_two_fast.mp4 (configurable via CLIP)
 * - Enables Kalman flag; sets lookahead (LA env) and optional hysteresis (ENTER/EXIT env)
 * - Captures pinch:down/up events with velocity and TOI fields and writes JSONL + summary
 *
 * Env:
 *   E2E_PORT (default 8091)
 *   CLIP=September2025/TectangleHexagonal/videos/right_hand_index_pinch_two_slow_then_two_fast.mp4
 *   LA=100   (lookahead ms)
 *   ENTER=0.40 EXIT=0.70  (optional hysteresis)
 */

const fs = require('node:fs');
const path = require('node:path');

jest.setTimeout(120000);

describe('v3 Kalman telemetry: two slow then two fast', () => {
  const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
  const base = `http://127.0.0.1:${port}`;
  const clipRel = process.env.CLIP || 'September2025/TectangleHexagonal/videos/right_hand_index_pinch_two_slow_then_two_fast.mp4';
  const clipUrl = `${base}/${clipRel.replace(/^\/+/, '')}`;
  const lookaheadMs = Number.isFinite(+process.env.LA) ? +process.env.LA : 100;
  const enter = Number.isFinite(+process.env.ENTER) ? +process.env.ENTER : null;
  const exit = Number.isFinite(+process.env.EXIT) ? +process.env.EXIT : null;
  const outDir = path.join('September2025', 'TectangleHexagonal', 'out');
  const outJsonl = path.join(outDir, 'v3_kalman.telemetry.two_slow_two_fast.jsonl');
  const outSummary = path.join(outDir, 'v3_kalman.telemetry.two_slow_two_fast.summary.json');

  beforeAll(async () => {
    // Ensure output directory exists
    try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
  });

  it('collects velocities and TOI from demo and writes JSONL + summary', async () => {
    const pageUrl = `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html`;
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

    // Wait for SDK and enable Kalman + set lookahead/hysteresis
    await page.waitForFunction(() => !!(globalThis.__sdk), { timeout: 20000 });
    await page.evaluate((cfg) => {
      // WEBWAY:ww-2025-008: enable Kalman in demo
      globalThis.__flags = globalThis.__flags || {}; globalThis.__flags['FEATURE_SDK_V3_KALMAN_TOI'] = true;
      try { const ff = document.getElementById('ff_kalman'); if(ff){ ff.checked = true; ff.dispatchEvent(new Event('change', { bubbles:true })); } } catch {}
      try { globalThis.__sdk.updatePredictionConfig && globalThis.__sdk.updatePredictionConfig({ lookaheadMs: cfg.la }); } catch {}
      const part = {}; if(typeof cfg.enter==='number') part.enterThresh = cfg.enter; if(typeof cfg.exit==='number') part.exitThresh = cfg.exit;
      try { if(Object.keys(part).length){ globalThis.__sdk.updatePinchConfig && globalThis.__sdk.updatePinchConfig(part); } } catch {}

      // Attach event collector
      const ev = [];
      const pick = (e) => ({
        type: e?.type,
        t: (typeof e?.t === 'number') ? Math.round(e.t) : null,
        vRel: (typeof e?.vRel === 'number') ? e.vRel : null,
        aRel: (typeof e?.aRel === 'number') ? e.aRel : null,
        norm: (typeof e?.norm === 'number') ? e.norm : null,
        toiPredAbsV: (typeof e?.toiPredAbsV === 'number') ? Math.round(e.toiPredAbsV) : null,
        toiPredAbsA: (typeof e?.toiPredAbsA === 'number') ? Math.round(e.toiPredAbsA) : null,
        toiActualEnterAbs: (typeof e?.toiActualEnterAbs === 'number') ? Math.round(e.toiActualEnterAbs) : null,
        palmAngleDeg: (typeof e?.palmAngleDeg === 'number') ? e.palmAngleDeg : null,
      });
      // SDK facade .on delivers all events via handler(evt)
      try { globalThis.__unsubDemoK = globalThis.__sdk.on((e)=>{ if(e && typeof e.type === 'string' && (e.type.startsWith('pinch:'))){ ev.push(pick(e)); }}); } catch {}
      globalThis.__telemetryEvents = ev;
    }, { la: lookaheadMs, enter, exit });

    // Start the video
    await page.evaluate(async (u) => {
      const video = document.getElementById('cam');
      // For reliability in automation, relax palm gate
      try{ globalThis.__sdk.updatePinchConfig && globalThis.__sdk.updatePinchConfig({ palmGate:false }); }catch{}
      await globalThis.__sdk.startVideoUrl(video, u);
    }, clipUrl);

    // Wait for at least 4 downs and 4 ups (two slow then two fast)
    const deadline = Date.now() + 90000;
    let enough = false;
    while(Date.now() < deadline){
      const { down, up } = await page.evaluate(() => {
        const ev = globalThis.__telemetryEvents || []; let d=0,u=0; for(const e of ev){ if(e.type==='pinch:down' && !e.speculative) d++; if(e.type==='pinch:up') u++; } return { down:d, up:u };
      });
      if(down >= 4 && up >= 4){ enough = true; break; }
      await new Promise(r=>setTimeout(r, 300));
    }

    // Pull telemetry
    const data = await page.evaluate(() => ({ events: globalThis.__telemetryEvents || [] }));

    // Write JSONL
    const lines = (data.events || []).map(o => JSON.stringify(o));
    try { fs.writeFileSync(outJsonl, lines.join('\n') + (lines.length?'\n':''), 'utf8'); } catch {}

    // Build a small summary
    const downs = data.events.filter(e=>e.type==='pinch:down');
    const ups = data.events.filter(e=>e.type==='pinch:up');
    const vDown = downs.map(e=>e.vRel).filter(x=>typeof x==='number');
    const vUp = ups.map(e=>e.vRel).filter(x=>typeof x==='number');
    const toiA = downs.map(e=>e.toiActualEnterAbs).filter(x=>typeof x==='number');
    const toiPV = downs.map(e=>e.toiPredAbsV).filter(x=>typeof x==='number');
    const toiErr = (toiA.length===toiPV.length) ? toiA.map((a,i)=> a - toiPV[i]) : [];

    const mean = (arr)=> arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : null;
    const abs = (x)=> Math.abs(x);
    let slowFast = null;
    if(vDown.length >= 4){
      const mSlow = mean(vDown.slice(0,2).map(abs));
      const mFast = mean(vDown.slice(2,4).map(abs));
      slowFast = { mSlow, mFast, ratio: (mFast>0)? (mSlow/mFast): null, ok: (mSlow!=null && mFast!=null) ? (mSlow < 0.7*mFast) : null };
    }

    const summary = {
      page: pageUrl,
      clip: clipRel,
      lookaheadMs,
      counts: { downs: downs.length, ups: ups.length },
      velocities: {
        down: { mean: mean(vDown), values: vDown.slice(0,8) },
        up:   { mean: mean(vUp), values: vUp.slice(0,8) },
        twoSlowThenTwoFast: slowFast,
      },
      toi: {
        actualEnterAbs: toiA.slice(0,8),
        predAbsV: toiPV.slice(0,8),
        errVsPredV: toiErr.slice(0,8),
        errStats: toiErr.length? { mean: Math.round(mean(toiErr)), maxAbs: Math.max(...toiErr.map(abs)) }: null,
      }
    };
    try { fs.writeFileSync(outSummary, JSON.stringify(summary, null, 2)); } catch {}

    // Expectations: at least 4 downs/ups and some telemetry captured
    expect(downs.length).toBeGreaterThanOrEqual(4);
    expect(ups.length).toBeGreaterThanOrEqual(4);
  });
});
