import assert from 'node:assert';

describe('touchSynth', () => {
  it('emits TAP event when down-up under tap threshold');
  it('emits DOUBLE_TAP when two taps within double tap window');
  it('promotes to DRAG when movement exceeds threshold');
});
