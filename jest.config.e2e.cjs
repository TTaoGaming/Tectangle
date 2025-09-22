module.exports = {
  preset: 'jest-puppeteer',
  testTimeout: 60000,
  testMatch: [
    '**/September2025/TectangleHexagonal/tests/e2e/**/*.test.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/September2025/TectangleHexagonal/tests/e2e/setupImageSnapshot.js'
  ],
  roots: [
    '<rootDir>/September2025/TectangleHexagonal',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/archive-stale',
    '<rootDir>/archive-2025-09-01T19-13-05Z',
    '<rootDir>/mediapipe-master-referenceonly',
    '<rootDir>/human-main-referenceonly/human-main/test',
  ],
};