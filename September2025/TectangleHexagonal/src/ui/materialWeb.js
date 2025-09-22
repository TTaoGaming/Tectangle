/*
 * Lightweight registry for Material Web components used by Hexagonal demos.
 * Import helpers from here so component registration stays centralized.
 */

// Primary loaders use bare specifiers; we'll add a robust fallback to /node_modules for browser-only environments
const componentLoaders = new Map([
    ['md-filled-button', () => import('@material/web/button/filled-button.js')],
    ['md-outlined-button', () => import('@material/web/button/outlined-button.js')],
    ['md-tonal-button', () => import('@material/web/button/filled-tonal-button.js')],
    ['md-text-button', () => import('@material/web/button/text-button.js')],
    ['md-elevated-button', () => import('@material/web/button/elevated-button.js')],
    ['md-icon-button', () => import('@material/web/iconbutton/icon-button.js')],
    ['md-fab', () => import('@material/web/fab/fab.js')],
    ['md-switch', () => import('@material/web/switch/switch.js')],
    ['md-slider', () => import('@material/web/slider/slider.js')],
    ['md-checkbox', () => import('@material/web/checkbox/checkbox.js')],
    ['md-radio', () => import('@material/web/radio/radio.js')]
]);

// Fallback module paths for direct browser loading from /node_modules (served by http-server)
const componentFallbackPaths = new Map([
    ['md-filled-button', 'button/filled-button.js'],
    ['md-outlined-button', 'button/outlined-button.js'],
    ['md-tonal-button', 'button/filled-tonal-button.js'],
    ['md-text-button', 'button/text-button.js'],
    ['md-elevated-button', 'button/elevated-button.js'],
    ['md-icon-button', 'iconbutton/icon-button.js'],
    ['md-fab', 'fab/fab.js'],
    ['md-switch', 'switch/switch.js'],
    ['md-slider', 'slider/slider.js'],
    ['md-checkbox', 'checkbox/checkbox.js'],
    ['md-radio', 'radio/radio.js']
]);

const loaded = new Set();
const customElementRegistry = typeof globalThis !== 'undefined' ? globalThis.customElements : undefined;

export async function ensureMaterialComponent(tagName) {
    const tag = tagName.toLowerCase();
    if (loaded.has(tag)) {
        return;
    }
    loaded.add(tag);
    if (!customElementRegistry) {
        return;
    }
    if (customElementRegistry.get(tag)) {
        return;
    }
    const loader = componentLoaders.get(tag);
    if (!loader) {
        throw new Error(`Material Web component loader missing for ${tag}`);
    }
    try {
        await loader();
    } catch (e) {
        // Attempt browser-friendly fallback from /node_modules when bare specifier fails
        const rel = componentFallbackPaths.get(tag);
        if (!rel) throw e;
        const url = `/node_modules/@material/web/${rel}`;
        await import(url);
    }
}

export async function preloadMaterialDefaults() {
    const defaults = [
        'md-filled-button',
        'md-outlined-button',
        'md-text-button',
        'md-icon-button',
        'md-switch',
        'md-slider'
    ];
    await Promise.all(defaults.map(ensureMaterialComponent));
}

export function registerMaterialComponent(tagName, loader) {
    const tag = tagName.toLowerCase();
    componentLoaders.set(tag, loader);
    loaded.delete(tag);
}
