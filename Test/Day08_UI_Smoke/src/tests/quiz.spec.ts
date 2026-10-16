import { ObjectId } from 'mongodb';
import { test, expect } from '../fixtures/base.fixture';
import { QuizPage } from '../pages/quiz.page';
import { env } from '../utils/env.config';
import data from '../../test-data/smoke.json';

for (const correct of [true, false]) {
  test(`nộp quiz ${correct ? 'đúng' : 'sai'} và xem điểm thật`, async ({ page, seed, authenticated }) => {
    const quiz = new QuizPage(page);
    await quiz.navigate('/quiz');
    const startPromise = page.waitForResponse(r => r.url() === `${env.apiURL}/quiz/start` && r.request().method() === 'POST');
    await quiz.start();
    const start = await startPromise;
    expect(start.status(), 'Quiz phải khởi tạo qua Backend').toBe(201);
    const attempt = await start.json();
    expect(attempt.questions).toHaveLength(1);
    expect(attempt.questions[0].questionId).toBe(seed.questionId.toHexString());
    await expect(quiz.questionHeading(data.question)).toBeVisible();
    await quiz.answer(correct ? data.correctAnswer : data.wrongAnswer).click();
    const submitPromise = page.waitForResponse(r => r.url() === `${env.apiURL}/quiz/${attempt.attemptId}/submit` && r.request().method() === 'POST');
    const reviewPromise = page.waitForResponse(r => r.url().startsWith(`${env.apiURL}/quiz/${attempt.attemptId}/review`));
    await quiz.submit();
    expect((await submitPromise).status()).toBe(201);
    const review = await reviewPromise;
    expect(review.status()).toBe(200);
    const score = correct ? 10 : 0;
    expect(await review.json()).toMatchObject({ score, maxScore: 10, status: 'GRADED' });
    await expect(correct ? quiz.successHeading : quiz.failedHeading).toBeVisible();
    await expect(quiz.score(`${score} / 10`)).toBeVisible();
    await expect(quiz.explanation(data.explanation)).toBeVisible();
    const stored = await seed.db.collection('quizattempts').findOne({ _id: new ObjectId(attempt.attemptId) });
    expect(stored, 'Điểm phải được lưu trong MongoDB').toMatchObject({ score, maxScore: 10, status: 'GRADED' });
  });
}
