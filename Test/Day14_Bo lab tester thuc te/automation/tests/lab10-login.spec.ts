import { test, expect } from '@playwright/test';

const demoUser = process.env.DEMO2_USER;

async function loginForm(page: import('@playwright/test').Page) {
  await page.goto('/login');
  const user = page.locator('input[name="taiKhoan"]').last();
  const password = page.locator('input[name="matKhau"]').last();
  const submit = page.locator('.sign-in-container form').getByRole('button', { name: /đăng nhập/i });
  await expect(user).toBeVisible();
  await expect(password).toBeVisible();
  await expect(submit).toBeVisible();
  return { user, password, submit };
}

test('@smoke LAB-10 form đăng nhập hiện đúng trường', async ({ page }) => {
  await loginForm(page);
});

test('LAB-10 bỏ trống thông tin không được rời trang đăng nhập', async ({ page }) => {
  const { submit } = await loginForm(page);
  await submit.click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});

test('LAB-10 sai mật khẩu không được đăng nhập', async ({ page }) => {
  test.skip(!demoUser, 'Đặt DEMO2_USER trong environment để chạy ca này.');
  const { user, password, submit } = await loginForm(page);
  await user.fill(demoUser!);
  await password.fill(`wrong-${Date.now()}`);
  await submit.click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});

