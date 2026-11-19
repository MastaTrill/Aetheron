import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:3001',
    browserName: 'chromium',
    headless: true
  },
  webServer: {
    // test-app.js is the Jest fixture and does not listen; e2e needs server.js
    // which serves admin-dashboard.html and the WebSocket endpoint.
    command: 'node server.js',
    port: 3001,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      PORT: '3001',
      NODE_ENV: process.env.NODE_ENV || 'test',
      JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key',
      ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123'
    }
  },
  reporter: 'html'
});
