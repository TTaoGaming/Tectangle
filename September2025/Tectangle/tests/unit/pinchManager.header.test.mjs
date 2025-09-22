import assert from 'assert';
import PinchManager, { __HEADER__ as PINCH_HEADER } from '../../src/managers/PinchManager.js';

describe('PinchManager header', function() {
  it('exports header constant and default class', function() {
    assert.strictEqual(typeof PINCH_HEADER, 'string');
    assert.ok(PINCH_HEADER.startsWith('PinchManager'));
    assert.strictEqual(typeof PinchManager, 'function');
    const inst = new PinchManager();
    assert.strictEqual(typeof inst.processFrame, 'function');
    const res = inst.init();
    assert.strictEqual(res && res.ok, true);
    const p = inst.processFrame({ frameId: 123 });
    assert.deepStrictEqual(p, { processed: true, frameId: 123 });
    inst.destroy();
  });
});