// Minimal shell-OS style bottom bar using Material Web and WinBox
// WEBWAY:ww-2025-111: Event delegation with composedPath + test markers
// WEBWAY:ww-2025-097: data-testid hooks + progressive Material upgrade for e2e verification
// Contract: initShell({ mount:Element, apps:[{id,title,open:Function}] })
// Progressive enhancement: renders plain buttons first, then upgrades to Material Web if available.

export function initShell({ mount, apps = [] }) {
  if (!mount) return { dispose: () => {} };
  const bar = document.createElement('div');
  bar.setAttribute('data-testid', 'shell-bar');
  // Bottom app bar container styles (Material-like surface)
  bar.style.position = 'fixed';
  bar.style.left = '0';
  bar.style.right = '0';
  bar.style.bottom = '0';
  bar.style.minHeight = '56px';
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.justifyContent = 'flex-start';
  bar.style.gap = '8px';
  bar.style.padding = '8px 12px';
  bar.style.background = 'color-mix(in srgb, var(--md-sys-color-surface, #0b1020) 92%, black)';
  bar.style.borderTop = '1px solid rgba(255,255,255,0.08)';
  bar.style.backdropFilter = 'blur(8px)';
  bar.style.boxShadow = '0 -2px 8px rgba(0,0,0,0.35)';
  bar.style.zIndex = '1000';
  bar.style.color = 'var(--md-sys-color-on-surface, #e5e7eb)';
  // Dark theme for Material Web tokens (shadow DOM components read these)
  try {
    bar.style.setProperty('--md-sys-color-surface', '#0b1020');
    bar.style.setProperty('--md-sys-color-on-surface', '#e5e7eb');
    bar.style.setProperty('--md-sys-color-primary', '#93c5fd');
    bar.style.setProperty('--md-ref-palette-primary40', '#93c5fd');
    bar.style.setProperty('--md-sys-color-surface-container', '#0f172a');
  } catch {}

  // Render plain buttons first (fast, no deps)
  const upgradeQueue = [];
  for (const app of apps) {
    const btn = document.createElement('button');
    btn.textContent = app.title || app.id;
    if (app.id) btn.setAttribute('data-testid', `shell-btn-${app.id}`);
    if (app.id) btn.setAttribute('data-app-id', app.id);
    btn.style.background = 'transparent';
    btn.style.color = 'inherit';
    btn.style.border = '1px solid rgba(255,255,255,0.10)';
    btn.style.borderRadius = '20px';
    btn.style.padding = '8px 12px';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => app.open?.());
    btn.dataset.appId = app.id;
    bar.appendChild(btn);
    upgradeQueue.push({ app, elem: btn });
  }

  mount.appendChild(bar);

  // Try to upgrade to Material Web buttons in-place
  (async () => {
    try {
      const mod = await import('../materialWeb.js');
      await mod.preloadMaterialDefaults();
      await mod.ensureMaterialComponent('md-text-button');
      for (const { app, elem } of upgradeQueue) {
        const mdb = document.createElement('md-text-button');
        mdb.textContent = app.title || app.id;
        if (app.id) mdb.setAttribute('data-testid', `shell-btn-${app.id}`);
        if (app.id) mdb.setAttribute('data-app-id', app.id);
        mdb.addEventListener('click', () => app.open?.());
        // Material sizing to match bottom app bar
        mdb.style.height = '36px';
        mdb.style.lineHeight = '36px';
        mdb.style.borderRadius = '20px';
        mdb.style.padding = '0 10px';
        // Replace node
        elem.replaceWith(mdb);
      }
    } catch { /* keep plain buttons */ }
  })();

  // Event delegation as a safety net so clicks still work after upgrades
  const onClick = (ev) => {
    try {
      let target = ev.target;
      // Traverse composed path to find host element with our attributes
      const path = (ev.composedPath && ev.composedPath()) || [];
      for (const node of path) {
        if (node && node.getAttribute) {
          if (node.getAttribute('data-app-id') || (node.getAttribute('data-testid')||'').startsWith('shell-btn-')) { target = node; break; }
        }
      }
      if (!target || !target.getAttribute) return;
      const idAttr = target.getAttribute('data-app-id') || target.getAttribute('data-testid')?.replace('shell-btn-','');
      if (!idAttr) return;
  try { window.__wbTest = window.__wbTest || {}; window.__wbTest.lastClick = idAttr; window.__wbTest[idAttr] = true; } catch {}
      const app = apps.find(a => a.id === idAttr);
      app?.open?.();
    } catch {}
  };
  // Capture phase improves reliability with Shadow DOM components
  bar.addEventListener('click', onClick, true);

  return { dispose: () => mount.removeChild(bar) };
}
