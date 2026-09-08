module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/\\.claude/'],
  modulePathIgnorePatterns: ['/\\.claude/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/\\.claude/'],
};
