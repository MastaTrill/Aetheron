module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
    browser: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['react'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    indent: ['error', 2],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off' // Optional in modern React
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'mobile/',
    'playwright-report/',
    'dist/',
    'build/',
    'frontend/dist/',
    'frontend/build/',
    '*.min.js',
    '*.bundle.js',
    'bundle.js',
    'public/',
    'static/',
    'assets/',
    'vendor/',
    'lib/',
    'generated/',
    'tmp/',
    'temp/',
    '.next/',
    '.nuxt/',
    '.output/',
    'out/',
    '.cache/',
    '.parcel-cache/',
    'webpack-bundle-analyzer-report.html'
  ]
};
