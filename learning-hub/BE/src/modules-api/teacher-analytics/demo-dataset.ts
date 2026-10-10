import type { AnalyticsInput } from './analytics-core';

/**
 * Bộ dữ liệu mẫu nội bộ của Teacher Dashboard. Nhỏ đủ để tính tay: cùng một bộ được
 * dùng để nạp CSDL (`npm run seed:teacher-demo`) và để test đối soát số liệu
 * (demo-dataset.spec.ts), nên số liệu trên giao diện sau khi nạp phải bằng `DEMO_EXPECTED`.
 *
 * Lớp A: 4 học viên (s1..s4), 4 bài được giao.
 *   ex-loops     nhãn loops
 *   ex-arrays    nhãn arrays, loops
 *   ex-recursion nhãn recursion
 *   ex-sql       không nhãn, chủ đề "sql"
 * Dữ liệu cố ý chứa "mồi nhử" mà thống kê phải bỏ qua: bài nộp QUEUED/FAILED, một học viên
 * ngoài lớp (outsider), và một bài không được giao (ex-other).
 */
export const DEMO_STUDENTS = [
  { id: 's1', name: 'An' },
  { id: 's2', name: 'Bình' },
  { id: 's3', name: 'Chi' },
  { id: 's4', name: 'Dũng' },
];

export const DEMO_OUTSIDER = { id: 's9', name: 'Ngoài lớp' };

export const DEMO_EXERCISES = [
  { slug: 'ex-loops', title: 'Vòng lặp', difficulty: 'EASY', tags: ['loops'] },
  {
    slug: 'ex-arrays',
    title: 'Mảng',
    difficulty: 'MEDIUM',
    tags: ['arrays', 'loops'],
  },
  {
    slug: 'ex-recursion',
    title: 'Đệ quy',
    difficulty: 'HARD',
    tags: ['recursion'],
  },
  {
    slug: 'ex-sql',
    title: 'Truy vấn SQL',
    difficulty: 'EASY',
    tags: [],
    topic: 'sql',
  },
];

/** Bài không thuộc lớp A: bài nộp của nó phải bị bỏ qua. */
export const DEMO_OTHER_EXERCISE = {
  slug: 'ex-other',
  title: 'Bài ngoài lớp',
  difficulty: 'EASY',
  tags: ['loops'],
};

const day = (n: number) => new Date(Date.UTC(2026, 8, n, 3, 0, 0));

// [học viên, bài, các trạng thái theo thứ tự nộp]
const ATTEMPTS: Array<[string, string, string[]]> = [
  ['s1', 'ex-loops', ['WA', 'WA', 'AC']],
  ['s1', 'ex-arrays', ['AC']],
  ['s1', 'ex-recursion', ['WA', 'WA', 'WA']],
  ['s2', 'ex-loops', ['AC']],
  ['s2', 'ex-arrays', ['WA', 'WA', 'WA', 'AC']],
  ['s2', 'ex-recursion', ['WA', 'WA']],
  ['s2', 'ex-sql', ['AC']],
  ['s3', 'ex-loops', ['WA', 'WA', 'QUEUED', 'FAILED']],
  ['s3', 'ex-arrays', ['RUNNING']],
  // mồi nhử
  ['s9', 'ex-loops', ['AC']],
  ['s1', 'ex-other', ['AC', 'AC']],
];

export const DEMO_HINTS: Array<{ userId: string; exerciseSlug: string }> = [
  { userId: 's1', exerciseSlug: 'ex-recursion' },
  { userId: 's1', exerciseSlug: 'ex-recursion' },
  { userId: 's2', exerciseSlug: 'ex-arrays' },
  { userId: 's3', exerciseSlug: 'ex-loops' },
  { userId: 's9', exerciseSlug: 'ex-loops' }, // ngoài lớp
];

export const DEMO_SUBMISSIONS = ATTEMPTS.flatMap(
  ([userId, exerciseSlug, statuses], i) =>
    statuses.map((status, k) => ({
      userId,
      exerciseSlug,
      status,
      at: day(1 + i + k),
    })),
);

export const DEMO_INPUT: AnalyticsInput = {
  students: DEMO_STUDENTS,
  exercises: DEMO_EXERCISES,
  submissions: DEMO_SUBMISSIONS,
  hints: DEMO_HINTS,
};

/**
 * Số liệu tính tay (chỉ bài nộp đã chấm, học viên trong lớp, bài được giao).
 * Lượt thử: s1 = 3 + 1 + 3 = 7, s2 = 1 + 4 + 2 + 1 = 8, s3 = 2 (QUEUED/FAILED/RUNNING bỏ qua) → 17.
 * Cặp đã thử 8, cặp đạt 5, cặp có mở gợi ý 3 (s1-recursion, s2-arrays, s3-loops), gợi ý đã mở 4.
 * Điểm khó = 100 x (0,5 x (1 - đạt) + 0,3 x min(1, (TB lượt thử - 1) / 4) + 0,2 x tỷ lệ gợi ý).
 */
export const DEMO_EXPECTED = {
  summary: {
    students: 4,
    exercises: 4,
    attemptedPairs: 8,
    passedPairs: 5,
    totalAttempts: 17,
    completionRate: 0.3125, // 5 / 16
    passRate: 0.625, // 5 / 8
    avgAttempts: 2.13, // 17 / 8 = 2,125
    hintUnlocks: 4,
    hintUsageRate: 0.375, // 3 / 8
  },
  tags: [
    // [nhãn, bài, cặp đã thử, cặp đạt, TB lượt thử, tỷ lệ gợi ý, điểm khó, điểm nghẽn]
    ['recursion', 1, 2, 0, 2.5, 0.5, 71, true],
    ['loops', 2, 5, 4, 2.2, 0.4, 27, false],
    ['arrays', 1, 2, 2, 2.5, 0.5, 21, false],
    ['sql', 1, 1, 1, 1, 0, 0, false],
  ] as Array<[string, number, number, number, number, number, number, boolean]>,
  exercises: {
    'ex-loops': {
      attempted: 3,
      passed: 2,
      completion: 0.5,
      passRate: 0.6667,
      avg: 2,
      hints: 1,
      hintRate: 0.3333,
      score: 31,
    },
    'ex-arrays': {
      attempted: 2,
      passed: 2,
      completion: 0.5,
      passRate: 1,
      avg: 2.5,
      hints: 1,
      hintRate: 0.5,
      score: 21,
    },
    'ex-recursion': {
      attempted: 2,
      passed: 0,
      completion: 0,
      passRate: 0,
      avg: 2.5,
      hints: 2,
      hintRate: 0.5,
      score: 71,
    },
    'ex-sql': {
      attempted: 1,
      passed: 1,
      completion: 0.25,
      passRate: 1,
      avg: 1,
      hints: 0,
      hintRate: 0,
      score: 0,
    },
  } as Record<
    string,
    {
      attempted: number;
      passed: number;
      completion: number;
      passRate: number;
      avg: number;
      hints: number;
      hintRate: number;
      score: number;
    }
  >,
  students: {
    s1: {
      attempted: 3,
      passed: 2,
      completion: 0.5,
      attempts: 7,
      avg: 2.33,
      hints: 2,
      last: '2026-09-05T03:00:00.000Z',
    },
    s2: {
      attempted: 4,
      passed: 3,
      completion: 0.75,
      attempts: 8,
      avg: 2,
      hints: 1,
    },
    s3: {
      attempted: 1,
      passed: 0,
      completion: 0,
      attempts: 2,
      avg: 2,
      hints: 1,
    },
    s4: {
      attempted: 0,
      passed: 0,
      completion: 0,
      attempts: 0,
      avg: null,
      hints: 0,
      last: null,
    },
  } as Record<
    string,
    {
      attempted: number;
      passed: number;
      completion: number;
      attempts: number;
      avg: number | null;
      hints: number;
      last?: string | null;
    }
  >,
};
