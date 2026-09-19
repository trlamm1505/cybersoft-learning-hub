import { Page } from '@playwright/test';
import { BasePage } from './base.page';
export class LoginPage extends BasePage {
  constructor(page: Page) { super(page); }
  readonly heading = this.page.getByRole('heading', { name: 'Đăng nhập', exact: true });
  readonly logout = this.page.getByRole('banner').getByRole('button', { name: 'Đăng xuất', exact: true });
  readonly guestLogin = this.page.getByRole('banner').getByRole('button', { name: 'Đăng nhập', exact: true });
  readonly invalidCredentials = this.page.getByText('Email hoặc mật khẩu không chính xác.', { exact: true });
  async signIn(email: string, password: string) {
    await this.page.getByPlaceholder('ban@example.com', { exact: true }).fill(email);
    await this.page.getByPlaceholder('••••••••', { exact: true }).fill(password);
    await this.page.locator('form').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  }
  async sessionSummary() {
    return this.page.evaluate(() => ({
      hasToken: !!localStorage.getItem('token'),
      user: JSON.parse(localStorage.getItem('app_auth_user') || 'null'),
    }));
  }
}
