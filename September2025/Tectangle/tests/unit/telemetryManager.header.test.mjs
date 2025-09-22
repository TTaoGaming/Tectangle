import assert from 'assert';
import TelemetryManager, { __HEADER__ as TELE_HEADER } from '../../src/managers/TelemetryManager.js';

describe('TelemetryManager header', function() {
  it('exports header constant and default class', function() {
    assert.strictEqual(typeof TELE_HEADER, 'string');
    assert.ok(TELE_HEADER.startsWith('TelemetryManager'));
    assert.strictEqual(typeof TelemetryManager, 'function');
    const t = new TelemetryManager();
    const ok = t.record({ manager: 'Test', event: 'x' });
    assert.strictEqual(ok, true);
    const flushed = t.flush();
    assert.deepStrictEqual(flushed, [{ manager: 'Test', event: 'x' }]);
    t.destroy();
  });
});