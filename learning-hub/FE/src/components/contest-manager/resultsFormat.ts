import type { ContestManageResults, ContestParticipantRow, ContestParticipantStatus } from '../../types/contest';

export const PARTICIPANT_STATUS_LABEL: Record<ContestParticipantStatus, string> = {
  NOT_STARTED: 'Chưa vào thi',
  IN_PROGRESS: 'Đang làm',
  FINISHED: 'Đã nộp',
  EXPIRED: 'Hết giờ (chưa chốt)',
};

/** Hàng chờ xem xét lên đầu, rồi theo điểm giảm dần, rồi theo tên. Không đổi mảng gốc. */
export const sortParticipants = (rows: ContestParticipantRow[]): ContestParticipantRow[] => {
  const rank = (r: ContestParticipantRow) => (r.integrity?.reviewStatus === 'NEEDS_REVIEW' ? 0 : 1);
  return [...rows].sort(
    (a, b) =>
      rank(a) - rank(b) || b.totalScore - a.totalScore || a.studentName.localeCompare(b.studentName, 'vi'),
  );
};

export const filterParticipants = (rows: ContestParticipantRow[], onlyReview: boolean): ContestParticipantRow[] =>
  onlyReview ? rows.filter((r) => r.integrity?.reviewStatus === 'NEEDS_REVIEW') : rows;

const csvCell = (value: string | number): string => {
  let text = String(value);
  // Chống "CSV injection": ô bắt đầu bằng = + - @ bị Excel hiểu là công thức.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Bảng điểm xuất CSV: mỗi thí sinh một dòng, mỗi đề một cột. */
export const toCsv = (data: ContestManageResults): string => {
  const head = [
    'Thí sinh',
    'Trạng thái',
    ...data.contest.problems.map((p) => `${p.title} (/${p.maxPoints})`),
    `Tổng (/${data.contest.maxScore})`,
  ];
  const lines = data.rows.map((r) => [
    r.studentName,
    PARTICIPANT_STATUS_LABEL[r.status],
    ...data.contest.problems.map((p) => r.perProblem.find((x) => x.slug === p.slug)?.score ?? ''),
    r.totalScore,
  ]);
  return [head, ...lines].map((cols) => cols.map(csvCell).join(',')).join('\r\n');
};
