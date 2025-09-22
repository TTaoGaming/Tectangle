/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

const DEFAULT_TIMEOUT_MS = 45000;

function recorderInit(){
  if(window.__hexRecorderInstalled){ return; }
  window.__events = Array.isArray(window.__events) ? window.__events : [];
  window.__hexEvents = window.__events;
  const record = (payload) => {
    const bucket = window.__events;
    if(Array.isArray(bucket)){
      bucket.push(payload);
    }
  };

  window.addEventListener('hex-pinch', (evt) => {
    const detail = (evt && evt.detail) || {};
    record({ type: 'hex-pinch', ...detail });
  });

  window.addEventListener('message', (evt) => {
    const data = evt && evt.data;
    if(data && data.type === 'pinch-key'){
      record({ type: 'pinch-key', action: data.action, controllerId: data.controllerId, key: data.key });
    }
  });

  window.__hexRecorderInstalled = true;
}

async function installRecorder(page){
  await page.evaluateOnNewDocument(recorderInit);
}

async function ensureRecorder(page){
  await page.evaluate(recorderInit);
}

async function waitForPinchDowns(page, expected, timeoutMs = DEFAULT_TIMEOUT_MS){
  await ensureRecorder(page);
  try {
    const handle = await page.waitForFunction((count) => {
      const events = window.__events || [];
      const downs = events.filter((e) => e.type === 'hex-pinch' && e.action === 'down');
      if(downs.length >= count){
        const controllers = Array.from(new Set(downs.map((e) => e.controllerId).filter(Boolean)));
        return { downsCount: downs.length, controllers };
      }
      return false;
    }, { timeout: timeoutMs }, expected);
    return handle.jsonValue();
  } catch (err) {
    try {
      const snapshot = await getPinchSummary(page);
      err.message += ` (downs=${snapshot.downsCount}, controllers=${snapshot.controllers.join(',')})`;
    } catch (_) {
      err.message += ' (snapshot unavailable)';
    }
    throw err;
  }
}

async function getPinchSummary(page){
  return page.evaluate(() => {
    const events = window.__events || [];
    const downs = events.filter((e) => e.type === 'hex-pinch' && e.action === 'down');
    const controllers = Array.from(new Set(downs.map((e) => e.controllerId).filter(Boolean)));
    return { downsCount: downs.length, controllers, events };
  });
}

module.exports = {
  installRecorder,
  ensureRecorder,
  waitForPinchDowns,
  getPinchSummary,
  DEFAULT_TIMEOUT_MS,
};

