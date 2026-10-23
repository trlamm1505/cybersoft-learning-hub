import { BadRequestException, ForbiddenException } from '@nestjs/common';

/**
 * Vòng đời một bài nộp:
 *
 *   DRAFT ──▶ SUBMITTED ──▶ GRADING ──▶ GRADED ──▶ PUBLISHED ──▶ APPEALING ──▶ FINALIZED
 *     │                       ▲                        │             │
 *     └──▶ LATE ──────────────┘                        │             └──▶ GRADING (chấp nhận phúc khảo, chấm lại)
 *                                                      └──▶ FINALIZED (hết hạn phúc khảo / chốt luôn)
 *
 *   Mọi trạng thái (trừ FINALIZED) ──▶ INVALIDATED (giảng viên hủy, điểm về 0, bắt buộc lý do, ghi audit).
 *
 * LATE là nhánh của SUBMITTED: nộp sau hạn + ân hạn nhưng còn trong cửa sổ trễ; điểm bị chặn trần (xem assessment-policy).
 * FINALIZED và INVALIDATED là trạng thái kết thúc: không có chuyển trạng thái nào đi ra.
 */
export enum SubmissionState {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  LATE = 'LATE',
  GRADING = 'GRADING',
  GRADED = 'GRADED',
  PUBLISHED = 'PUBLISHED',
  APPEALING = 'APPEALING',
  FINALIZED = 'FINALIZED',
  INVALIDATED = 'INVALIDATED',
}

export const SUBMISSION_STATES = Object.values(SubmissionState);

/** Ai được thực hiện một bước chuyển: chủ bài (học viên sở hữu), giảng viên phụ trách lớp, hoặc hệ thống (hết giờ thi, khóa liêm chính). */
export type TransitionActor = 'OWNER' | 'CLASS_TEACHER' | 'SYSTEM';

interface TransitionRule {
  to: SubmissionState;
  actors: TransitionActor[];
}

const S = SubmissionState;

export const TRANSITIONS: Readonly<Record<SubmissionState, readonly TransitionRule[]>> = {
  [S.DRAFT]: [
    { to: S.SUBMITTED, actors: ['OWNER', 'SYSTEM'] },
    { to: S.LATE, actors: ['OWNER'] },
    { to: S.INVALIDATED, actors: ['CLASS_TEACHER'] },
  ],
  [S.SUBMITTED]: [
    { to: S.GRADING, actors: ['CLASS_TEACHER'] },
    { to: S.INVALIDATED, actors: ['CLASS_TEACHER'] },
  ],
  [S.LATE]: [
    { to: S.GRADING, actors: ['CLASS_TEACHER'] },
    { to: S.INVALIDATED, actors: ['CLASS_TEACHER'] },
  ],
  [S.GRADING]: [
    { to: S.GRADED, actors: ['CLASS_TEACHER'] },
    { to: S.INVALIDATED, actors: ['CLASS_TEACHER'] },
  ],
  [S.GRADED]: [
    { to: S.GRADING, actors: ['CLASS_TEACHER'] },
    { to: S.PUBLISHED, actors: ['CLASS_TEACHER'] },
    { to: S.INVALIDATED, actors: ['CLASS_TEACHER'] },
  ],
  [S.PUBLISHED]: [
    { to: S.APPEALING, actors: ['OWNER'] },
    { to: S.FINALIZED, actors: ['CLASS_TEACHER', 'SYSTEM'] },
    { to: S.INVALIDATED, actors: ['CLASS_TEACHER'] },
  ],
  [S.APPEALING]: [
    { to: S.GRADING, actors: ['CLASS_TEACHER'] },
    { to: S.FINALIZED, actors: ['CLASS_TEACHER'] },
    { to: S.INVALIDATED, actors: ['CLASS_TEACHER'] },
  ],
  [S.FINALIZED]: [],
  [S.INVALIDATED]: [],
};

/** Trạng thái đã "nộp" (có lượt nộp thật, dùng cho chuyên cần và số lần nộp). */
export const SUBMITTED_STATES: ReadonlySet<SubmissionState> = new Set([
  S.SUBMITTED,
  S.LATE,
  S.GRADING,
  S.GRADED,
  S.PUBLISHED,
  S.APPEALING,
  S.FINALIZED,
  S.INVALIDATED,
]);

/** Trạng thái đã có điểm chính thức công bố cho học viên (dùng tính điểm tổng kết). */
export const SCORED_STATES: ReadonlySet<SubmissionState> = new Set([S.PUBLISHED, S.APPEALING, S.FINALIZED, S.INVALIDATED]);

/** Trạng thái giảng viên còn được nhập/sửa điểm. */
export const GRADE_EDITABLE_STATES: ReadonlySet<SubmissionState> = new Set([S.GRADING]);

export const isTerminal = (s: SubmissionState): boolean => TRANSITIONS[s].length === 0;

export function canTransition(from: SubmissionState, to: SubmissionState, actor: TransitionActor): boolean {
  return TRANSITIONS[from]?.some((r) => r.to === to && r.actors.includes(actor)) ?? false;
}

/**
 * Kiểm tra một bước chuyển, ném lỗi có mã nghiệp vụ:
 * - FINALIZED: khóa cứng, mọi thao tác bị từ chối (403 E403_SUBMISSION_FINALIZED).
 * - Bước chuyển không tồn tại: 400 E400_INVALID_TRANSITION.
 * - Bước chuyển có nhưng sai người thực hiện: 403 E403_TRANSITION_FORBIDDEN.
 */
export function assertTransition(from: SubmissionState, to: SubmissionState, actor: TransitionActor): void {
  if (from === S.FINALIZED) {
    throw new ForbiddenException({ code: 'E403_SUBMISSION_FINALIZED', message: 'Bài nộp đã chốt (FINALIZED): không thể thay đổi.' });
  }
  const rule = TRANSITIONS[from]?.find((r) => r.to === to);
  if (!rule) {
    throw new BadRequestException({ code: 'E400_INVALID_TRANSITION', message: `Không thể chuyển bài nộp từ ${from} sang ${to}.` });
  }
  if (!rule.actors.includes(actor)) {
    throw new ForbiddenException({ code: 'E403_TRANSITION_FORBIDDEN', message: `Bạn không có quyền chuyển bài nộp từ ${from} sang ${to}.` });
  }
}

/** Sửa điểm chỉ hợp lệ khi đang GRADING; FINALIZED luôn bị khóa cứng. */
export function assertGradeEditable(state: SubmissionState): void {
  if (state === S.FINALIZED) {
    throw new ForbiddenException({ code: 'E403_SUBMISSION_FINALIZED', message: 'Bài nộp đã chốt (FINALIZED): không thể sửa điểm.' });
  }
  if (!GRADE_EDITABLE_STATES.has(state)) {
    throw new BadRequestException({ code: 'E400_NOT_GRADING', message: `Chỉ nhập điểm khi bài đang được chấm (GRADING), hiện là ${state}.` });
  }
}

export const MIN_REASON_LENGTH = 10;

/** Lý do bắt buộc (>= 10 ký tự sau khi bỏ khoảng trắng hai đầu). */
export function requireReasonText(reason: unknown, field = 'reason'): string {
  const text = typeof reason === 'string' ? reason.replace(/[\x00-\x1F\x7F]/g, ' ').trim() : '';
  if (text.length < MIN_REASON_LENGTH) {
    throw new BadRequestException({ code: 'E400_REASON_REQUIRED', message: `${field} bắt buộc, tối thiểu ${MIN_REASON_LENGTH} ký tự.` });
  }
  return text.slice(0, 1000);
}
