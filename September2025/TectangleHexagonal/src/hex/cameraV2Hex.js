/*
WEBWAY:ww-2025-102: V2 Hex adapter (strangler) (expires 2025-10-06)
Contract:
- registerV2Runtime(runtime) -> { appId, dispose }
- Facade fields: getState, getSeat, getGesture, getStableIds, setSeatConfig, setGhosts
*/

import { registerHexApp } from './hexRegistry.js';

export function registerV2Runtime(runtime) {
  const appId = 'hex:camera:v2';
  if (!runtime) throw new Error('registerV2Runtime requires runtime');
  const api = {
    getState: () => runtime.getState?.() ?? null,
    getSeat: () => runtime.getSeat?.() ?? null,
    getGesture: () => runtime.getGesture?.() ?? null,
    getStableIds: () => runtime.getStableIds?.() ?? [],
    setSeatConfig: (cfg) => runtime.setSeatConfig?.(cfg),
    setGhosts: (b) => runtime.setGhosts?.(b)
  };
  const dispose = registerHexApp(appId, api);
  return { appId, dispose };
}

export default { registerV2Runtime };
