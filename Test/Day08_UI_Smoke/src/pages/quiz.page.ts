import { BasePage } from './base.page';

export class QuizPage extends BasePage {
  readonly startButton = this.page.getByRole('button', { name: /^Bắt Đầu Làm Bài Trắc Nghiệm/ });
  readonly submitButton = this.page.getByRole('button', { name: 'Nộp Bài Thi Trắc Nghiệm', exact: true });
  readonly confirmButton = this.page.getByRole('button', { name: 'Nộp bài ngay', exact: true });
  readonly successHeading = this.page.getByRole('heading', { name: 'Chúc Mừng! Bạn Đã Hoàn Thành Bài Thi', exact: true });
  readonly failedHeading = this.page.getByRole('heading', { name: 'Kết Quả Bài Trắc Nghiệm', exact: true });
  questionHeading(text: string) { return this.page.getByRole('heading', { name: text, exact: true }); }
  answer(text: string) { return this.page.getByRole('button', { name: new RegExp(`^[A-D] ${text}$`) }); }
  score(value: string) { return this.page.getByText(value, { exact: true }); }
  explanation(text: string) { return this.page.getByText(text, { exact: true }); }
  readonly nextButton = this.page.getByRole('button', { name: 'Câu Tiếp', exact: true });
  readonly previousButton = this.page.getByRole('button', { name: 'Câu Trước', exact: true });
  readonly cancelSubmit = this.page.getByRole('button', { name: 'Tiếp tục làm bài', exact: true });
  readonly confirmHeading = this.page.getByRole('heading', { name: 'Xác nhận nộp bài thi?', exact: true });
  readonly retakeButton = this.page.getByRole('button', { name: 'Làm Lại Bài Thi Mới', exact: true });
  questionNumber(number: number) { return this.page.getByRole('button', { name: String(number), exact: true }); }
  reviewCard(content: string) {
    // Review markup has no region label: the h4's immediate parent is its question card.
    return this.page.getByRole('heading', { level: 4, name: content, exact: true }).locator('..');
  }
  async selectTopic(title: string, questionCount: number) {
    // Clickable topic div has no role. Scope by observed h3 and question-count text.
    await this.page.getByRole('heading', { level: 3, name: title, exact: true })
      .locator('..').locator('..').filter({ hasText: `${questionCount} câu hỏi` }).click();
  }
  async start() { await this.startButton.click(); }
  async submit() {
    await this.submitButton.click();
    await this.confirmButton.click();
  }
}
