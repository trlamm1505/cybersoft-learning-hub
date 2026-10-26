import { test, type Page } from '@playwright/test';

export class BasePage {
  constructor(readonly page: Page) {}
  async navigate(route: string) {
    await test.step(`Mở ${route}`, async () => {
      await this.page.goto(route, { waitUntil: 'domcontentloaded' });
    });
  }
}
