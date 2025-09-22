import assert from 'assert';
import eventBus from '../../../src/EventBusManager.js';

// Test: publishing an envelope containing handSessionId should result in controllerId being present (normalization shim)
const env = eventBus.publish('UnitTest', 'test:event', { handSessionId: 42 }, { severity: 'debug' }, null);
if (!env || !env.detail) throw new Error('No envelope returned from eventBus.publish');
assert.strictEqual(env.detail.controllerId, 42, `Expected controllerId === 42, got ${env.detail.controllerId}`);

const recent = eventBus.getRecent(1)[0];
if (!recent || !recent.detail) throw new Error('getRecent returned no recent envelope');
assert.strictEqual(recent.detail.controllerId, 42, `getRecent did not include controllerId, got ${recent.detail.controllerId}`);

console.log('tests/unit/eventbus.normalization.test.mjs: PASS');