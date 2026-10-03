import { test, expect } from '@playwright/test';
test('@smoke LAB-11 mở phim đầu tiên đến trang chi tiết', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('a[href*="/detail/"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  expect(href).toMatch(/\/detail\/\d+/);
  await link.click();
  await expect(page).toHaveURL(/\/detail\/\d+/);
});
test.skip('LAB-11 đi tới sơ đồ ghế và dừng trước giao dịch', async ({ page }) => {
  // Hoàn thiện sau khi xác nhận suất chiếu còn hiệu lực; không thanh toán/đặt vé thật.
});
