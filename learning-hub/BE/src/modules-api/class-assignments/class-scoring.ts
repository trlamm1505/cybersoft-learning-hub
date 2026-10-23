/**
 * Quy tắc chấm điểm bài được giao cho lớp. Hàm thuần (không đụng CSDL) để kiểm thử độc lập.
 *
 *  - Bài CODING: điểm = maxPoints trừ 1 điểm cho MỖI lần nộp sai (WA/TLE/RE) xảy ra TRƯỚC lần AC đầu tiên, tối thiểu 0.
 *    Lỗi cú pháp (CE) và lỗi hệ thống chấm (FAILED) không bị trừ. Chưa AC thì chưa có điểm.
 *    Bấm "Run" thử không tạo bài nộp nên không bao giờ bị trừ.
 *  - Bài QUIZ: điểm = điểm đạt / tổng điểm đề * maxPoints (làm tròn 1 chữ số thập phân), chỉ một lượt thi.
 *  - Xếp hạng lớp: tổng điểm giảm dần; bằng điểm thì ai hoàn thành bài gần nhất SỚM hơn xếp trước.
 */
export const WRONG_STATUSES = new Set(['WA', 'TLE', 'RE']);
export const PENALTY_PER_WRONG = 1;

export interface CodingSubmission {
  status: string;
  createdAt: Date;
}

export interface CodingScore {
  done: boolean;
  /** Số lần nộp sai trước khi AC (hoặc tổng số lần sai nếu chưa AC). */
  wrongCount: number;
  /** Số lần nộp đã chấm xong (không tính hàng đợi/đang chạy). */
  attempts: number;
  /** Điểm đã đạt (0 nếu chưa AC). */
  score: number;
  /** Điểm sẽ nhận nếu AC ngay bây giờ. */
  potentialScore: number;
  completedAt?: Date;
}

const TERMINAL = new Set(['AC', 'WA', 'TLE', 'RE', 'CE', 'FAILED']);

export function scoreCoding(subs: CodingSubmission[], maxPoints: number): CodingScore {
  const sorted = subs
    .filter((s) => TERMINAL.has(s.status))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let wrong = 0;
  for (const s of sorted) {
    if (s.status === 'AC') {
      return {
        done: true,
        wrongCount: wrong,
        attempts: sorted.length,
        score: Math.max(0, maxPoints - wrong * PENALTY_PER_WRONG),
        potentialScore: Math.max(0, maxPoints - wrong * PENALTY_PER_WRONG),
        completedAt: s.createdAt,
      };
    }
    if (WRONG_STATUSES.has(s.status)) wrong++;
  }
  return {
    done: false,
    wrongCount: wrong,
    attempts: sorted.length,
    score: 0,
    potentialScore: Math.max(0, maxPoints - wrong * PENALTY_PER_WRONG),
  };
}

export interface QuizAttemptLike {
  score: number;
  maxScore: number;
  submittedAt?: Date;
}

export interface QuizScore {
  done: boolean;
  score: number;
  completedAt?: Date;
}

export function scoreQuiz(attempt: QuizAttemptLike | null | undefined, maxPoints: number): QuizScore {
  if (!attempt || !attempt.submittedAt) return { done: false, score: 0 };
  const ratio = attempt.maxScore > 0 ? attempt.score / attempt.maxScore : 0;
  return { done: true, score: Math.round(ratio * maxPoints * 10) / 10, completedAt: attempt.submittedAt };
}

export type AssignmentState = 'DONE' | 'EXPIRED' | 'NOT_OPEN' | 'IN_PROGRESS' | 'NOT_STARTED';

/** Trạng thái hiển thị: hoàn thành > hết hạn (chưa xong mà quá hạn là KHÓA) > chưa mở > đang làm > chưa làm. */
export function assignmentState(
  a: { startAt: Date; dueAt: Date },
  r: { done: boolean; attempts: number },
  now: Date,
): AssignmentState {
  if (r.done) return 'DONE';
  if (now.getTime() > a.dueAt.getTime()) return 'EXPIRED';
  if (now.getTime() < a.startAt.getTime()) return 'NOT_OPEN';
  return r.attempts > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
}

/** Bài còn được làm/nộp không (đang trong khung giờ và chưa hoàn thành). */
export const isOpenForWork = (state: AssignmentState): boolean => state === 'IN_PROGRESS' || state === 'NOT_STARTED';

export interface MemberTotals {
  userId: string;
  name: string;
  points: number;
  doneCount: number;
  lastScoredAt?: Date | null;
}

export interface RankedMember extends MemberTotals {
  rank: number;
}

/** Điểm giảm dần; bằng điểm thì hoàn thành sớm hơn xếp trước (chưa hoàn thành bài nào xếp cuối), rồi theo tên. */
export function rankMembers(members: MemberTotals[]): RankedMember[] {
  const t = (m: MemberTotals) => (m.lastScoredAt ? m.lastScoredAt.getTime() : Number.POSITIVE_INFINITY);
  const sorted = [...members].sort(
    (a, b) => b.points - a.points || t(a) - t(b) || a.name.localeCompare(b.name, 'vi'),
  );
  return sorted.map((m, i) => ({ ...m, rank: i + 1 }));
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Ngày (YYYY-MM-DD) của một thời điểm theo giờ Việt Nam (UTC+7), dùng để nhóm bài theo ngày được giao. */
export const vnDayKey = (d: Date): string => new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
