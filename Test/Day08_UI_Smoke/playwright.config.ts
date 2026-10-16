import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { env } from './src/utils/env.config';
export default defineConfig({
  testDir: './src/tests', workers: 1, fullyParallel: false,
  forbidOnly: !!process.env.CI, retries: process.env.CI ? 1 : 0,
  timeout: 45_000, expect: { timeout: 10_000 },
  globalSetup: './src/setup/global-setup.ts', globalTeardown: './src/setup/global-teardown.ts',
  outputDir: 'test-results',
  reporter: [['list'], ['html', { outputFolder: 'reports/html', open: 'never' }], ['junit', { outputFile: 'reports/junit.xml' }]],
  use: { baseURL: env.baseURL, headless: true, viewport: { width: 1920, height: 1080 },
    channel: process.env.BROWSER_CHANNEL || undefined,
    screenshot: 'only-on-failure', video: 'retain-on-failure', trace: 'retain-on-failure',
    actionTimeout: 10_000, navigationTimeout: 20_000 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    { command: process.env.DAY08_BE_PREBUILT === '1' ? 'node dist/main' : 'node node_modules/@nestjs/cli/bin/nest.js start', cwd: path.resolve(__dirname, '../../learning-hub/BE'),
      url: env.apiURL, timeout: 120_000, reuseExistingServer: false,
      env: { DATABASE_URL: env.databaseURL, PORT: String(env.apiPort), JWT_SECRET: `day08-test-only-${env.runId}` } },
    { command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${env.uiPort} --strictPort`,
      cwd: path.resolve(__dirname, '../../learning-hub/FE'), url: env.baseURL, timeout: 60_000,
      reuseExistingServer: false, env: { VITE_API_URL: env.apiURL } }
  ]
});
