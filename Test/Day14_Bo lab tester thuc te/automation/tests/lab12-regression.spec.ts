import { test, expect } from '@playwright/test';
test('@smoke LAB-12 danh sách có link phim duy nhất theo href', async ({ page }) => {
  await page.goto('/');
  const movieLinks = page.locator('a[href*="/detail/"]');
  await expect(movieLinks.first()).toBeVisible({ timeout: 15_000 });
  const hrefs = await movieLinks.evaluateAll(es => es.map(e => e.getAttribute('href')).filter(Boolean));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(new Set(hrefs).size).toBeGreaterThanOrEqual(3);
});
for (let i = 0; i < 3; i++) test(`LAB-12 data-driven mở phim vị trí ${i + 1}`, async ({ page }) => {
  await page.goto('/');
  const links = page.locator('a[href*="/detail/"]');
  await expect(links.first()).toBeVisible({ timeout: 15_000 });
  const unique = await links.evaluateAll(es => [...new Set(es.map(e => e.getAttribute('href')).filter(Boolean))]);
  test.skip(unique.length <= i, 'Demo hiện không đủ dữ liệu phim');
  await page.goto(unique[i]!);
  await expect(page).toHaveURL(/\/detail\/\d+/);
});
