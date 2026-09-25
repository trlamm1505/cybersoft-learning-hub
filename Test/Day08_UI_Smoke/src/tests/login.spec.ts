import { test, expect } from '../fixtures/base.fixture';
import { LoginPage } from '../pages/login.page';
import { env } from '../utils/env.config';
for (const role of ['STUDENT', 'TEACHER'] as const) {
  test.describe(role, () => {
    test.use({ accountRole: role });
    test('đăng nhập thật, giữ phiên sau reload và đăng xuất', async ({ page, account }) => {
      const login = new LoginPage(page);
      await login.navigate('/login');
      await expect(login.heading).toBeVisible();
      const response = page.waitForResponse(r => r.url() === `${env.apiURL}/auth/login` && r.request().method() === 'POST');
      await login.signIn(account.email, account.password);
      expect((await response).status()).toBe(201);
      await expect(page).toHaveURL(role === 'TEACHER' ? /\/authoring$/ : /\/catalog$/);
      await expect(login.logout).toBeVisible();
      expect(await login.sessionSummary()).toMatchObject({ hasToken: true, user: { id: account.id, email: account.email, role } });
      await page.reload();
      await expect(login.logout).toBeVisible();
      expect(await login.sessionSummary()).toMatchObject({ hasToken: true, user: { id: account.id, role } });
      await login.logout.click();
      await expect(page).toHaveURL(/\/catalog$/);
      await expect(login.guestLogin).toBeVisible();
      expect(await login.sessionSummary()).toEqual({ hasToken: false, user: null });
      await page.reload();
      await expect(login.guestLogin).toBeVisible();
      expect(await login.sessionSummary()).toEqual({ hasToken: false, user: null });
    });
  });
}
test('sai mật khẩu hiển thị lỗi, không tạo phiên', async ({ page, account }) => {
  const login = new LoginPage(page);
  await login.navigate('/login');
  const response = page.waitForResponse(r => r.url() === `${env.apiURL}/auth/login` && r.request().method() === 'POST');
  await login.signIn(account.email, `${account.password}-wrong`);
  expect((await response).status()).toBe(401);
  await expect(login.invalidCredentials).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  expect(await login.sessionSummary()).toEqual({ hasToken: false, user: null });
  await expect(login.guestLogin).toBeVisible();
});
