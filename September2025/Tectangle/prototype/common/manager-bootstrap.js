// DEPRECATED: manager-bootstrap removed — use ManagerRegistry + wiring instead.
// This shim prevents accidental reuse of the old bootstrap and makes the
// replacement explicit. Existing prototypes should import the ManagerRegistry
// and call createAllFromWiring(...) + runLifecycle('start').
console.warn('manager-bootstrap removed: use ManagerRegistry.createAllFromWiring(...) and registry.runLifecycle(\"start\")');

export async function bootstrapManagers() {
  throw new Error('manager-bootstrap removed. Use ManagerRegistry.createAllFromWiring(...) and registry.runLifecycle(\"start\") instead.');
}

const ready = (async () => {
  throw new Error('manager-bootstrap removed');
})();
export default ready;
