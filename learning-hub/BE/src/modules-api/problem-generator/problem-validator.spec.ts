import { validateProblemDraft } from './problem-validator';
import { ProblemDraft } from './problem-generator.types';

function makeDraft(overrides: Partial<ProblemDraft> = {}): ProblemDraft {
  return {
    specId: 'spec-test',
    title: 'Bài kiểm thử',
    slug: 'bai-kiem-thu-spec-test',
    description: 'Bài kiểm thử cho validator.',
    difficulty: 'EASY',
    tags: ['test'],
    starterCode: '',
    solutionCode: 'a = int(input())\nb = int(input())\nprint(a + b)',
    testCases: [
      { input: '3\n5', expectedOutput: '8', isHidden: false },
      { input: '1\n1', expectedOutput: '2', isHidden: true },
    ],
    ...overrides,
  };
}

describe('validateProblemDraft', () => {
  it('đánh giá readyForReview=true khi solution pass mọi test và không trùng lặp', async () => {
    const result = await validateProblemDraft(makeDraft());

    expect(result.syntaxOk).toBe(true);
    expect(result.allTestsPassed).toBe(true);
    expect(result.testResults.every((t) => t.passed)).toBe(true);
    expect(result.readyForReview).toBe(true);
  }, 15000);

  it('phát hiện solution sai kết quả trên ít nhất một test case', async () => {
    const draft = makeDraft({
      solutionCode: 'a = int(input())\nb = int(input())\nprint(a - b)',
    });

    const result = await validateProblemDraft(draft);

    expect(result.syntaxOk).toBe(true);
    expect(result.allTestsPassed).toBe(false);
    expect(result.readyForReview).toBe(false);
    expect(result.testResults.some((t) => !t.passed)).toBe(true);
  }, 15000);

  it('phát hiện lỗi cú pháp trong solutionCode trước khi chạy test', async () => {
    const draft = makeDraft({ solutionCode: 'def broken(:\n    pass' });

    const result = await validateProblemDraft(draft);

    expect(result.syntaxOk).toBe(false);
    expect(result.testResults).toHaveLength(0);
    expect(result.allTestsPassed).toBe(false);
    expect(result.readyForReview).toBe(false);
  }, 15000);

  it('gắn cờ nghi vấn trùng lặp khi title/description giống một bài đã seed', async () => {
    const draft = makeDraft({
      title: 'Tính tổng hai số nguyên',
      description:
        'Cho hai số nguyên A và B, mỗi số trên một dòng. In ra kết quả tổng A + B trên một dòng.',
    });

    const result = await validateProblemDraft(draft);

    expect(result.duplicateCandidates.length).toBeGreaterThan(0);
    expect(result.readyForReview).toBe(false);
  }, 15000);
});
