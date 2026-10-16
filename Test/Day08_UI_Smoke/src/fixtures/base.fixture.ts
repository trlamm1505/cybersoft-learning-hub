import { test as base, expect } from '@playwright/test';
import { MongoClient, ObjectId, Db } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { env } from '../utils/env.config';
import { LoginPage } from '../pages/login.page';
import { MOCK_LESSONS } from '../../../../learning-hub/FE/src/data/mockLessons';
import data from '../../test-data/smoke.json';
interface Account { email: string; password: string; fullName: string; id: string; role: string }
interface Seed { db: Db; questionId: ObjectId; exerciseId: ObjectId; slug: string; lessonId: string; lessonTitle: string }
export const test = base.extend<{ account: Account; seed: Seed; authenticated: void; accountRole: 'STUDENT' | 'TEACHER'; questionCount: number }>({
  accountRole: ['STUDENT', { option: true }],
  questionCount: [1, { option: true }],
  account: async ({ request, accountRole }, use) => {
    const email = `day08-${randomUUID()}@example.test`;
    const password = `Day08!${randomUUID()}`;
    const fullName = 'Day08 Smoke';
    const client = await MongoClient.connect(env.mongoServer);
    try {
      // Registration sets up data only. Its token is never injected into the browser.
      const response = await request.post(`${env.apiURL}/auth/register`, { data: { email, password, fullName, role: accountRole } });
      expect(response.status(), 'Create isolated test account').toBe(201);
      const { user } = await response.json();
      await use({ email, password, fullName, id: user.id, role: accountRole });
    } finally {
      await client.db(env.database).collection('users').deleteMany({ email });
      await client.close();
    }
  },
  authenticated: async ({ page, account }, use) => {
    const login = new LoginPage(page);
    await login.navigate('/login');
    const response = page.waitForResponse(r => r.url() === `${env.apiURL}/auth/login` && r.request().method() === 'POST');
    await login.signIn(account.email, account.password);
    expect((await response).status()).toBe(201);
    await expect(page).toHaveURL(account.role === 'TEACHER' ? /\/authoring$/ : /\/catalog$/);
    await expect(login.logout).toBeVisible();
    await use();
  },
  seed: async ({ questionCount }, use, testInfo) => {
    if (testInfo.config.workers !== 1) throw new Error('System quiz reads all questions: use one worker');
    const client = await MongoClient.connect(env.mongoServer);
    const db = client.db(env.database);
    const questionIds = Array.from({ length: questionCount }, () => new ObjectId());
    const questionId = questionIds[0];
    const exerciseId = new ObjectId();
    const slug = `day08-${env.runId}-${exerciseId}`;
    try {
      await db.collection('questions').insertMany(questionIds.map((_id, index) => ({ _id, content: index === 0 ? data.question : `Câu ${index + 1}: ${data.question}`,
        options: [{ key: 'A', text: data.correctAnswer, isCorrect: true }, { key: 'B', text: data.wrongAnswer, isCorrect: false }],
        explanation: data.explanation, points: 10, difficulty: 'EASY', category: 'Day08', tags: [env.runId] })));
      await db.collection('exercises').insertOne({ _id: exerciseId, slug, title: `Cộng hai số ${exerciseId}`,
        description: 'Đọc hai số nguyên, mỗi số trên một dòng. In tổng.', type: 'CODE_TEXT', difficulty: 'EASY', points: 10,
        starterCode: '# Day08\n', timeLimitMs: 3000, memoryLimitMb: 128,
        testCases: [{ input: '2\n3', expectedOutput: '5', isHidden: false }, { input: '-2\n5', expectedOutput: '3', isHidden: true }] });
      await use({ db, questionId, exerciseId, slug, lessonId: MOCK_LESSONS[0].id, lessonTitle: MOCK_LESSONS[0].title });
    } finally {
      await db.collection('quizattempts').deleteMany({ 'shuffledQuestions.questionId': { $in: questionIds } });
      await db.collection('submissions').deleteMany({ exerciseId: exerciseId.toHexString() });
      await db.collection('questions').deleteMany({ _id: { $in: questionIds } });
      await db.collection('exercises').deleteOne({ _id: exerciseId });
      await client.close();
    }
  }
});
export { expect };
