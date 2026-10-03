import { ObjectId } from 'mongodb';
import { test, expect } from '../fixtures/base.fixture';
import { QuizPage } from '../pages/quiz.page';
import { env } from '../utils/env.config';

test.use({ questionCount: 20 });
test('20 câu: điều hướng, hủy nộp, kết quả 40/200, review và làm lại', async ({ page, seed, authenticated }, testInfo) => {
  test.setTimeout(90_000);
  const quiz = new QuizPage(page);
  await quiz.navigate('/quiz');
  const started = page.waitForResponse(r => r.url() === `${env.apiURL}/quiz/start` && r.request().method() === 'POST');
  await quiz.start();
  const response = await started;
  expect(response.status()).toBe(201);
  const attempt = await response.json();
  expect(attempt.questions).toHaveLength(20);
  await expect(quiz.previousButton).toBeDisabled();
  await expect(page.getByText('Đã chọn 0/20', { exact: true })).toBeVisible();
  for (let i = 0; i < 20; i++) {
    await expect(quiz.questionHeading(attempt.questions[i].content)).toBeVisible();
    await quiz.answer(i < 4 ? 'Hai' : 'Ba').click();
    if (i < 19) await quiz.nextButton.click();
  }
  await expect(quiz.nextButton).toBeDisabled();
  await expect(page.getByText('Đã chọn 20/20', { exact: true })).toBeVisible();
  await quiz.questionNumber(1).click();
  await expect(quiz.questionHeading(attempt.questions[0].content)).toBeVisible();
  await expect(quiz.questionNumber(1)).toHaveAttribute('title', 'Câu 1: Đã chọn đáp án');
  await quiz.questionNumber(20).click();
  await quiz.previousButton.click();
  await expect(quiz.questionHeading(attempt.questions[18].content)).toBeVisible();
  await quiz.nextButton.click();
  await quiz.submitButton.click();
  await expect(quiz.confirmHeading).toBeVisible();
  await expect(page.getByText('20/20', { exact: true })).toBeVisible();
  await quiz.cancelSubmit.click();
  await expect(quiz.confirmHeading).toBeHidden();
  expect(await seed.db.collection('quizattempts').findOne({ _id: new ObjectId(attempt.attemptId) })).toMatchObject({ status: 'IN_PROGRESS' });
  const submitted = page.waitForResponse(r => r.url() === `${env.apiURL}/quiz/${attempt.attemptId}/submit` && r.request().method() === 'POST');
  await quiz.submit();
  expect((await submitted).status()).toBe(201);
  await expect(quiz.failedHeading).toBeVisible();
  for (const text of ['40 / 200', '20%', '4 / 20', 'GRADED']) await expect(page.getByText(text, { exact: true })).toBeVisible();
  for (let i = 0; i < 20; i++) {
    const card = quiz.reviewCard(attempt.questions[i].content);
    await expect(card.getByText(i < 4 ? '✓ Đúng (+10 điểm)' : '✗ Sai (0 điểm)', { exact: true })).toBeVisible();
    await expect(card.getByText('Đáp án đúng', { exact: true })).toHaveCount(1);
    await expect(card.getByText('Bạn đã chọn', { exact: true })).toHaveCount(i < 4 ? 0 : 1);
    await expect(card.getByText('Một cộng một bằng hai.', { exact: true })).toBeVisible();
  }
  expect(await seed.db.collection('quizattempts').findOne({ _id: new ObjectId(attempt.attemptId) })).toMatchObject({ score: 40, maxScore: 200, status: 'GRADED' });
  await testInfo.attach('review-20-questions', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await quiz.retakeButton.click();
  const restarted = page.waitForResponse(r => r.url() === `${env.apiURL}/quiz/start` && r.request().method() === 'POST');
  await quiz.start();
  const nextAttempt = await (await restarted).json();
  expect(nextAttempt.attemptId).not.toBe(attempt.attemptId);
  await expect(page.getByText('Đã chọn 0/20', { exact: true })).toBeVisible();
});
