import type { ContestMyAttempt, ContestMyResultRow } from '../types/contest';

export interface ContestProblemResult {
  problemId: string;
  slug?: string;
  title: string;
  type: 'coding' | 'quiz';
  score: number;
  maxPoints: number;
  details: string;
  submittedAt: string;
  userCode?: string;
  quizAnswers?: Record<number, string>;
  /** Quiz nộp trong lúc thi: điểm chỉ công bố khi contest kết thúc. */
  pendingScore?: boolean;
}

export interface ContestAttemptResult {
  contestId: string;
  contestTitle: string;
  studentId: string;
  studentName: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  problemResults: ContestProblemResult[];
}

/** Mô tả kết quả một đề từ dữ liệu máy chủ (không còn do client tự tính). */
export function describeResult(row: ContestMyResultRow): string {
  if (!row.submitted) return 'Chưa nộp bài thi';
  if (row.type === 'quiz') {
    return row.resultHidden
      ? `Đã ghi nhận ${row.totalCount ?? 0} câu trắc nghiệm. Kết quả công bố sau khi cuộc thi kết thúc.`
      : `Đúng ${row.passedCount ?? 0}/${row.totalCount ?? 0} câu trắc nghiệm (${row.score ?? 0}/${row.maxPoints}đ)`;
  }
  return `Đạt ${row.passedCount ?? 0}/${row.totalCount ?? 0} Test cases (${row.score ?? 0}/${row.maxPoints}đ) — ${row.verdict ?? ''}`.trim();
}

export function resultFromRow(row: ContestMyResultRow, fallbackTime: string): ContestProblemResult {
  return {
    problemId: row.slug,
    slug: row.slug,
    title: row.title,
    type: row.type,
    score: row.score ?? 0,
    maxPoints: row.maxPoints,
    details: describeResult(row),
    submittedAt: row.submittedAt ?? fallbackTime,
    pendingScore: row.resultHidden,
  };
}

/** Bảng điểm cuối cùng dựng từ lượt thi do máy chủ giữ. */
export function buildAttemptResult(
  contest: { id: string; title: string },
  student: { id: string; name: string },
  mine: ContestMyAttempt,
): ContestAttemptResult {
  const completedAt = mine.attempt?.finishedAt ?? mine.attempt?.serverTime ?? new Date().toISOString();
  const percentage = mine.maxScore > 0 ? Math.min(100, Math.round((mine.totalScore / mine.maxScore) * 100)) : 0;
  return {
    contestId: contest.id,
    contestTitle: contest.title,
    studentId: student.id,
    studentName: student.name,
    completedAt,
    totalScore: mine.totalScore,
    maxScore: mine.maxScore,
    percentage,
    problemResults: mine.results.map((r) => resultFromRow(r, completedAt)),
  };
}

/** Khôi phục tiến độ đã nộp (theo thứ tự đề) từ máy chủ khi tải lại trang hoặc đổi máy. */
export function submittedResultsByIndex(
  problems: Array<{ slug?: string }>,
  mine: ContestMyAttempt,
): Record<number, ContestProblemResult> {
  const out: Record<number, ContestProblemResult> = {};
  const now = new Date().toISOString();
  problems.forEach((p, idx) => {
    const row = mine.results.find((r) => r.slug === p.slug);
    if (row?.submitted) out[idx] = resultFromRow(row, now);
  });
  return out;
}
