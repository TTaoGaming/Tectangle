// Mocha-style pending tests (WEBWAY:ww-2025-095 guard-friendly scaffold)
import assert from 'node:assert';

describe('gateFsm', () => {
  it('transitions from SEARCH to READY after K open frames');
  it('enforces cooldown after FIRED state');
});
