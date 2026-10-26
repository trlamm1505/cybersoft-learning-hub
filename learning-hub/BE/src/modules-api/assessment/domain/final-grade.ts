/**
 * Điểm tổng kết của một học viên trong một lớp (thang 100):
 *
 *   Final = 0.3 * AssignmentAvg + 0.4 * ContestAvg + 0.3 * ExamScore
 *
 * - Drop Lowest: bỏ 1 bài tập tuần có điểm thấp nhất (chỉ khi lớp có từ 2 bài trở lên). Bài bỏ nộp tính 0 nên thường là bài bị bỏ.
 * - Chuyên cần: số bài tập tuần bỏ nộp > 30% tổng số bài -> khóa kết quả, xếp loại F (không đạt chuẩn đầu ra).
 * - Lớp không có loại đánh giá nào (vd chưa tổ chức cuộc thi) thì trọng số của loại đó được chia lại theo tỷ lệ cho các loại còn lại,
 *   để học viên không bị mất điểm vì một hoạt động lớp không tổ chức.
 * - Chỉ điểm đã công bố (PUBLISHED, APPEALING, FINALIZED; INVALIDATED = 0) được tính; bài còn đang chấm được đếm vào `pending`.
 */
export const WEIGHTS = { assignment: 0.3, contest: 0.4, exam: 0.3 } as const;
export const ABSENCE_LIMIT_RATIO = 0.3;

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/** Thang chữ (thang 100): A >= 85, B >= 70, C >= 55, D >= 40, còn lại F. */
export function letterOf(score: number): LetterGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export interface GradeItem {
  assessmentId: string;
  /** Điểm quy về thang 100; null = chưa có điểm công bố. */
  score: number | null;
  /** Học viên có nộp bài này không (bất kỳ lượt nào đã nộp thật). */
  submitted: boolean;
  /** Đã nộp nhưng điểm chưa công bố. */
  pending?: boolean;
}

export interface FinalGradeInput {
  assignments: GradeItem[];
  contests: GradeItem[];
  exams: GradeItem[];
}

export interface FinalGradeResult {
  assignmentAvg: number | null;
  contestAvg: number | null;
  examScore: number | null;
  droppedAssignmentId: string | null;
  missedAssignments: number;
  totalAssignments: number;
  /** Trọng số thực dùng sau khi chia lại cho loại vắng mặt. */
  weights: { assignment: number; contest: number; exam: number };
  finalScore: number;
  letter: LetterGrade;
  /** Khóa kết quả vì vi phạm chuyên cần. */
  locked: boolean;
  lockReason: string | null;
  /** Số bài đã nộp nhưng chưa có điểm công bố (kết quả còn tạm thời). */
  pending: number;
  provisional: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const scoreOf = (i: GradeItem) => (typeof i.score === 'number' ? i.score : 0);

export function calculateFinalGrade(input: FinalGradeInput): FinalGradeResult {
  const { assignments, contests, exams } = input;
  const totalAssignments = assignments.length;
  const missedAssignments = assignments.filter((a) => !a.submitted).length;
  const pending = [...assignments, ...contests, ...exams].filter((i) => i.pending).length;

  // Drop Lowest: bỏ đúng 1 bài thấp nhất (bài bỏ nộp tính 0).
  let droppedAssignmentId: string | null = null;
  let counted = assignments;
  if (assignments.length >= 2) {
    const lowest = assignments.reduce((lo, a) => (scoreOf(a) < scoreOf(lo) ? a : lo));
    droppedAssignmentId = lowest.assessmentId;
    counted = assignments.filter((a) => a !== lowest);
  }
  const assignmentAvg = avg(counted.map(scoreOf));
  const contestAvg = avg(contests.map(scoreOf));
  // Một học phần thường có một bài thi; nếu có nhiều thì lấy trung bình.
  const examScore = avg(exams.map(scoreOf));

  const present = {
    assignment: assignmentAvg !== null ? WEIGHTS.assignment : 0,
    contest: contestAvg !== null ? WEIGHTS.contest : 0,
    exam: examScore !== null ? WEIGHTS.exam : 0,
  };
  const sum = present.assignment + present.contest + present.exam;
  const weights =
    sum > 0
      ? { assignment: present.assignment / sum, contest: present.contest / sum, exam: present.exam / sum }
      : { assignment: 0, contest: 0, exam: 0 };
  const raw = (assignmentAvg ?? 0) * weights.assignment + (contestAvg ?? 0) * weights.contest + (examScore ?? 0) * weights.exam;
  const finalScore = round2(raw);

  const locked = totalAssignments > 0 && missedAssignments / totalAssignments > ABSENCE_LIMIT_RATIO;
  return {
    assignmentAvg: assignmentAvg === null ? null : round2(assignmentAvg),
    contestAvg: contestAvg === null ? null : round2(contestAvg),
    examScore: examScore === null ? null : round2(examScore),
    droppedAssignmentId,
    missedAssignments,
    totalAssignments,
    weights: { assignment: round2(weights.assignment), contest: round2(weights.contest), exam: round2(weights.exam) },
    finalScore,
    letter: locked ? 'F' : letterOf(finalScore),
    locked,
    lockReason: locked
      ? `Bỏ nộp ${missedAssignments}/${totalAssignments} bài tập tuần (vượt ${Math.round(ABSENCE_LIMIT_RATIO * 100)}%): không đạt chuẩn đầu ra.`
      : null,
    pending,
    provisional: pending > 0,
  };
}
