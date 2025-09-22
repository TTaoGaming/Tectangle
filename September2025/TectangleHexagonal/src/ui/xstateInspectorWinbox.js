import { getActor, listActors } from '../ports/xstateRegistry.js';
// WEBWAY:ww-2025-111: Stub window adds data-testid and __wbTest markers for e2e

function createStubWinbox(title='Window', width=420, height=320, testId){
  if (typeof document==='undefined') return null;
  try{
    const root = document.createElement('div');
    root.className = 'winbox wb-dark';
    const header = document.createElement('div'); header.className = 'wb-header';
    const t = document.createElement('div'); t.className = 'wb-title'; t.textContent = title;
    const body = document.createElement('div'); body.className = 'wb-body';
    header.appendChild(t); root.appendChild(header); root.appendChild(body);
    root.style.position='fixed'; root.style.right='12px'; root.style.top='12px';
    root.style.width=(width+'px'); root.style.height=(height+'px');
    root.style.border='1px solid rgba(255,255,255,0.12)'; root.style.background='#0f172a';
    if (testId) { try { root.setAttribute('data-testid', testId); } catch {} }
    document.body.appendChild(root);
    try { window.__wbTest = window.__wbTest || {}; if (testId) { const k = testId.replace('winbox-',''); window.__wbTest[k] = true; } } catch {}
    return { dom: root, body, onclose: null, close: ()=>{ try{ root.remove(); }catch{} } };
  }catch{ return null; }
}

export async function openXStateInspector() {
  // Uses WinBox host to create a floating window and render actor snapshots.
  let wb;
  try {
    const { createWinBoxWindow } = await import('./../ui/winBoxHost.js');
    wb = await createWinBoxWindow({ title: 'XState Inspector', width: 420, height: 360 });
    try{ wb?.dom?.setAttribute?.('data-testid','winbox-xstate'); }catch{}
  } catch {
    wb = createStubWinbox('XState Inspector', 420, 360, 'winbox-xstate');
    if (!wb) throw new Error('Failed to open XState Inspector');
  }
  const root = document.createElement('div');
  root.style.cssText = 'padding:10px;font:13px system-ui,Segoe UI,Roboto,Arial;color:#e5e7eb;';
  root.innerHTML = `
    <div style="margin-bottom:8px;display:flex;gap:6px;align-items:center">
      <strong>Actors</strong>
      <button id="refresh" style="margin-left:auto;background:#374151;color:#e5e7eb;border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:4px 8px">Refresh</button>
    </div>
    <div id="list"></div>
    <div id="details" style="margin-top:10px"></div>
    <!-- WEBWAY:ww-2025-108: Inspector shows stale status & age when FEATURE_GATESHELL_FSM_WATCHDOG enabled -->
  `;
  wb.body.appendChild(root);
  const $ = (sel) => root.querySelector(sel);
  const listEl = $('#list');
  const detailsEl = $('#details');

  let unsub = null;

  function renderList() {
    const names = listActors();
    if (!names.length) {
      listEl.innerHTML = '<div style="opacity:0.8">No actors registered yet.</div>';
      detailsEl.innerHTML = '';
      return;
    }
    listEl.innerHTML = names.map(n => `<div style="margin:4px 0"><button class="pick" data-name="${n}" style="background:#16a34a;color:#fff;border:0;border-radius:6px;padding:4px 8px">${n}</button></div>`).join('');
    listEl.querySelectorAll('.pick').forEach(btn => btn.addEventListener('click', () => select(btn.getAttribute('data-name'))));
  }

  function select(name) {
    if (unsub) { try { unsub(); } catch {} unsub = null; }
    const actor = getActor(name);
    if (!actor) { detailsEl.innerHTML = `<div>Actor not found: ${name}</div>`; return; }
    const box = document.createElement('div');
    box.style.cssText = 'margin-top:6px;padding:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.12);border-radius:8px;max-height:220px;overflow:auto;';
    const meta = document.createElement('div');
    detailsEl.innerHTML = '';
    detailsEl.appendChild(document.createElement('div')).innerHTML = `<strong>${name}</strong>`;
    meta.style.cssText = 'margin-top:4px;font-size:12px;opacity:0.9';
    detailsEl.appendChild(meta);
    detailsEl.appendChild(box);
    box.textContent = 'Subscribing…';
    let lastChangeTs = Date.now();
    unsub = actor.subscribe((snapshot) => {
      if (!snapshot) return;
      const now = Date.now();
      if (snapshot.changed) lastChangeTs = now;
      const ageMs = now - lastChangeTs;
      const payload = {
        state: snapshot.value,
        context: snapshot.context,
        status: snapshot.status,
        changed: snapshot.changed,
        tags: Array.isArray(snapshot.tags) ? snapshot.tags : []
      };
      box.textContent = JSON.stringify(payload, null, 2);
      const stale = !!(snapshot.context && snapshot.context.stale);
      meta.textContent = `ageMs: ${ageMs} • stale: ${stale ? 'yes' : 'no'}`;
      box.style.borderColor = stale ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.12)';
      box.style.background = stale ? 'rgba(239,68,68,0.12)' : 'rgba(0,0,0,0.35)';
    });
    try {
      if (actor.getSnapshot) {
        const s = actor.getSnapshot();
        if (s) {
          box.textContent = JSON.stringify({ state: s.value, context: s.context }, null, 2);
          lastChangeTs = Date.now();
          meta.textContent = `ageMs: 0 • stale: ${s.context && s.context.stale ? 'yes' : 'no'}`;
        }
      }
    } catch {}
  }

  $('#refresh').addEventListener('click', renderList);
  renderList();

  wb.onclose = () => { if (unsub) { try { unsub(); } catch {} } };
}
