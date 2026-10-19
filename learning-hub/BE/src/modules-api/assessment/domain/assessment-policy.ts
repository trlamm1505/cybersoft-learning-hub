import { BadRequestException, ForbiddenException } from '@nestjs/common';

/** Ba loại hình đánh giá, tách bạch qua assessmentType. */
export enum AssessmentType {
  ASSIGNMENT = 'ASSIGNMENT',
  CONTEST = 'CONTEST',
  EXAM = 'EXAM',
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export interface AssessmentPolicy {
  maxAttempts: number;
  /** Ân hạn không phạt (chống rớt mạng). */
  gracePeriodMs: number;
  /** Cửa sổ nộp trễ tính từ hạn nộp: trong cửa sổ thì vào LATE và bị chặn trần điểm; quá cửa sổ thì không nhận. */
  lateWindowMs: number;
  /** Trần điểm (tỷ lệ trên điểm tối đa) cho bài LATE. */
  lateCapRatio: number;
  /** Không trả chi tiết test case/đáp án cho học viên sau khi nộp. */
  hideDetails: boolean;
  /** Giám sát liêm chính (rời màn hình) bật bắt buộc. */
  integrityMonitoring: boolean;
}

export const POLICIES: Readonly<Record<AssessmentType, AssessmentPolicy>> = {
  [AssessmentType.ASSIGNMENT]: {
    maxAttempts: 3,
    gracePeriodMs: 5 * MINUTE,
    lateWindowMs: 24 * HOUR,
    lateCapRatio: 0.9,
    hideDetails: false,
    integrityMonitoring: false,
  },
  [AssessmentType.CONTEST]: {
    maxAttempts: 1,
    gracePeriodMs: 0,
    lateWindowMs: 0,
    lateCapRatio: 1,
    hideDetails: false,
    integrityMonitoring: true,
  },
  [AssessmentType.EXAM]: {
    maxAttempts: 1,
    gracePeriodMs: 0,
    lateWindowMs: 0,
    lateCapRatio: 1,
    hideDetails: true,
    integrityMonitoring: false,
  },
};

/** Hạn nộp bài tập tuần phải cách hiện tại hơn 1 giờ. */
export const ASSIGNMENT_MIN_LEAD_MS = HOUR;
export const CONTEST_MIN_DURATION = 5;
export const CONTEST_MAX_DURATION = 600;
export const DEFAULT_MAX_SCORE = 100;

export interface AssessmentInput {
  assessmentType?: unknown;
  title?: unknown;
  maxScore?: unknown;
  dueDate?: unknown;
  startTime?: unknown;
  durationMinutes?: unknown;
}

export interface ValidAssessment {
  assessmentType: AssessmentType;
  title: string;
  maxScore: number;
  dueDate: Date | null;
  startTime: Date | null;
  durationMinutes: number | null;
}

const bad = (code: string, message: string) => new BadRequestException({ code, message });

const toDate = (v: unknown): Date | null => {
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v : null;
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
};

/** Validation DTO khi giảng viên tạo bài đánh giá; mỗi loại có trường bắt buộc riêng. */
export function validateAssessmentInput(input: AssessmentInput, now: Date = new Date()): ValidAssessment {
  const type = input.assessmentType as AssessmentType;
  if (!Object.values(AssessmentType).includes(type)) {
    throw bad('E400_INVALID_ASSESSMENT_TYPE', 'assessmentType phải là ASSIGNMENT, CONTEST hoặc EXAM.');
  }
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length < 3 || title.length > 200) throw bad('E400_INVALID_TITLE', 'Tiêu đề từ 3 đến 200 ký tự.');
  const maxScore = input.maxScore === undefined ? DEFAULT_MAX_SCORE : Number(input.maxScore);
  if (!Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 1000) throw bad('E400_INVALID_MAX_SCORE', 'maxScore phải trong khoảng (0, 1000].');

  if (type === AssessmentType.CONTEST) {
    const startTime = toDate(input.startTime);
    if (!startTime) throw bad('E400_START_TIME_REQUIRED', 'Cuộc thi bắt buộc có startTime.');
    if (startTime.getTime() <= now.getTime()) throw bad('E400_START_TIME_PAST', 'startTime của cuộc thi phải ở tương lai.');
    const durationMinutes = Number(input.durationMinutes);
    if (!Number.isInteger(durationMinutes) || durationMinutes < CONTEST_MIN_DURATION || durationMinutes > CONTEST_MAX_DURATION) {
      throw bad('E400_INVALID_DURATION', `durationMinutes là số nguyên từ ${CONTEST_MIN_DURATION} đến ${CONTEST_MAX_DURATION}.`);
    }
    return { assessmentType: type, title, maxScore, dueDate: null, startTime, durationMinutes };
  }

  const dueDate = toDate(input.dueDate);
  if (!dueDate) throw bad('E400_DUE_DATE_REQUIRED', 'Bắt buộc có dueDate.');
  const minLead = type === AssessmentType.ASSIGNMENT ? ASSIGNMENT_MIN_LEAD_MS : 0;
  if (dueDate.getTime() <= now.getTime() + minLead) {
    throw bad(
      'E400_DUE_DATE_TOO_SOON',
      type === AssessmentType.ASSIGNMENT ? 'Hạn nộp bài tập tuần phải sau thời điểm hiện tại ít nhất 1 giờ.' : 'Hạn nộp phải ở tương lai.',
    );
  }
  return { assessmentType: type, title, maxScore, dueDate, startTime: null, durationMinutes: null };
}

export interface AssessmentTiming {
  assessmentType: AssessmentType;
  dueDate?: Date | null;
  startTime?: Date | null;
  durationMinutes?: number | null;
}

/** Thời điểm kết thúc cuộc thi = startTime + durationMinutes. */
export const contestEndsAt = (a: AssessmentTiming): Date | null =>
  a.startTime && a.durationMinutes ? new Date(new Date(a.startTime).getTime() + a.durationMinutes * MINUTE) : null;

export type SubmissionTiming = 'ON_TIME' | 'LATE';

/**
 * Phân loại thời điểm nộp:
 * - Bài tập tuần: <= hạn + 5 phút ân hạn -> ON_TIME; <= hạn + 24h -> LATE (trần 90%); quá nữa -> từ chối.
 * - Cuộc thi: chỉ nhận trong [startTime, startTime + duration].
 * - Thi kết thúc học phần: chỉ nhận trước hạn, không ân hạn, không nộp trễ.
 */
export function classifySubmissionTime(a: AssessmentTiming, at: Date): SubmissionTiming {
  const policy = POLICIES[a.assessmentType];
  const t = at.getTime();
  if (a.assessmentType === AssessmentType.CONTEST) {
    const start = a.startTime ? new Date(a.startTime).getTime() : NaN;
    const end = contestEndsAt(a)?.getTime() ?? NaN;
    if (!(t >= start)) throw new ForbiddenException({ code: 'E403_CONTEST_NOT_STARTED', message: 'Cuộc thi chưa bắt đầu.' });
    if (t > end) throw new ForbiddenException({ code: 'E403_CONTEST_ENDED', message: 'Cuộc thi đã kết thúc.' });
    return 'ON_TIME';
  }
  const due = a.dueDate ? new Date(a.dueDate).getTime() : NaN;
  if (!Number.isFinite(due)) throw new BadRequestException({ code: 'E400_DUE_DATE_REQUIRED', message: 'Bài đánh giá chưa có hạn nộp.' });
  if (t <= due + policy.gracePeriodMs) return 'ON_TIME';
  if (policy.lateWindowMs > 0 && t <= due + policy.lateWindowMs) return 'LATE';
  throw new ForbiddenException({ code: 'E403_DEADLINE_PASSED', message: 'Đã quá hạn nộp bài.' });
}

/** Điểm cuối của một lượt: chặn trong [0, maxScore]; bài LATE bị chặn trần lateCapRatio * maxScore. */
export function effectiveScore(rawScore: number, maxScore: number, isLate: boolean, type: AssessmentType): number {
  const clamped = Math.min(Math.max(rawScore, 0), maxScore);
  if (!isLate) return clamped;
  return Math.min(clamped, POLICIES[type].lateCapRatio * maxScore);
}

/** Còn được nộp thêm không (đếm các lượt đã nộp thật, không đếm bản nháp). */
export function assertCanAttempt(type: AssessmentType, usedAttempts: number): void {
  const max = POLICIES[type].maxAttempts;
  if (usedAttempts >= max) {
    throw new ForbiddenException({
      code: 'E403_MAX_ATTEMPTS',
      message: max === 1 ? 'Bài này chỉ được nộp một lần.' : `Đã dùng hết ${max} lượt nộp.`,
    });
  }
}

/** Lượt được ghi nhận: bài tập tuần lấy lượt có điểm cao nhất; cuộc thi/thi chỉ có một lượt. Bỏ qua lượt chưa có điểm. */
export function pickCountedAttempt<T extends { score: number | null; attemptNo: number }>(attempts: T[]): T | null {
  const scored = attempts.filter((a) => typeof a.score === 'number');
  if (scored.length === 0) return null;
  return scored.reduce((best, a) => ((a.score as number) > (best.score as number) || ((a.score as number) === (best.score as number) && a.attemptNo < best.attemptNo) ? a : best));
}

/** Những trường chỉ giảng viên được thấy với bài thi (EXAM): chi tiết test case, đáp án, nhận xét từng câu. */
export const EXAM_HIDDEN_FIELDS = ['testResults', 'answerKey', 'details', 'feedbackItems', 'rubricGrades'] as const;

/** Bản xem của học viên: Exam không lộ chi tiết; điểm chỉ hiện khi đã công bố. */
export function redactForStudent<T extends Record<string, unknown>>(type: AssessmentType, sub: T, scoreVisible: boolean): Partial<T> {
  const out: Record<string, unknown> = { ...sub };
  if (POLICIES[type].hideDetails) for (const f of EXAM_HIDDEN_FIELDS) delete out[f];
  if (!scoreVisible) {
    delete out.score;
    delete out.rawScore;
  }
  delete out.gradedBy;
  return out as Partial<T>;
}
