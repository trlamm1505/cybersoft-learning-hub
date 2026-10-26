import { BasePage } from './base.page';

export class CodePage extends BasePage {
  readonly selector = this.page.getByRole('combobox');
  readonly editor = this.page.getByRole('textbox', { name: '', exact: true });
  readonly submitButton = this.page.getByRole('button', { name: '✓ Submit', exact: true });
  result(label: string) { return this.page.getByText(label, { exact: true }); }
  passedCount(passed: number) { return this.page.getByText(`${passed}/2 test passed`, { exact: true }); }
  titleHeading(title: string) { return this.page.getByRole('heading', { name: title, exact: true }); }
  async select(slug: string) { await this.selector.selectOption(slug); }
  async enterCode(code: string) {
    await this.editor.fill(code);
  }
  async submit() { await this.submitButton.click(); }
}
