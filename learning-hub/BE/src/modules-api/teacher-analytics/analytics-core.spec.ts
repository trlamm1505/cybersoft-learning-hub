import {
  AnalyticsInput,
  BOTTLENECK_MIN_PAIRS,
  buildPairs,
  computeClassAnalytics,
  difficultyScore,
  exerciseBreakdown,
  studentBreakdown,
  UNTAGGED,
} from './analytics-core';
import { DEMO_EXPECTED, DEMO_INPUT } from './demo-dataset';

const EMPTY: AnalyticsInput = {
  students: [],
  exercises: [],
  submissions: [],
  hints: [],
};

const at = (n: number) => new Date(Date.UTC(2026, 8, n));

describe('analytics-core: đối soát bộ dữ liệu mẫu', () => {
  const result = computeClassAnalytics(DEMO_INPUT);

  it('chỉ số tổng của lớp khớp số liệu tính tay', () => {
    expect(result.summary).toEqual(DEMO_EXPECTED.summary);
  });

  it('nhãn kỹ năng: số liệu, điểm khó, thứ tự và điểm nghẽn khớp', () => {
    expect(result.tags.map((t) => t.tag)).toEqual(
      DEMO_EXPECTED.tags.map((t) => t[0]),
    );
    for (const [
      tag,
      exercises,
      attempted,
      passed,
      avg,
      hintRate,
      score,
      bn,
    ] of DEMO_EXPECTED.tags) {
      const row = result.tags.find((t) => t.tag === tag)!;
      expect(row).toMatchObject({
        exercises,
        attemptedPairs: attempted,
        passedPairs: passed,
        avgAttempts: avg,
        hintUsageRate: hintRate,
        difficultyScore: score,
        bottleneck: bn,
      });
    }
  });

  it('bài tập: từng chỉ số khớp', () => {
    for (const [slug, want] of Object.entries(DEMO_EXPECTED.exercises)) {
      expect(result.exercises.find((e) => e.slug === slug)).toMatchObject({
        attemptedStudents: want.attempted,
        passedStudents: want.passed,
        completionRate: want.completion,
        passRate: want.passRate,
        avgAttempts: want.avg,
        hintUnlocks: want.hints,
        hintUsageRate: want.hintRate,
        difficultyScore: want.score,
      });
    }
  });

  it('học viên: từng chỉ số khớp, học viên chưa làm có avg null và lastActiveAt null', () => {
    for (const [id, want] of Object.entries(DEMO_EXPECTED.students)) {
      const row = result.students.find((s) => s.id === id)!;
      expect(row).toMatchObject({
        attemptedExercises: want.attempted,
        passedExercises: want.passed,
        completionRate: want.completion,
        totalAttempts: want.attempts,
        avgAttempts: want.avg,
        hintUnlocks: want.hints,
      });
      if (want.last !== undefined) expect(row.lastActiveAt).toBe(want.last);
    }
  });

  it('bỏ qua mồi nhử: QUEUED/RUNNING/FAILED, học viên ngoài lớp, bài không được giao', () => {
    const pairs = buildPairs(DEMO_INPUT);
    expect(pairs.size).toBe(8 + 0); // s3 ex-arrays chỉ có RUNNING nên không có cặp
    const keys = [...pairs.keys()].join('|');
    expect(keys).not.toContain('s9');
    expect(keys).not.toContain('ex-other');
    // s3 ex-loops: 2 lượt đã chấm (WA, WA); QUEUED và FAILED bị bỏ.
    expect(result.students.find((s) => s.id === 's3')!.totalAttempts).toBe(2);
  });

  it('drill-down học viên liệt kê cả bài chưa làm', () => {
    const rows = studentBreakdown(DEMO_INPUT, 's1');
    expect(
      rows.map((r) => [r.slug, r.status, r.attempts, r.hintUnlocks]),
    ).toEqual([
      ['ex-loops', 'PASSED', 3, 0],
      ['ex-arrays', 'PASSED', 1, 0],
      ['ex-recursion', 'ATTEMPTED', 3, 2],
      ['ex-sql', 'NOT_STARTED', 0, 0],
    ]);
  });

  it('drill-down bài tập liệt kê cả học viên chưa làm', () => {
    const rows = exerciseBreakdown(DEMO_INPUT, 'ex-loops');
    expect(rows.map((r) => [r.id, r.status, r.attempts])).toEqual([
      ['s1', 'PASSED', 3],
      ['s2', 'PASSED', 1],
      ['s3', 'ATTEMPTED', 2],
      ['s4', 'NOT_STARTED', 0],
    ]);
  });
});

describe('analytics-core: công thức và trường hợp biên', () => {
  it('lớp trống: mọi tỷ lệ là null, không NaN, các mảng rỗng', () => {
    const r = computeClassAnalytics(EMPTY);
    expect(r.summary).toEqual({
      students: 0,
      exercises: 0,
      attemptedPairs: 0,
      passedPairs: 0,
      totalAttempts: 0,
      completionRate: null,
      passRate: null,
      avgAttempts: null,
      hintUnlocks: 0,
      hintUsageRate: null,
    });
    expect([r.tags, r.exercises, r.students]).toEqual([[], [], []]);
  });

  it('có học viên và bài nhưng chưa ai làm: hoàn thành 0, tỷ lệ đạt null, điểm khó null', () => {
    const r = computeClassAnalytics({
      students: [{ id: 'a', name: 'A' }],
      exercises: [{ slug: 'x', title: 'X', tags: ['t'] }],
      submissions: [],
      hints: [],
    });
    expect(r.summary.completionRate).toBe(0);
    expect(r.summary.passRate).toBeNull();
    expect(r.summary.avgAttempts).toBeNull();
    expect(r.tags[0]).toMatchObject({
      tag: 't',
      difficultyScore: null,
      bottleneck: false,
    });
    expect(r.exercises[0]).toMatchObject({ passRate: null, completionRate: 0 });
  });

  it('mở gợi ý mà chưa nộp bài không làm tăng tỷ lệ dùng gợi ý (cùng mẫu số với tỷ lệ đạt)', () => {
    const r = computeClassAnalytics({
      students: [{ id: 'a', name: 'A' }],
      exercises: [{ slug: 'x', title: 'X', tags: [] }],
      submissions: [],
      hints: [{ userId: 'a', exerciseSlug: 'x' }],
    });
    expect(r.summary.hintUsageRate).toBeNull();
    expect(r.summary.hintUnlocks).toBe(0);
  });

  it('một học viên nộp nhiều lần: AC sau cùng vẫn tính đạt, đếm đúng số lượt', () => {
    const r = computeClassAnalytics({
      students: [{ id: 'a', name: 'A' }],
      exercises: [{ slug: 'x', title: 'X', tags: ['t'] }],
      submissions: [
        { userId: 'a', exerciseSlug: 'x', status: 'CE', at: at(1) },
        { userId: 'a', exerciseSlug: 'x', status: 'TLE', at: at(2) },
        { userId: 'a', exerciseSlug: 'x', status: 'AC', at: at(3) },
        { userId: 'a', exerciseSlug: 'x', status: 'WA', at: at(4) }, // nộp lại sau khi đã đạt
      ],
      hints: [],
    });
    expect(r.summary).toMatchObject({
      passedPairs: 1,
      totalAttempts: 4,
      passRate: 1,
      avgAttempts: 4,
    });
    expect(r.students[0].lastActiveAt).toBe(at(4).toISOString());
  });

  it('bài không nhãn lấy chủ đề; không có cả hai thì vào "Chưa gắn nhãn"; bài nhiều nhãn tính cho từng nhãn', () => {
    const r = computeClassAnalytics({
      students: [{ id: 'a', name: 'A' }],
      exercises: [
        { slug: 'a1', title: 'A1', tags: [], topic: 'sql' },
        { slug: 'a2', title: 'A2', tags: [] },
        { slug: 'a3', title: 'A3', tags: ['x', 'y'] },
      ],
      submissions: [
        { userId: 'a', exerciseSlug: 'a3', status: 'AC', at: at(1) },
      ],
      hints: [],
    });
    expect(r.tags.map((t) => t.tag).sort()).toEqual(
      ['sql', 'x', 'y', UNTAGGED].sort(),
    );
    expect(r.tags.find((t) => t.tag === 'x')!.passedPairs).toBe(1);
    expect(r.tags.find((t) => t.tag === 'y')!.passedPairs).toBe(1);
  });

  it('điểm khó: biên 0 và 100, giới hạn phần lượt thử, null khi thiếu dữ liệu', () => {
    expect(difficultyScore(1, 1, 0)).toBe(0);
    expect(difficultyScore(0, 5, 1)).toBe(100);
    expect(difficultyScore(0, 50, 1)).toBe(100);
    expect(difficultyScore(1, 0.5, 0)).toBe(0);
    expect(difficultyScore(0.5, 3, 0.5)).toBe(
      Math.round(100 * (0.25 + 0.15 + 0.1)),
    );
    expect(difficultyScore(null, null, null)).toBeNull();
  });

  it('điểm nghẽn cần đủ số cặp tối thiểu', () => {
    const base = {
      students: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      exercises: [{ slug: 'x', title: 'X', tags: ['t'] }],
      hints: [],
    };
    const one = computeClassAnalytics({
      ...base,
      submissions: [
        { userId: 'a', exerciseSlug: 'x', status: 'WA', at: at(1) },
      ],
    });
    expect(one.tags[0].difficultyScore).toBeGreaterThanOrEqual(50);
    expect(one.tags[0].bottleneck).toBe(false); // mới 1 cặp < BOTTLENECK_MIN_PAIRS
    const two = computeClassAnalytics({
      ...base,
      submissions: ['a', 'b'].map((u) => ({
        userId: u,
        exerciseSlug: 'x',
        status: 'WA',
        at: at(1),
      })),
    });
    expect(BOTTLENECK_MIN_PAIRS).toBe(2);
    expect(two.tags[0].bottleneck).toBe(true);
  });
});
