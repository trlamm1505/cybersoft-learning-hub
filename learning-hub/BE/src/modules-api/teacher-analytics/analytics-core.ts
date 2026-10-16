/**
 * Công thức thống kê của Teacher Dashboard (thuần, không truy cập CSDL).
 *
 * Đơn vị tính là "cặp" (học viên, bài tập được giao):
 * - lượt thử  = bài nộp đã chấm (AC, WA, TLE, RE, CE); QUEUED/RUNNING/FAILED không tính
 *   vì chưa có kết quả hoặc lỗi hệ thống chứ không phải lần làm của học viên;
 * - cặp đã thử  = có ít nhất một lượt thử;
 * - cặp đạt     = có ít nhất một lượt AC.
 *
 * Chỉ số của lớp có S học viên và E bài được giao:
 * - Tỷ lệ hoàn thành = cặp đạt / (S x E)
 * - Tỷ lệ đạt        = cặp đạt / cặp đã thử
 * - Số lần thử TB    = tổng lượt thử / cặp đã thử
 * - Dùng gợi ý       = cặp đã thử có mở >= 1 gợi ý / cặp đã thử (kèm tổng số gợi ý đã mở)
 * - Độ khó theo nhãn = 100 x (0,5 x (1 - tỷ lệ đạt) + 0,3 x min(1, (lượt thử TB - 1) / 4) + 0,2 x tỷ lệ dùng gợi ý)
 *   trên các cặp thuộc bài mang nhãn đó (bài có nhiều nhãn được tính cho từng nhãn).
 * Mẫu số bằng 0 cho giá trị null (giao diện hiện trạng thái trống), không bao giờ NaN.
 */

export const GRADED_STATUSES = ['AC', 'WA', 'TLE', 'RE', 'CE'] as const;
export const PASS_STATUS = 'AC';
/** Nhãn đạt ngưỡng này (và đủ mẫu) được đánh dấu là điểm nghẽn. */
export const BOTTLENECK_SCORE = 50;
export const BOTTLENECK_MIN_PAIRS = 2;
export const UNTAGGED = 'Chưa gắn nhãn';

export interface AnalyticsStudent {
  id: string;
  name: string;
}

export interface AnalyticsExercise {
  slug: string;
  title: string;
  difficulty?: string;
  tags: string[];
  topic?: string;
}

export interface AnalyticsSubmission {
  userId: string;
  exerciseSlug: string;
  status: string;
  at: Date;
}

/**
 * DA Lab và AI Lab lưu một bản ghi gộp cho mỗi (học viên, bài) kèm số lần nộp, không có từng lượt.
 * Dựng lại thành các lượt: (N - 1) lượt chưa đạt rồi lượt cuối đạt hoặc không, đủ để các công thức
 * ở trên tính số lần thử và tỷ lệ đạt như bài chấm từng lượt. Giới hạn 200 lượt để dữ liệu hỏng
 * không làm phình bộ nhớ.
 */
export function expandAggregate(rec: {
  userId: string;
  exerciseSlug: string;
  attempts: number;
  passed: boolean;
  at: Date;
}): AnalyticsSubmission[] {
  const n = Math.min(200, Math.max(1, Math.floor(rec.attempts) || 1));
  return Array.from({ length: n }, (_, i) => ({
    userId: rec.userId,
    exerciseSlug: rec.exerciseSlug,
    status: i === n - 1 && rec.passed ? PASS_STATUS : 'WA',
    at: rec.at,
  }));
}

export interface AnalyticsHint {
  userId: string;
  exerciseSlug: string;
}

export interface AnalyticsInput {
  students: AnalyticsStudent[];
  exercises: AnalyticsExercise[];
  submissions: AnalyticsSubmission[];
  hints: AnalyticsHint[];
}

export interface Summary {
  students: number;
  exercises: number;
  attemptedPairs: number;
  passedPairs: number;
  totalAttempts: number;
  completionRate: number | null;
  passRate: number | null;
  avgAttempts: number | null;
  hintUnlocks: number;
  hintUsageRate: number | null;
}

export interface TagRow {
  tag: string;
  exercises: number;
  attemptedPairs: number;
  passedPairs: number;
  passRate: number | null;
  avgAttempts: number | null;
  hintUsageRate: number | null;
  difficultyScore: number | null;
  bottleneck: boolean;
}

export interface ExerciseRow {
  slug: string;
  title: string;
  difficulty?: string;
  tags: string[];
  attemptedStudents: number;
  passedStudents: number;
  completionRate: number | null;
  passRate: number | null;
  avgAttempts: number | null;
  hintUnlocks: number;
  hintUsageRate: number | null;
  difficultyScore: number | null;
}

export interface StudentRow {
  id: string;
  name: string;
  attemptedExercises: number;
  passedExercises: number;
  completionRate: number | null;
  totalAttempts: number;
  avgAttempts: number | null;
  hintUnlocks: number;
  lastActiveAt: string | null;
}

export type PairStatus = 'PASSED' | 'ATTEMPTED' | 'NOT_STARTED';

export interface PairRow {
  status: PairStatus;
  attempts: number;
  hintUnlocks: number;
  lastAt: string | null;
}

export interface ClassAnalytics {
  summary: Summary;
  tags: TagRow[];
  exercises: ExerciseRow[];
  students: StudentRow[];
}

interface Pair {
  attempts: number;
  passed: boolean;
  hints: number;
  lastAt: Date | null;
}

const ratio = (n: number, d: number, digits = 4): number | null =>
  d > 0 ? round(n / d, digits) : null;

export const round = (n: number, digits = 2): number => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

const key = (userId: string, slug: string) => `${userId}\u0000${slug}`;

/** Điểm khó 0..100; null khi chưa có cặp nào được thử. */
export function difficultyScore(
  passRate: number | null,
  avgAttempts: number | null,
  hintUsageRate: number | null,
): number | null {
  if (passRate === null || avgAttempts === null) return null;
  const attemptsPart = Math.min(1, Math.max(0, (avgAttempts - 1) / 4));
  const score =
    100 *
    (0.5 * (1 - passRate) + 0.3 * attemptsPart + 0.2 * (hintUsageRate ?? 0));
  return Math.round(score);
}

/** Gom bài nộp và gợi ý thành bảng cặp; bỏ qua dữ liệu ngoài phạm vi lớp. */
export function buildPairs(input: AnalyticsInput): Map<string, Pair> {
  const studentIds = new Set(input.students.map((s) => s.id));
  const slugs = new Set(input.exercises.map((e) => e.slug));
  const pairs = new Map<string, Pair>();
  const get = (u: string, s: string) => {
    const k = key(u, s);
    let p = pairs.get(k);
    if (!p)
      pairs.set(
        k,
        (p = { attempts: 0, passed: false, hints: 0, lastAt: null }),
      );
    return p;
  };
  for (const sub of input.submissions) {
    if (!studentIds.has(sub.userId) || !slugs.has(sub.exerciseSlug)) continue;
    if (!(GRADED_STATUSES as readonly string[]).includes(sub.status)) continue;
    const p = get(sub.userId, sub.exerciseSlug);
    p.attempts += 1;
    if (sub.status === PASS_STATUS) p.passed = true;
    if (!p.lastAt || sub.at > p.lastAt) p.lastAt = sub.at;
  }
  for (const h of input.hints) {
    if (!studentIds.has(h.userId) || !slugs.has(h.exerciseSlug)) continue;
    get(h.userId, h.exerciseSlug).hints += 1;
  }
  return pairs;
}

interface Agg {
  attemptedPairs: number;
  passedPairs: number;
  attempts: number;
  hintPairs: number;
  hintUnlocks: number;
}

const emptyAgg = (): Agg => ({
  attemptedPairs: 0,
  passedPairs: 0,
  attempts: 0,
  hintPairs: 0,
  hintUnlocks: 0,
});

function addPair(agg: Agg, p: Pair) {
  // Gợi ý chỉ tính trên cặp đã thử (cùng mẫu số với tỷ lệ đạt).
  if (p.attempts === 0) return;
  agg.attemptedPairs += 1;
  agg.attempts += p.attempts;
  if (p.passed) agg.passedPairs += 1;
  if (p.hints > 0) agg.hintPairs += 1;
  agg.hintUnlocks += p.hints;
}

const tagsOf = (e: AnalyticsExercise): string[] =>
  e.tags.length ? e.tags : [e.topic || UNTAGGED];

export function computeClassAnalytics(input: AnalyticsInput): ClassAnalytics {
  const pairs = buildPairs(input);
  const S = input.students.length;
  const E = input.exercises.length;

  const total = emptyAgg();
  const byExercise = new Map<string, Agg>();
  const byStudent = new Map<string, Agg & { last: Date | null }>();
  const byTag = new Map<string, Agg & { exercises: Set<string> }>();

  for (const e of input.exercises) {
    byExercise.set(e.slug, emptyAgg());
    for (const t of tagsOf(e)) {
      const row = byTag.get(t) ?? {
        ...emptyAgg(),
        exercises: new Set<string>(),
      };
      row.exercises.add(e.slug);
      byTag.set(t, row);
    }
  }
  for (const s of input.students)
    byStudent.set(s.id, { ...emptyAgg(), last: null });

  const exBySlug = new Map(input.exercises.map((e) => [e.slug, e]));
  for (const [k, p] of pairs) {
    const [userId, slug] = k.split('\u0000');
    addPair(total, p);
    addPair(byExercise.get(slug)!, p);
    const st = byStudent.get(userId)!;
    addPair(st, p);
    if (p.lastAt && (!st.last || p.lastAt > st.last)) st.last = p.lastAt;
    for (const t of tagsOf(exBySlug.get(slug)!)) addPair(byTag.get(t)!, p);
  }

  const summary: Summary = {
    students: S,
    exercises: E,
    attemptedPairs: total.attemptedPairs,
    passedPairs: total.passedPairs,
    totalAttempts: total.attempts,
    completionRate: ratio(total.passedPairs, S * E),
    passRate: ratio(total.passedPairs, total.attemptedPairs),
    avgAttempts: total.attemptedPairs
      ? round(total.attempts / total.attemptedPairs)
      : null,
    hintUnlocks: total.hintUnlocks,
    hintUsageRate: ratio(total.hintPairs, total.attemptedPairs),
  };

  const scoreOf = (a: Agg) =>
    difficultyScore(
      ratio(a.passedPairs, a.attemptedPairs),
      a.attemptedPairs ? a.attempts / a.attemptedPairs : null,
      ratio(a.hintPairs, a.attemptedPairs),
    );

  const tags: TagRow[] = [...byTag.entries()]
    .map(([tag, a]) => {
      const score = scoreOf(a);
      return {
        tag,
        exercises: a.exercises.size,
        attemptedPairs: a.attemptedPairs,
        passedPairs: a.passedPairs,
        passRate: ratio(a.passedPairs, a.attemptedPairs),
        avgAttempts: a.attemptedPairs
          ? round(a.attempts / a.attemptedPairs)
          : null,
        hintUsageRate: ratio(a.hintPairs, a.attemptedPairs),
        difficultyScore: score,
        bottleneck:
          score !== null &&
          score >= BOTTLENECK_SCORE &&
          a.attemptedPairs >= BOTTLENECK_MIN_PAIRS,
      };
    })
    .sort(
      (a, b) =>
        (b.difficultyScore ?? -1) - (a.difficultyScore ?? -1) ||
        a.tag.localeCompare(b.tag),
    );

  const exercises: ExerciseRow[] = input.exercises.map((e) => {
    const a = byExercise.get(e.slug)!;
    return {
      slug: e.slug,
      title: e.title,
      difficulty: e.difficulty,
      tags: e.tags,
      attemptedStudents: a.attemptedPairs,
      passedStudents: a.passedPairs,
      completionRate: ratio(a.passedPairs, S),
      passRate: ratio(a.passedPairs, a.attemptedPairs),
      avgAttempts: a.attemptedPairs
        ? round(a.attempts / a.attemptedPairs)
        : null,
      hintUnlocks: a.hintUnlocks,
      hintUsageRate: ratio(a.hintPairs, a.attemptedPairs),
      difficultyScore: scoreOf(a),
    };
  });

  const students: StudentRow[] = input.students.map((s) => {
    const a = byStudent.get(s.id)!;
    return {
      id: s.id,
      name: s.name,
      attemptedExercises: a.attemptedPairs,
      passedExercises: a.passedPairs,
      completionRate: ratio(a.passedPairs, E),
      totalAttempts: a.attempts,
      avgAttempts: a.attemptedPairs
        ? round(a.attempts / a.attemptedPairs)
        : null,
      hintUnlocks: a.hintUnlocks,
      lastActiveAt: a.last ? a.last.toISOString() : null,
    };
  });

  return { summary, tags, exercises, students };
}

const toPairRow = (p: Pair | undefined): PairRow => {
  if (!p || (p.attempts === 0 && p.hints === 0)) {
    return { status: 'NOT_STARTED', attempts: 0, hintUnlocks: 0, lastAt: null };
  }
  return {
    status: p.passed ? 'PASSED' : p.attempts > 0 ? 'ATTEMPTED' : 'NOT_STARTED',
    attempts: p.attempts,
    hintUnlocks: p.hints,
    lastAt: p.lastAt ? p.lastAt.toISOString() : null,
  };
};

/** Drill-down một học viên: mọi bài được giao, kể cả bài chưa làm. */
export function studentBreakdown(
  input: AnalyticsInput,
  userId: string,
): Array<{ slug: string; title: string; tags: string[] } & PairRow> {
  const pairs = buildPairs(input);
  return input.exercises.map((e) => ({
    slug: e.slug,
    title: e.title,
    tags: e.tags,
    ...toPairRow(pairs.get(key(userId, e.slug))),
  }));
}

/** Drill-down một bài tập: mọi học viên trong lớp, kể cả người chưa làm. */
export function exerciseBreakdown(
  input: AnalyticsInput,
  slug: string,
): Array<{ id: string; name: string } & PairRow> {
  const pairs = buildPairs(input);
  return input.students.map((s) => ({
    id: s.id,
    name: s.name,
    ...toPairRow(pairs.get(key(s.id, slug))),
  }));
}
