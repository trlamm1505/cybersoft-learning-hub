import { describe, expect, it } from 'vitest';
import { stripSecrets } from './exerciseApi';

describe('stripSecrets (an toàn dữ liệu phía học viên)', () => {
  it('bỏ test ẩn và các trường đáp án, giữ nguyên phần còn lại', () => {
    const out = stripSecrets({
      slug: 'a',
      hiddenTestCount: 2,
      solutionCode: 'print(1)',
      officialSolution: 'print(1)',
      hiddenTestCases: [{ input: '9', expectedOutput: '81', isHidden: true }],
      testCases: [
        { input: '2', expectedOutput: '4', isHidden: false },
        { input: '31337', expectedOutput: '982067569', isHidden: true },
      ],
    });
    expect(out.testCases).toHaveLength(1);
    expect(JSON.stringify(out)).not.toMatch(/31337|982067569|solutionCode|officialSolution|hiddenTestCases/);
    expect(out.hiddenTestCount).toBe(2);
    expect(out.slug).toBe('a');
  });
});
