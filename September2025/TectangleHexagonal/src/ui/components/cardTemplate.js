// WEBWAY:ww-2025-091: Shared WinBox card template helpers (singleton windows)

export async function loadWinBox(){
  try {
    if (window.WinBox) return true;
    const already = document.querySelector('script[data-lib="winbox"]');
    if (!already) {
      const s = document.createElement('script');
      s.src = '/node_modules/winbox/dist/winbox.bundle.js';
      s.async = true; s.defer = true; s.setAttribute('data-lib','winbox');
      const p = new Promise(res => { s.onload = () => res(true); s.onerror = () => res(false); });
      document.head.appendChild(s);
      const ok = await p; if (!ok) return false;
    }
    await new Promise(r => setTimeout(r, 10));
    return !!window.WinBox;
  } catch { return false; }
}

export async function ensureWinBox(){ return loadWinBox(); }

export function winboxStatus(){
  try {
    const reg = (window.__gso && window.__gso._wb) || {};
    const vals = Object.values(reg);
    const counts = vals.reduce((acc,v)=>{ acc[v?.type||'unknown']=(acc[v?.type||'unknown']||0)+1; return acc; },{});
    return { hasReal: !!window.WinBox, counts };
  } catch { return { hasReal: !!window.WinBox, counts:{} }; }
}

export function materialReady(){ return !!window.__materialReady; }

export async function awaitMaterialReady(timeoutMs=800){
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    if (window.__materialReady === true) return true;
    await new Promise(r=>setTimeout(r, 40));
  }
  return !!window.__materialReady;
}

function wbRegistry(){ try { window.__gso = window.__gso || {}; window.__gso._wb = window.__gso._wb || {}; return window.__gso._wb; } catch { return {}; } }

export function createStubWinbox(title='Window', width=420, height=320, testId){
  try{
    const root = document.createElement('div');
    root.className = `winbox ${DEFAULT_THEME.rootClass}`;
    const header = document.createElement('div'); header.className = DEFAULT_THEME.headerClass;
    const t = document.createElement('div'); t.className = DEFAULT_THEME.titleClass; t.textContent = title;
    const body = document.createElement('div'); body.className = DEFAULT_THEME.bodyClass;
    header.appendChild(t); root.appendChild(header); root.appendChild(body);
    root.style.position='fixed'; root.style.right='12px'; root.style.top='12px';
    root.style.width = (width+'px'); root.style.height=(height+'px');
    root.style.border = DEFAULT_THEME.chrome.border; root.style.background = DEFAULT_THEME.chrome.background;
    applyContentStyle(body, DEFAULT_THEME.contentStyle);
    if (testId) try{ root.setAttribute('data-testid', testId); }catch{}
    try { root.setAttribute('data-winbox-type','stub'); } catch {}
    document.body.appendChild(root);
    return { type:'stub', dom: root, body, close: ()=>{ try{ root.remove(); }catch{} }, focus: ()=>{ try{ root.style.zIndex = String(Date.now()); root.scrollIntoView({block:'center'}); } catch{} } };
  }catch{ return null; }
}

// WEBWAY:ww-2025-131: Standardized WinBox factory with theme + defaults
const DEFAULT_THEME = {
  rootClass: 'wb-dark',
  headerClass: 'wb-header',
  titleClass: 'wb-title',
  bodyClass: 'wb-body',
  chrome: {
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#0f172a'
  },
  contentStyle: {
    padding: '8px',
    color: '#e5e7eb',
    fontFamily: 'system-ui,Segoe UI,Roboto,Helvetica,Arial',
    lineHeight: '1.35'
  }
};

function applyContentStyle(node, style){ try { Object.assign(node.style, style || {}); } catch {} }

export async function createWinBox(title='Window', width=420, height=320, testId, opts={}){
  const hasReal = await ensureWinBox();
  if (hasReal) {
    try {
      const mount = document.createElement('div');
      applyContentStyle(mount, DEFAULT_THEME.contentStyle);
      const wb = new window.WinBox(title, {
        width: typeof width === 'string' ? width : width + 'px',
        height: typeof height === 'string' ? height : height + 'px',
        x: opts.x ?? 'center',
        y: opts.y ?? 'center',
        class: DEFAULT_THEME.rootClass,
        mount,
        onclose: typeof opts.onclose === 'function' ? opts.onclose : undefined
      });
      if (testId) try { wb.body?.setAttribute?.('data-testid', testId); } catch {}
      try { wb.body?.setAttribute?.('data-winbox-type','real'); } catch {}
      // Ensure body inherits our content style in case mount is replaced by internals
      applyContentStyle(wb.body, DEFAULT_THEME.contentStyle);
      if (opts.fullscreen) { try { wb.maximize(); } catch {} }
      return { type:'real', dom: wb, body: mount, close: () => { try { wb?.close(); } catch {} }, focus: ()=>{ try { wb?.focus?.(); } catch {} } };
    } catch {}
  }
  return createStubWinbox(title, width, height, testId);
}

export async function getOrCreateCardWindow(appId, title, width, height, testId, opts, mountFn){
  const reg = wbRegistry();
  const existing = reg[appId];
  if (existing && existing.dom) { try { existing.focus?.(); } catch {} return existing; }
  const wb = await createWinBox(title, width, height, testId, Object.assign({}, opts, {
    onclose: () => { try { delete reg[appId]; } catch {} }
  }));
  if (wb) {
    reg[appId] = wb;
    try { await mountFn?.(wb); } catch {}
  }
  return wb;
}
