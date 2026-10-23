import {
  buildAdvicePrompt,
  buildHistorySummary,
  parseAdvice,
  ruleBasedAdvice,
  type AdviceExercise,
} from './learner-advice';
import { RecommendationService } from './recommendation.service';

const ex = (id: string, tags: string[], difficulty = 'EASY'): AdviceExercise => ({
  id,
  slug: `bai-${id}`,
  title: `Bài ${id}`,
  difficulty,
  tags,
});

const exercises: AdviceExercise[] = [
  ex('1', ['loop']),
  ex('2', ['loop'], 'MEDIUM'),
  ex('3', ['dp'], 'HARD'),
  ex('4', ['graph']),
  ex('5', ['list']),
];

describe('buildHistorySummary', () => {
  it('xác định chủ đề bị sai (WA/RE) nhiều nhất, bỏ qua TLE/CE', () => {
    const s = buildHistorySummary(
      [
        { exerciseId: '1', status: 'WA' },
        { exerciseId: '2', status: 'RE' },
        { exerciseId: '1', status: 'WA' },
        { exerciseId: '4', status: 'WA' },
        { exerciseId: '3', status: 'TLE' },
      ],
      exercises,
    );
    expect(s.weakTopic).toMatchObject({ key: 'loops', wrong: 3, attempts: 3 });
    expect(s.otherWeak.map((t) => t.key)).toEqual(['graph']);
  });

  it('ứng viên là bài chưa AC, ưu tiên chủ đề yếu rồi độ khó tăng dần', () => {
    const s = buildHistorySummary(
      [
        { exerciseId: '1', status: 'WA' },
        { exerciseId: '5', status: 'AC' },
      ],
      exercises,
    );
    expect(s.solvedCount).toBe(1);
    expect(s.candidates.map((c) => c.slug)).toEqual(['bai-1', 'bai-2', 'bai-4', 'bai-3']);
    expect(s.candidates.some((c) => c.slug === 'bai-5')).toBe(false);
  });

  it('chưa sai lượt nào thì không có chủ đề yếu', () => {
    const s = buildHistorySummary([{ exerciseId: '1', status: 'AC' }], exercises);
    expect(s.weakTopic).toBeNull();
  });

  it('prompt chỉ chứa dữ liệu tóm tắt, không có mã nguồn học viên', () => {
    const s = buildHistorySummary([{ exerciseId: '1', status: 'WA' }], exercises);
    const p = buildAdvicePrompt(s);
    expect(p).toContain('<du_lieu>');
    expect(p).toContain('Vòng lặp');
    expect(p).toContain('bai-2');
  });
});

describe('parseAdvice', () => {
  const summary = buildHistorySummary(
    [
      { exerciseId: '1', status: 'WA' },
      { exerciseId: '1', status: 'WA' },
    ],
    exercises,
  );

  it('nhận JSON đúng khuôn, tên chủ đề lấy từ dữ liệu thật', () => {
    const out = parseAdvice(
      '```json\n{"weakness":{"topic":"Bịa","advice":"Ôn lại điều kiện dừng của vòng lặp."},"next":[{"slug":"bai-2","reason":"Cùng chủ đề, khó hơn một chút."}]}\n```',
      summary,
    );
    expect(out?.weakness).toEqual({ topic: 'Vòng lặp', advice: 'Ôn lại điều kiện dừng của vòng lặp.' });
    expect(out?.next).toEqual([{ slug: 'bai-2', title: 'Bài 2', reason: 'Cùng chủ đề, khó hơn một chút.' }]);
  });

  it('bỏ slug do model bịa, tối đa 2 bài, không trùng', () => {
    const out = parseAdvice(
      JSON.stringify({
        weakness: { advice: 'Ôn lại vòng lặp.' },
        next: [
          { slug: 'khong-co', reason: 'x' },
          { slug: 'bai-2', reason: 'a' },
          { slug: 'bai-2', reason: 'b' },
          { slug: 'bai-4', reason: 'c' },
          { slug: 'bai-3', reason: 'd' },
        ],
      }),
      summary,
    );
    expect(out?.next.map((n) => n.slug)).toEqual(['bai-2', 'bai-4']);
  });

  it('loại lời khuyên chứa code và JSON hỏng', () => {
    const withCode = parseAdvice(
      JSON.stringify({ weakness: { advice: 'Dùng print(x) rồi return x' }, next: [{ slug: 'bai-2', reason: 'Tốt.' }] }),
      summary,
    );
    expect(withCode?.weakness).toBeNull();
    expect(withCode?.next).toHaveLength(1);
    expect(parseAdvice('không phải json', summary)).toBeNull();
    expect(parseAdvice('{"weakness":{"advice":""},"next":[]}', summary)).toBeNull();
  });
});

describe('ruleBasedAdvice', () => {
  it('có lời khuyên cho chủ đề yếu và tối đa 2 bài kèm lý do', () => {
    const s = buildHistorySummary([{ exerciseId: '1', status: 'WA' }], exercises);
    const r = ruleBasedAdvice(s);
    expect(r.weakness?.topic).toBe('Vòng lặp');
    expect(r.next).toHaveLength(2);
    expect(r.next.every((n) => n.reason.length > 0)).toBe(true);
  });
});

describe('RecommendationService.getAiAdvice', () => {
  const attempts = [
    { exerciseId: '1', status: 'WA' },
    { exerciseId: '2', status: 'RE' },
  ];
  const build = (advisor: any) => {
    const exerciseModel = {
      find: jest.fn(() => ({
        select: jest.fn(() => ({
          lean: jest.fn().mockResolvedValue(exercises.map((e) => ({ ...e, _id: e.id }))),
        })),
      })),
    };
    const mastery = { getGradedAttempts: jest.fn().mockResolvedValue(attempts) };
    return new RecommendationService(exerciseModel as any, mastery as any, advisor);
  };
  const geminiJson = JSON.stringify({
    weakness: { topic: 'Vòng lặp', advice: 'Chú ý điều kiện dừng.' },
    next: [{ slug: 'bai-2', reason: 'Luyện thêm vòng lặp.' }],
  });

  it('gọi Gemini thật và trả nguồn "gemini"; lần sau cùng lịch sử dùng bộ nhớ đệm', async () => {
    const advisor = { advise: jest.fn().mockResolvedValue(geminiJson) };
    const service = build(advisor);
    const first = await service.getAiAdvice('u1', 'CAREER_ADULT');
    expect(first.source).toBe('gemini');
    expect(first.weakness?.topic).toBe('Vòng lặp');
    await service.getAiAdvice('u1', 'CAREER_ADULT');
    expect(advisor.advise).toHaveBeenCalledTimes(1);
    // Cache theo từng học viên: người khác không nhận lời khuyên của u1.
    await service.getAiAdvice('u2', 'CAREER_ADULT');
    expect(advisor.advise).toHaveBeenCalledTimes(2);
  });

  it('Gemini lỗi hoặc trả rác thì dùng luật dự phòng', async () => {
    const failing = build({ advise: jest.fn().mockResolvedValue(null) });
    expect((await failing.getAiAdvice('u1')).source).toBe('rules');
    const junk = build({ advise: jest.fn().mockResolvedValue('xin chào') });
    const r = await junk.getAiAdvice('u1');
    expect(r.source).toBe('rules');
    expect(r.next.length).toBeGreaterThan(0);
  });

  it('chưa cấu hình Gemini: không lỗi, dùng luật', async () => {
    const r = await build(null).getAiAdvice('u1');
    expect(r.source).toBe('rules');
  });
});
