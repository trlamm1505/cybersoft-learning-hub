import { test, expect } from '@playwright/test';

const demoUser = process.env.DEMO2_USER;
const demoPassword = process.env.DEMO2_PASSWORD;

// Không lưu trace/screenshot cho ca nhập secret. HTML report chỉ giữ kết luận đã làm sạch.
test.use({ trace: 'off', screenshot: 'off' });

test('LAB-10 tài khoản hợp lệ đăng nhập thành công', async ({ page }) => {
  test.skip(!demoUser || !demoPassword, 'Đặt DEMO2_USER và DEMO2_PASSWORD trong environment để chạy ca này.');
  await page.goto('/login');
  const user = page.locator('input[name="taiKhoan"]').last();
  const password = page.locator('input[name="matKhau"]').last();
  const submit = page.locator('.sign-in-container form').getByRole('button', { name: /đăng nhập/i });
  await user.fill(demoUser!);
  await password.fill(demoPassword!);
  await submit.click();
  const authError = page.getByRole('dialog');
  await Promise.race([
    page.waitForURL((url) => !/\/login(?:\?.*)?$/.test(url.toString()), { timeout: 15_000 }),
    authError.waitFor({ state: 'visible', timeout: 15_000 }),
  ]);
  if (await authError.isVisible()) {
    const message = await authError.innerText();
    await password.fill('');
    throw new Error(`BLOCKED: demo2 từ chối tài khoản test — ${message}`);
  }
  await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/, { timeout: 15_000 });
});
