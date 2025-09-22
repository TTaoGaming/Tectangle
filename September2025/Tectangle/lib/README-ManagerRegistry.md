# ManagerRegistry — Usage example

This file shows a minimal usage example for the enhanced ManagerRegistry.

Example (ES module):

import registry from '../src/ManagerRegistry.js';
import wiring from './manager-wiring.js';

(async () => {
  // Create and register instances from the canonical wiring
  await registry.createAllFromWiring(wiring);

  // Start lifecycle for registered managers (calls start() if present)
  const result = await registry.runLifecycle('start');

  // Inspect result
  console.log('lifecycle result:', result);
})();

Notes:
- Wiring entries may reference other managers using { ref: "ManagerName" } or the string "ref:ManagerName".
- Use registry.clear() in tests to isolate state.