// Extend jest with image snapshot matcher if available; otherwise mark a flag to skip
try {
  const { toMatchImageSnapshot } = require('jest-image-snapshot');
  expect.extend({ toMatchImageSnapshot });
  global.__IMG_SNAPSHOT__ = true;
} catch (e) {
  // Library not installed; tests will skip gracefully
  // eslint-disable-next-line no-undef
  global.__IMG_SNAPSHOT__ = false;
}
