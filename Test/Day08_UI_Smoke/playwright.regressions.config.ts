import { defineConfig } from '@playwright/test';
import smoke from './playwright.config';
export default defineConfig({ ...smoke, testDir: './regressions', retries: 0,
  outputDir: 'reports/regressions/test-results',
  reporter: [['list'], ['html', { outputFolder: 'reports/regressions/html', open: 'never' }], ['junit', { outputFile: 'reports/regressions/junit.xml' }]],
});
