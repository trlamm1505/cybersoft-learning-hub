import { test, expect } from '@playwright/test';

const demoUser = process.env.DEMO2_USER;

// demo2 có HAI form dùng chung name="taiKhoan"/"matKhau" (đăng ký và đăng nhập), nên không dùng
// .last() hay class CSS. Chọn form đăng nhập theo vai trò: form chứa nút "Đăng nhập".
async function loginForm(page: import('@playwright/test').Page) {
  await page.goto('/login');
  const form = page.locator('form').filter({ has: page.getByRole('button', { name: /đăng nhập/i }) });
  const user = form.getByPlaceholder('Tài khoản');
  const password = form.getByPlaceholder('Mật khẩu');
  const submit = form.getByRole('button', { name: /đăng nhập/i });
  await expect(form).toHaveCount(1);
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
