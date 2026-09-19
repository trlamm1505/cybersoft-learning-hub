import { ObjectId } from 'mongodb';
import { test, expect } from '../fixtures/base.fixture';
import { CodePage } from '../pages/code.page';
import { env } from '../utils/env.config';
import data from '../../test-data/smoke.json';

for (const scenario of data.codeCases) {
  test(`nộp ${scenario.name} và nhận ${scenario.status} từ judge`, async ({ page, seed, authenticated }) => {
    const code = new CodePage(page);
    await code.navigate('/playground');
    await code.select(seed.slug);
    await expect(code.titleHeading(`Cộng hai số ${seed.exerciseId}`)).toBeVisible();
    await code.enterCode(scenario.code);
    const ackPromise = page.waitForResponse(r => r.url() === `${env.apiURL}/exercises/${seed.slug}/submit` && r.request().method() === 'POST');
    await code.submit();
    const ack = await ackPromise;
    expect(ack.status(), 'Bài phải được gửi tới Backend thật').toBe(201);
    const { submissionId } = await ack.json();
    expect(submissionId).toMatch(/^[a-f0-9]{24}$/);
    await expect(code.result(scenario.label), 'Giao diện phải hiển thị kết quả judge').toBeVisible({ timeout: 20_000 });
    await expect(code.passedCount(scenario.passed)).toBeVisible();
    const stored = await seed.db.collection('submissions').findOne({ _id: new ObjectId(submissionId) });
    expect(stored, 'Kết quả và mã nguồn phải được lưu thật').toMatchObject({
      exerciseId: seed.exerciseId.toHexString(), code: scenario.code,
      status: scenario.status, passedCount: scenario.passed, totalCount: 2,
    });
  });
}
