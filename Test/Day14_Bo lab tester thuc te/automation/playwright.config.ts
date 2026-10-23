import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', workers: 1, retries: 0, timeout: 30_000,
  reporter: [['list'], ['html', { outputFolder: 'reports/html', open: 'never' }]],
  use: {
    headless: true,
    channel: process.env.BROWSER_CHANNEL || undefined,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'demo1', testMatch: /lab11|lab12/, use: { baseURL: 'https://demo1.cybersoft.edu.vn' } },
    { name: 'demo2', testMatch: /lab10/, use: { baseURL: 'https://demo2.cybersoft.edu.vn' } },
  ],
});
