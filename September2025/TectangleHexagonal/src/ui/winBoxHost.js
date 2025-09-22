/*
 * Thin wrapper around WinBox.js so the window manager stays inside the UI layer.
 * Windows are created lazily and stylesheets are injected on first use.
 */

const DEFAULT_STYLES = [
    'https://cdn.jsdelivr.net/npm/winbox@0.2.82/dist/css/winbox.min.css'
];

let winBoxPromise = null;
const injectedStyles = new Set();
let darkStyleInjected = false;

function ensureStylesheet(href) {
    if (injectedStyles.has(href)) {
        return Promise.resolve();
    }
    if (typeof document === 'undefined') {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => {
            injectedStyles.add(href);
            resolve();
        };
        link.onerror = reject;
        document.head.appendChild(link);
    });
}

function loadWinBoxFromCdn() {
    // Load UMD bundle if ESM import fails
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return reject(new Error('No browser environment'));
        }
        if (window.WinBox) return resolve(window.WinBox);
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/winbox@0.2.82/dist/winbox.bundle.min.js';
        script.async = true;
        script.onload = () => {
            if (window.WinBox) resolve(window.WinBox); else reject(new Error('WinBox UMD not available'));
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export function loadWinBox() {
    if (winBoxPromise) {
        return winBoxPromise;
    }
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('WinBox requires a browser environment'));
    }
    winBoxPromise = import('winbox')
        .then((mod) => mod?.default ?? mod?.WinBox ?? mod)
        .catch(() => loadWinBoxFromCdn());
    return winBoxPromise;
}

export async function ensureWinBoxStyles(extraStyles = []) {
    const styles = [...DEFAULT_STYLES, ...extraStyles];
    await Promise.all(styles.map(ensureStylesheet));
        // Inject dark theme overrides once
        if (!darkStyleInjected && typeof document !== 'undefined') {
                const style = document.createElement('style');
                style.setAttribute('data-winbox-theme', 'dark');
                style.textContent = `
                    /* Default dark theme for WinBox */
                    .winbox.wb-dark { color: #e5e7eb; }
                    .winbox.wb-dark .wb-body { background: #0f172a; color: #e5e7eb; }
                    .winbox.wb-dark .wb-title { color: #e5e7eb; }
                    .winbox.wb-dark .wb-header { background: #111827; border-bottom: 1px solid rgba(255,255,255,0.12); }
                    .winbox.wb-dark .wb-full, .winbox.wb-dark .wb-close, .winbox.wb-dark .wb-min, .winbox.wb-dark .wb-max {
                        filter: invert(1) brightness(0.9);
                    }
                    .winbox.wb-dark .wb-body a { color: #93c5fd; }
                `;
                document.head.appendChild(style);
                darkStyleInjected = true;
        }
}

export async function createWinBoxWindow(options = {}, extraStyles = []) {
    if (typeof window === 'undefined') {
        throw new Error('createWinBoxWindow can only run in a browser context');
    }
    let WinBoxCtor = null;
    try {
        WinBoxCtor = await loadWinBox();
    } catch {}
    try { await ensureWinBoxStyles(extraStyles); } catch {}
    const opts = { ...options };
    if (!opts.title && options.title !== '') {
        opts.title = options.title ?? 'Window';
    }
    // Fallback stub when WinBox library isn't available (e.g., offline e2e)
    if (!WinBoxCtor) {
        const root = document.createElement('div');
        root.className = 'winbox wb-dark';
        const header = document.createElement('div');
        header.className = 'wb-header';
        const title = document.createElement('div');
        title.className = 'wb-title';
        title.textContent = opts.title || 'Window';
        header.appendChild(title);
        const body = document.createElement('div');
        body.className = 'wb-body';
        root.appendChild(header);
        root.appendChild(body);
        // Position minimally
        root.style.position = 'fixed';
        root.style.right = '12px';
        root.style.top = '12px';
        root.style.width = (opts.width ? (opts.width + 'px') : '400px');
        root.style.height = (opts.height ? (opts.height + 'px') : '300px');
        root.style.border = '1px solid rgba(255,255,255,0.12)';
        root.style.background = '#0f172a';
        document.body.appendChild(root);
        const wb = {
            dom: root,
            body,
            close: () => { try { root.remove(); } catch {} },
            onclose: null
        };
        return wb;
    }
    const wb = new WinBoxCtor(opts);
    try {
        // Opt into dark and force inline fallbacks to avoid white-on-white
        const root = wb.dom;
        root?.classList?.add('wb-dark');
        // Prefer CSS custom properties if theme uses them
        try {
            root?.style?.setProperty('--wb-header-bg', '#111827');
            root?.style?.setProperty('--wb-header-fg', '#e5e7eb');
            root?.style?.setProperty('--wb-body-bg', '#0f172a');
            root?.style?.setProperty('--wb-body-fg', '#e5e7eb');
        } catch {}
        // Hard inline background/text colors as a guaranteed override
        const header = root?.querySelector?.('.wb-header');
        const title = root?.querySelector?.('.wb-title');
        const body = wb.body || root?.querySelector?.('.wb-body');
        if (header) header.style.background = '#111827';
        if (title) title.style.color = '#e5e7eb';
        if (body) {
            body.style.background = '#0f172a';
            body.style.color = '#e5e7eb';
        }
    } catch {}
    return wb;
}
