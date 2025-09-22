// WEBWAY:ww-2025-032: Tailwind UI guards (ready|experimental|placeholder|disabled)
// Usage: const g = createGuards({ mount: document }); g.apply('#btnStart', 'ready');

export function createGuards({ mount=document }={}){
  const classes = {
    ready: 'opacity-100 pointer-events-auto',
    experimental: 'opacity-90 ring-1 ring-amber-400/50',
    placeholder: 'opacity-40 pointer-events-none cursor-not-allowed',
    disabled: 'opacity-50 pointer-events-none cursor-not-allowed'
  };
  const badges = {
    experimental: 'EXPERIMENTAL',
    placeholder: 'PLACEHOLDER',
    disabled: 'DISABLED'
  };

  function mark(el, state){
    if(!el) return;
    // reset state classes
    el.classList.remove(...Object.values(classes).flatMap(s=>s.split(' ')));
    if(classes[state]) el.classList.add(...classes[state].split(' '));
    // decorate with a corner badge for non-ready
    const badgeText = badges[state];
    const existing = el.querySelector('[data-guard-badge]');
    if(badgeText){
      if(!existing){
        const b = mount.createElement('span');
        b.dataset.guardBadge = '1';
        b.className = 'select-none absolute -top-1 -right-1 text-[9px] px-1 py-0.5 rounded bg-slate-700 text-slate-200 shadow';
        b.textContent = badgeText;
        el.classList.add('relative');
        el.appendChild(b);
      } else {
        existing.textContent = badgeText;
      }
    } else {
      if(existing) existing.remove();
    }
    // aria hooks
    el.setAttribute('aria-disabled', state==='disabled' || state==='placeholder' ? 'true' : 'false');
  }

  function apply(selectorOrEl, state){
    const els = typeof selectorOrEl === 'string' ? mount.querySelectorAll(selectorOrEl) : [selectorOrEl];
    els.forEach(el => mark(el, state));
  }

  return { apply };
}
