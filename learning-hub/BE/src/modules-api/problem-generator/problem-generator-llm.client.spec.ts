import { StubProblemGeneratorClient } from './problem-generator-llm.client';
import { PROBLEM_SPECS } from './problem-generator-specs';

describe('StubProblemGeneratorClient', () => {
  const client = new StubProblemGeneratorClient();

  it('sinh draft hợp lệ cho từng spec trong bộ 10 spec mẫu', async () => {
    for (const spec of PROBLEM_SPECS) {
      const draft = await client.generate(spec);

      expect(draft.specId).toBe(spec.id);
      expect(draft.title.length).toBeGreaterThan(0);
      expect(draft.description.length).toBeGreaterThan(0);
      expect(draft.solutionCode.length).toBeGreaterThan(0);
      expect(draft.difficulty).toBe(spec.level);
      expect(draft.testCases.length).toBeGreaterThan(0);
      expect(draft.testCases.some((t) => !t.isHidden)).toBe(true);
      expect(draft.testCases.some((t) => t.isHidden)).toBe(true);
    }
  });

  it('sinh slug duy nhất cho toàn bộ 10 spec mẫu', async () => {
    const slugs = new Set<string>();
    for (const spec of PROBLEM_SPECS) {
      const draft = await client.generate(spec);
      slugs.add(draft.slug);
    }
    expect(slugs.size).toBe(PROBLEM_SPECS.length);
  });

  it('gắn đúng specId vào slug để truy vết lại spec gốc', async () => {
    const draft = await client.generate(PROBLEM_SPECS[0]);
    expect(draft.slug.endsWith(PROBLEM_SPECS[0].id)).toBe(true);
  });
});
