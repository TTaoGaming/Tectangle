// Mocha-style pending tests (WEBWAY:ww-2025-095 guard-friendly scaffold)
import assert from 'node:assert';

describe('predictorSidecar', () => {
  it('issues PREPARE_DOWN ahead of confirmed down');
  it('cancels when confirmation window expires');
});
