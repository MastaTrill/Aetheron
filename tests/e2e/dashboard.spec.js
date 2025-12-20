// E2E tests for admin dashboard
const { test, expect } = require('@playwright/test');

test.describe('Admin Dashboard E2E', () => {
  const credentials = { username: 'admin', password: 'admin123' };

  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Aetheron Admin Dashboard/);
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for login modal
    await page.waitForSelector('#login-modal');

    // Fill credentials
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForSelector('#login-modal', { state: 'hidden' });
    await expect(page.locator('h1')).toContainText('Aetheron');
  });

  test('should display WebSocket connection status', async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // Wait for WebSocket connection
    await page.waitForSelector('#ws-status', { timeout: 10000 });
    const status = await page.textContent('#ws-status');
    expect(status).toContain('Connected');
  });

  test('should show stats on dashboard', async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // Wait for stats
    await page.waitForSelector('#stats');
    const statsText = await page.textContent('#stats');
    expect(statsText).toBeTruthy();
  });

  test('should navigate to different sections', async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // Click sidebar links
    await page.click('#sidebar a[href="#logs"]');
    await page.waitForTimeout(500);

    // Check if logs section is visible
    const logsSection = page.locator('#logs');
    await expect(logsSection).toBeInViewport();
  });

  test('should display logs table', async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // Navigate to logs
    await page.click('#sidebar a[href="#logs"]');

    // Check table exists
    await expect(page.locator('#logs-table')).toBeVisible();
  });

  test('should filter logs by level', async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // Navigate to logs
    await page.click('#sidebar a[href="#logs"]');

    // Select filter
    await page.selectOption('#log-level-filter', 'INFO');
    await page.waitForTimeout(500);

    // Table should still be visible
    await expect(page.locator('#logs-table')).toBeVisible();
  });

  test('should open AI chat', async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // AI chat should be visible
    await expect(page.locator('#ai-chat')).toBeVisible();
  });

  test('should handle chat message', async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // Send chat message
    await page.fill('#chat-input', 'Test message');
    await page.click('#chat-form button[type="submit"]');

    // Input should be cleared
    const inputValue = await page.inputValue('#chat-input');
    expect(inputValue).toBe('');
  });

  test('should export data', async ({ page }) => {
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // Setup download handler
    const downloadPromise = page.waitForEvent('download');

    // Click export
    await page.click('#export-data');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Login
    await page.fill('input[name="user"]', credentials.username);
    await page.fill('input[name="pass"]', credentials.password);
    await page.click('button[type="submit"]');

    // Dashboard should still be visible
    await expect(page.locator('h1')).toBeVisible();
  });
});
