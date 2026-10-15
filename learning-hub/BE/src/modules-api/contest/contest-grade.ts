import { BadRequestException, ForbiddenException } from '@nestjs/common';

/** Khối dự thi của cuộc thi: 'ALL' (mọi khối) hoặc riêng một khối. Cuộc thi cũ chưa khai báo là 'ALL'. */
export const CONTEST_GRADE_BANDS = ['ALL', '6-9', '10-12'] as const;
export type ContestGradeBand = (typeof CONTEST_GRADE_BANDS)[number];

/** Chuẩn hóa giá trị khối do client gửi; thiếu thì 'ALL', sai thì 400. */
export function normalizeContestGradeBand(raw: unknown): ContestGradeBand {
  if (raw === undefined || raw === null || raw === '') return 'ALL';
  if (!CONTEST_GRADE_BANDS.includes(raw as ContestGradeBand)) {
    throw new BadRequestException("gradeBand chỉ nhận 'ALL', '6-9' hoặc '10-12'.");
  }
  return raw as ContestGradeBand;
}

const LABEL: Record<string, string> = { '6-9': 'Khối 6–9', '10-12': 'Khối 10–12' };

/**
 * Học sinh chỉ vào phòng thi của đúng khối mình (hoặc cuộc thi mở cho mọi khối). Mọi người đều XEM được danh sách/chi tiết
 * cuộc thi; chặn ở đây áp dụng cho đăng ký, bắt đầu lượt thi, xem đề và nộp bài. Giảng viên/quản trị viên không bị chặn.
 */
export function assertGradeAccess(
  contest: { gradeBand?: string },
  viewer: { role?: string; ageGroup?: string } | undefined,
): void {
  const band = contest.gradeBand ?? 'ALL';
  if (band === 'ALL' || !viewer || viewer.role !== 'STUDENT') return;
  if (viewer.ageGroup !== band) {
    throw new ForbiddenException(`Cuộc thi dành riêng cho học sinh ${LABEL[band] ?? band}.`);
  }
}
