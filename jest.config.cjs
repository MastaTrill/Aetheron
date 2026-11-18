module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'test-app.js',
    'auth/**/*.js',
    'account-abstraction.js',
    'ai-ml.js',
    'analytics.js',
    'api.js',
    'backup-recovery.js',
    'blockchain.js',
    'defi.js',
    'fiat-onramp.js',
    'l2-integration.js',
    'limit-orders.js',
    'multichain.js',
    'rwa-tokenization.js',
    'websocket.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
    '**/*.test.js'
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5
    }
  },
  verbose: true,
  testTimeout: 30000,
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/mobile/',
    '<rootDir>/sdk/',
    '<rootDir>/aetheron-contracts/',
    '<rootDir>/integration-test.js',
    '<rootDir>/test-admin-password.js',
    '<rootDir>/test-game-simulation.js',
    '<rootDir>/test-app.js'
  ]
};
