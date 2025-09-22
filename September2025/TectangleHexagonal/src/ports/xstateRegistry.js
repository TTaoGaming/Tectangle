// XState Registry: lightweight global mapping of name -> actor (machine instance)
// Allows WinBox inspector and other tools to discover running actors safely.
const REGISTRY = new Map();

export function registerActor(name, actor) {
  if (!name || !actor) return () => {};
  REGISTRY.set(String(name), actor);
  try {
    if (typeof window !== 'undefined') {
      window.__xstateRegistry = window.__xstateRegistry || {};
      window.__xstateRegistry[name] = actor;
    }
  } catch {}
  return () => {
    REGISTRY.delete(String(name));
    try { if (window?.__xstateRegistry) delete window.__xstateRegistry[name]; } catch {}
  };
}

export function listActors() {
  return Array.from(REGISTRY.keys());
}

export function getActor(name) {
  return REGISTRY.get(String(name)) || null;
}

export function clearRegistry() {
  REGISTRY.clear();
  try { if (window?.__xstateRegistry) window.__xstateRegistry = {}; } catch {}
}
