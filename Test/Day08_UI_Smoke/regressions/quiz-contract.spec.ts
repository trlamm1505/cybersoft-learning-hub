import { test, expect } from '../src/fixtures/base.fixture';
import { QuizPage } from '../src/pages/quiz.page';
import { env } from '../src/utils/env.config';
test.use({ questionCount: 20 });
test('BUG-01: Python phải khớp giới thiệu 10 câu và 15 phút', async ({ page, seed, authenticated }) => {
  const quiz = new QuizPage(page);
  await quiz.navigate('/quiz');
  await quiz.selectTopic('Bài Trắc Nghiệm Python Căn Bản', 10);
  await expect(page.getByText('10 Câu trắc nghiệm', { exact: true })).toBeVisible();
  await expect(page.getByText('15 Phút', { exact: true })).toBeVisible();
  const pending = page.waitForResponse(r => r.url() === `${env.apiURL}/quiz/start` && r.request().method() === 'POST');
  await quiz.start();
  const attempt = await (await pending).json();
  expect.soft(attempt.questions, 'Đề Python được quảng bá 10 câu').toHaveLength(10);
  expect.soft(attempt.timeLimitSeconds, 'Đề Python được quảng bá 15 phút').toBe(900);
});
test('BUG-02: lượt quiz phải thuộc tài khoản vừa đăng nhập', async ({ page, seed, account, authenticated }) => {
  const quiz = new QuizPage(page);
  await quiz.navigate('/quiz');
  const pending = page.waitForResponse(r => r.url() === `${env.apiURL}/quiz/start` && r.request().method() === 'POST');
  await quiz.start();
  const response = await pending;
  expect(response.request().postDataJSON().userId, 'userId không được cố định chung cho mọi học viên').toBe(account.id);
});
