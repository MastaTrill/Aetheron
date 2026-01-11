import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:3001',
    browserName: 'chromium',
    headless: true
  },
  webServer: {
    command: 'node test-app.js',
    port: 3001,
    reuseExistingServer: !process.env.CI
  },
  reporter: 'html'
});
