import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:3001',
    browserName: 'chromium',
    headless: true
  },
  webServer: {
    command: "node --input-type=module -e \"import('./test-app.js').then(({ app }) => app.listen(3001, '127.0.0.1'))\"",
    port: 3001,
    reuseExistingServer: !process.env.CI
  },
  reporter: 'html'
});
