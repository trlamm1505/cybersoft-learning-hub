import { computeTagMastery } from './mastery.calculator';
import { buildRecommendations } from './recommendation.engine';
import { ExerciseSummary, GradedAttempt } from './recommendation.types';

function attempt(overrides: Partial<GradedAttempt>): GradedAttempt {
  return {
    exerciseId: 'ex-1',
    tags: ['loop'],
    status: 'AC',
    passedCount: 1,
    totalCount: 1,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function exercise(overrides: Partial<ExerciseSummary>): ExerciseSummary {
  return {
    id: overrides.id ?? 'ex-1',
    slug: overrides.slug ?? 'bai-1',
    title: overrides.title ?? 'Bài 1',
    difficulty: 'EASY',
    tags: ['loop'],
    ...overrides,
  };
}

describe('computeTagMastery', () => {
  it('tính đúng % AC theo tag và bỏ qua attempt đang chấm', () => {
    const attempts = [
      attempt({ tags: ['loop'], status: 'AC' }),
      attempt({ tags: ['loop'], status: 'WA' }),
      attempt({ tags: ['loop'], status: 'QUEUED' }), // phải bị loại
      attempt({ tags: ['array'], status: 'AC' }),
    ];

    const result = computeTagMastery(attempts);
    const loop = result.find((r) => r.tag === 'loop')!;
    const array = result.find((r) => r.tag === 'array')!;

    expect(loop.attemptCount).toBe(2);
    expect(loop.masteryPercent).toBe(50);
    expect(array.masteryPercent).toBe(100);
  });

  it('một attempt gắn nhiều tag được tính vào mastery của tất cả các tag đó', () => {
    const attempts = [
      attempt({ tags: ['loop', 'array'], status: 'AC' }),
      attempt({ tags: ['array'], status: 'WA' }),
    ];

    const result = computeTagMastery(attempts);
    const loop = result.find((r) => r.tag === 'loop')!;
    const array = result.find((r) => r.tag === 'array')!;

    expect(loop.attemptCount).toBe(1);
    expect(array.attemptCount).toBe(2);
    expect(array.masteryPercent).toBe(50);
  });

  it('trả về mảng rỗng khi chưa có attempt nào', () => {
    expect(computeTagMastery([])).toEqual([]);
  });
});

describe('buildRecommendations', () => {
  it('nhánh rớt ngưỡng: tag mastery thấp nhất (đủ số lần thử) được ưu tiên remediation', () => {
    const masteries = computeTagMastery([
      attempt({ tags: ['loop'], status: 'WA', createdAt: new Date('2026-01-01') }),
      attempt({ tags: ['loop'], status: 'WA', createdAt: new Date('2026-01-02') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-03') }),
      attempt({ tags: ['array'], status: 'AC', createdAt: new Date('2026-01-01') }),
      attempt({ tags: ['array'], status: 'AC', createdAt: new Date('2026-01-02') }),
      attempt({ tags: ['array'], status: 'AC', createdAt: new Date('2026-01-03') }),
    ]);

    const exercises = [
      exercise({ id: 'loop-2', slug: 'loop-2', tags: ['loop'], difficulty: 'EASY' }),
      exercise({ id: 'array-2', slug: 'array-2', tags: ['array'], difficulty: 'HARD' }),
      exercise({ id: 'new-tag-1', slug: 'new-tag-1', tags: ['recursion'], difficulty: 'EASY' }),
    ];

    const recs = buildRecommendations(masteries, exercises, new Set());
    const remediation = recs.find((r) => r.kind === 'REMEDIATION')!;

    expect(remediation).toBeDefined();
    expect(remediation.tag).toBe('loop');
    expect(remediation.reason).toContain('loop');
    expect(remediation.reason.length).toBeGreaterThan(0);
  });

  it('nhánh đạt ngưỡng: tag mastery >= ngưỡng strong mở progression sang bài khó hơn cùng tag', () => {
    const masteries = computeTagMastery([
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-01') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-02') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-03') }),
    ]);

    const exercises = [
      exercise({ id: 'loop-easy', slug: 'loop-easy', tags: ['loop'], difficulty: 'EASY' }),
      exercise({ id: 'loop-hard', slug: 'loop-hard', tags: ['loop'], difficulty: 'HARD' }),
    ];

    const recs = buildRecommendations(masteries, exercises, new Set());
    const progression = recs.find((r) => r.kind === 'PROGRESSION')!;

    expect(progression).toBeDefined();
    expect(progression.tag).toBe('loop');
    expect(progression.exercise.id).toBe('loop-hard');
    expect(progression.reason).toContain('100');
  });

  it('không khóa học viên vào một đường duy nhất: luôn có gợi ý exploration sang tag chưa từng thử khi còn tag mới', () => {
    const masteries = computeTagMastery([
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-01') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-02') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-03') }),
    ]);

    const exercises = [
      exercise({ id: 'loop-hard', slug: 'loop-hard', tags: ['loop'], difficulty: 'HARD' }),
      exercise({ id: 'recursion-1', slug: 'recursion-1', tags: ['recursion'], difficulty: 'EASY' }),
    ];

    const recs = buildRecommendations(masteries, exercises, new Set());
    const exploration = recs.find((r) => r.kind === 'EXPLORATION');

    expect(exploration).toBeDefined();
    expect(exploration!.tag).toBe('recursion');
    expect(exploration!.exercise.id).toBe('recursion-1');
  });

  it('không rơi vào deadlock khi mọi bài của tag remediation đã giải hết (bỏ qua nhánh đó thay vì lỗi)', () => {
    const masteries = computeTagMastery([
      attempt({ tags: ['loop'], status: 'WA', createdAt: new Date('2026-01-01') }),
      attempt({ tags: ['loop'], status: 'WA', createdAt: new Date('2026-01-02') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-03') }),
    ]);

    const exercises = [
      exercise({ id: 'loop-1', slug: 'loop-1', tags: ['loop'], difficulty: 'EASY' }),
    ];
    // Tag loop chỉ có 1 bài và học viên đã giải xong -> không còn bài nào để remediation gợi ý.
    const solved = new Set(['loop-1']);

    expect(() => buildRecommendations(masteries, exercises, solved)).not.toThrow();
    const recs = buildRecommendations(masteries, exercises, solved);
    expect(recs.find((r) => r.kind === 'REMEDIATION')).toBeUndefined();
  });

  it('mọi gợi ý trả về đều có reason không rỗng và exercise hợp lệ', () => {
    const masteries = computeTagMastery([
      attempt({ tags: ['loop'], status: 'WA', createdAt: new Date('2026-01-01') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-02') }),
      attempt({ tags: ['array'], status: 'AC', createdAt: new Date('2026-01-03') }),
    ]);

    const exercises = [
      exercise({ id: 'loop-2', slug: 'loop-2', tags: ['loop'], difficulty: 'MEDIUM' }),
      exercise({ id: 'array-2', slug: 'array-2', tags: ['array'], difficulty: 'HARD' }),
      exercise({ id: 'recursion-1', slug: 'recursion-1', tags: ['recursion'], difficulty: 'EASY' }),
    ];

    const recs = buildRecommendations(masteries, exercises, new Set());
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.reason.length).toBeGreaterThan(0);
      expect(rec.exercise.id).toBeTruthy();
    }
  });

  it('không có exercise nào để gợi ý thì trả về mảng rỗng, không throw', () => {
    const recs = buildRecommendations([], [], new Set());
    expect(recs).toEqual([]);
  });

  it('học viên mới hoàn toàn (0 attempt) nhưng ngân hàng bài không rỗng: chỉ nhận EXPLORATION, không có REMEDIATION/PROGRESSION', () => {
    const masteries = computeTagMastery([]); // chưa từng nộp bài nào

    const exercises = [
      exercise({ id: 'loop-1', slug: 'loop-1', tags: ['loop'], difficulty: 'EASY' }),
      exercise({ id: 'array-1', slug: 'array-1', tags: ['array'], difficulty: 'EASY' }),
    ];

    const recs = buildRecommendations(masteries, exercises, new Set());

    expect(recs.find((r) => r.kind === 'REMEDIATION')).toBeUndefined();
    expect(recs.find((r) => r.kind === 'PROGRESSION')).toBeUndefined();
    const exploration = recs.find((r) => r.kind === 'EXPLORATION');
    expect(exploration).toBeDefined();
    expect(exploration!.reason.length).toBeGreaterThan(0);
  });

  it('không rơi vào deadlock khi PROGRESSION cũng hết bài để gợi ý (đã giải sạch toàn bộ catalog)', () => {
    const masteries = computeTagMastery([
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-01') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-02') }),
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-03') }),
    ]);

    // Tag loop chỉ có đúng 1 bài và đã giải xong -> progression (mostPracticedTag
    // hoặc strongTag) không còn bài nào chưa giải để gợi ý, và cũng không còn
    // tag nào khác (kể cả mới) để remediation/exploration bám vào.
    const exercises = [
      exercise({ id: 'loop-1', slug: 'loop-1', tags: ['loop'], difficulty: 'EASY' }),
    ];
    const solved = new Set(['loop-1']);

    expect(() => buildRecommendations(masteries, exercises, solved)).not.toThrow();
    const recs = buildRecommendations(masteries, exercises, solved);
    expect(recs).toEqual([]);
  });

  it('học viên đã attempt hết mọi tag hiện có và giải hết mọi bài: trả về mảng rỗng, không có exploration ảo', () => {
    const masteries = computeTagMastery([
      attempt({ tags: ['loop'], status: 'AC', createdAt: new Date('2026-01-01') }),
      attempt({ tags: ['array'], status: 'AC', createdAt: new Date('2026-01-02') }),
      attempt({ tags: ['string'], status: 'AC', createdAt: new Date('2026-01-03') }),
    ]);

    const exercises = [
      exercise({ id: 'loop-1', slug: 'loop-1', tags: ['loop'], difficulty: 'EASY' }),
      exercise({ id: 'array-1', slug: 'array-1', tags: ['array'], difficulty: 'EASY' }),
      exercise({ id: 'string-1', slug: 'string-1', tags: ['string'], difficulty: 'EASY' }),
    ];
    // Không còn tag nào ngoài loop/array/string, và cả 3 bài đều đã giải xong.
    const solved = new Set(['loop-1', 'array-1', 'string-1']);

    expect(() => buildRecommendations(masteries, exercises, solved)).not.toThrow();
    const recs = buildRecommendations(masteries, exercises, solved);
    expect(recs.find((r) => r.kind === 'EXPLORATION')).toBeUndefined();
    expect(recs).toEqual([]);
  });
});
