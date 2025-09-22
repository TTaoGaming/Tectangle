/*
 * Hexagonal port that centralizes XState usage.
 * Import from this module instead of `xstate` directly so we can swap or mock the runtime.
 * Browser-friendly: falls back to loading from /node_modules if bare specifier fails.
 */

let xstateMod = null;
try {
    // Node/test and environments with import maps
    xstateMod = await import('xstate');
} catch (e) {
    // Browser http-server fallbacks (try known ESM entry points in order)
    const candidates = [
        '/node_modules/xstate/xstate.esm.js',
        '/node_modules/xstate/dist/xstate.esm.js',
        '/node_modules/xstate/dist/xstate.development.esm.js',
        // UMD can work via dynamic import in some browsers, but prefer ESM
        '/node_modules/xstate/xstate.umd.min.js'
    ];
    for (const path of candidates) {
        try {
            xstateMod = await import(path);
            if (xstateMod) break;
        } catch {}
    }
    if (!xstateMod) {
        // Last resort: leave null; wrappers will throw with guidance
        xstateMod = null;
    }
}

function missing() {
    throw new Error('XState runtime not available. Ensure node_modules is served (http-server) or add an import map for \"xstate\".');
}

export const XState = Object.freeze({
    createMachine: (...a) => (xstateMod?.createMachine || missing())(...a),
    createActor: (...a) => (xstateMod?.createActor || missing())(...a),
    assign: (...a) => (xstateMod?.assign || missing())(...a),
    setup: (...a) => (xstateMod?.setup || missing())(...a),
    fromPromise: (...a) => (xstateMod?.fromPromise || missing())(...a),
    fromObservable: (...a) => (xstateMod?.fromObservable || missing())(...a),
    stateIn: (...a) => (xstateMod?.stateIn || missing())(...a),
    interpret: (...a) => (xstateMod?.interpret || missing())(...a),
    waitFor: (...a) => (xstateMod?.waitFor || missing())(...a),
    enqueueActions: (...a) => (xstateMod?.enqueueActions || missing())(...a),
    transition: (...a) => (xstateMod?.transition || missing())(...a)
});

export function createMachine(...args) { return (xstateMod?.createMachine || missing())(...args); }
export function createActor(...args) { return (xstateMod?.createActor || missing())(...args); }
export function assign(...args) { return (xstateMod?.assign || missing())(...args); }
export function setup(...args) { return (xstateMod?.setup || missing())(...args); }
export function fromPromise(...args) { return (xstateMod?.fromPromise || missing())(...args); }
export function fromObservable(...args) { return (xstateMod?.fromObservable || missing())(...args); }
export function interpret(...args) { return (xstateMod?.interpret || missing())(...args); }
export function waitFor(...args) { return (xstateMod?.waitFor || missing())(...args); }
export function enqueueActions(...args) { return (xstateMod?.enqueueActions || missing())(...args); }
export function stateIn(...args) { return (xstateMod?.stateIn || missing())(...args); }
export function transition(...args) { return (xstateMod?.transition || missing())(...args); }

export function createHexMachine(config, options) {
    return (xstateMod?.createMachine || missing())(config, options);
}

export function createHexActor(machine, options) {
    return (xstateMod?.createActor || missing())(machine, options);
}
