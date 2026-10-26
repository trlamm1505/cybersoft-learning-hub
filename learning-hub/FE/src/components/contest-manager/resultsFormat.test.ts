import { describe, expect, it } from 'vitest';
import { filterParticipants, PARTICIPANT_STATUS_LABEL, sortByRank, sortParticipants, toCsv } from './resultsFormat';
import type { ContestManageResults, ContestParticipantRow } from '../../types/contest';

const row = (
  name: string,
  totalScore: number,
  reviewStatus?: 'NEEDS_REVIEW' | 'REVIEWED' | 'NORMAL',
  extra: Partial<ContestParticipantRow> = {},
): ContestParticipantRow => ({
  studentId: name,
  studentName: name,
  registeredAt: '',
  attemptId: null,
  status: 'FINISHED',
  startedAt: null,
  finishedAt: null,
  totalScore,
  leaveCount: 0,
  completionMinutes: null,
  officialRank: null,
  disqualified: false,
  disqualifiedReason: null,
  canDisqualify: false,
  perProblem: [],
  integrity: reviewStatus
    ? { flag: 'REVIEW', reviewStatus, decision: null, similarityScore: 0.9, focusCount: 0, awaySeconds: 0, activeSeconds: 0 }
    : null,
  ...extra,
});

describe('kết quả cuộc thi cho giảng viên', () => {
  it('sắp xếp: cần xem xét lên đầu, rồi điểm cao, rồi theo tên; không đổi mảng gốc', () => {
    const rows = [row('An', 50), row('Bình', 90), row('Chi', 10, 'NEEDS_REVIEW'), row('Dũng', 90, 'REVIEWED')];
    expect(sortParticipants(rows).map((r) => r.studentName)).toEqual(['Chi', 'Bình', 'Dũng', 'An']);
    expect(rows.map((r) => r.studentName)).toEqual(['An', 'Bình', 'Chi', 'Dũng']);
  });

  it('lọc chỉ các bài cần xem xét', () => {
    const rows = [row('An', 50), row('Chi', 10, 'NEEDS_REVIEW'), row('Dũng', 90, 'REVIEWED')];
    expect(filterParticipants(rows, true).map((r) => r.studentName)).toEqual(['Chi']);
    expect(filterParticipants(rows, false)).toHaveLength(3);
  });

  it('nhãn trạng thái đủ cho mọi trạng thái', () => {
    expect(Object.keys(PARTICIPANT_STATUS_LABEL).sort()).toEqual(['EXPIRED', 'FINISHED', 'IN_PROGRESS', 'NOT_STARTED']);
  });

  it('xuất CSV: tiêu đề theo đề, dấu phẩy/ngoặc kép được escape, chặn CSV injection', () => {
    const data = {
      contest: {
        maxScore: 100,
        problems: [
          { slug: 'a', title: 'Bài "A", khó', type: 'coding', maxPoints: 60 },
          { slug: 'q', title: 'Quiz', type: 'quiz', maxPoints: 40 },
        ],
      },
      rows: [
        row('=HYPERLINK("x")', 60, undefined, { perProblem: [{ slug: 'a', score: 60, verdict: 'AC' }] }),
        row('Bình', 0, undefined, { status: 'NOT_STARTED' }),
      ],
    } as unknown as ContestManageResults;
    const lines = toCsv(data).split('\r\n');
    expect(lines[0]).toBe('Thí sinh,Trạng thái,Hạng chính thức,Số lần rời màn hình,Thời gian hoàn thành (phút),"Bài ""A"", khó (/60)",Quiz (/40),Tổng (/100)');
    expect(lines[1]).toBe('"\'=HYPERLINK(""x"")",Đã nộp,,0,,60,,60');
    expect(lines[2]).toBe('Bình,Chưa vào thi,,0,,,,0');
  });
});

describe('bảng xếp hạng chính thức', () => {
  it('xếp theo hạng chính thức; chưa có hạng rồi thí sinh bị không công nhận xuống cuối', () => {
    const rows = [
      row('Bị loại', 100, undefined, { disqualified: true, leaveCount: 4 }),
      row('Hạng 2', 70, undefined, { officialRank: 2 }),
      row('Chưa thi', 0, undefined, { status: 'NOT_STARTED' }),
      row('Hạng 1', 90, undefined, { officialRank: 1 }),
    ];
    expect(sortByRank(rows).map((r) => r.studentName)).toEqual(['Hạng 1', 'Hạng 2', 'Chưa thi', 'Bị loại']);
  });

  it('CSV ghi "Không công nhận" và để trống hạng của thí sinh bị loại', () => {
    const data = { contest: { problems: [], maxScore: 100, slug: 'x' }, rows: [row('An', 100, undefined, { disqualified: true, leaveCount: 3, completionMinutes: 20 })] } as unknown as ContestManageResults;
    expect(toCsv(data).split('\r\n')[1]).toBe('An,Không công nhận,,3,20,100');
  });
});
