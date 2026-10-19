import { BadRequestException } from '@nestjs/common';
import { ContestManageService, DISQUALIFY_MIN_LEAVES } from './contest-manage.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { ContestHistoryService } from '../leaderboard/contest-history.service';

const OID = '507f1f77bcf86cd799439011';
const ATT = '64b000000000000000000001';
const teacher = { sub: 'teacher-1', role: 'TEACHER', email: 't@x.vn' };

const leanChain = (value: unknown) => {
  const c: any = {};
  for (const m of ['select', 'sort', 'limit']) c[m] = jest.fn(() => c);
  c.lean = jest.fn().mockResolvedValue(value);
  return c;
};

describe('Không công nhận kết quả (DISQUALIFIED)', () => {
  const contest: any = {
    _id: OID,
    slug: 'c',
    title: 'Cuộc thi',
    startTime: new Date(Date.now() - 3_600_000),
    endTime: new Date(Date.now() + 3_600_000),
    durationMinutes: 60,
    problems: [{ slug: 'code-1', title: 'Code 1', type: 'coding', points: 100 }],
    registrations: [
      { studentId: 'u1', studentName: 'An', registeredAt: new Date() },
      { studentId: 'u2', studentName: 'Bình', registeredAt: new Date() },
    ],
  };

  const make = (attemptDoc: any) => {
    const attemptModel: any = {
      findById: jest.fn(() => leanChain(attemptDoc)),
      updateOne: jest.fn().mockResolvedValue({}),
      find: jest.fn(() => leanChain([])),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const svc = new ContestManageService({ getContestForStaff: jest.fn().mockResolvedValue(contest) } as never, attemptModel, {} as never, {} as never, {} as never, {} as never, audit as never);
    return { svc, attemptModel, audit };
  };

  it('từ chối khi thí sinh rời màn hình < 3 lần', async () => {
    const { svc, attemptModel } = make({ _id: ATT, contestId: OID, studentId: 'u1', leaveCount: DISQUALIFY_MIN_LEAVES - 1 });
    await expect(svc.disqualify(OID, ATT, 'Rời màn hình nhiều lần khi làm bài', teacher)).rejects.toBeInstanceOf(BadRequestException);
    expect(attemptModel.updateOne).not.toHaveBeenCalled();
  });

  it('bắt buộc có lý do >= 10 ký tự', async () => {
    const { svc } = make({ _id: ATT, contestId: OID, studentId: 'u1', leaveCount: 3 });
    await expect(svc.disqualify(OID, ATT, 'ngắn', teacher)).rejects.toThrow(/lý do/);
  });

  it('khi leaveCount >= 3: ghi disqualified + lý do + người quyết định và ghi audit', async () => {
    const { svc, attemptModel, audit } = make({ _id: ATT, contestId: OID, studentId: 'u1', leaveCount: 3 });
    const res = await svc.disqualify(OID, ATT, 'Rời màn hình 3 lần khi làm bài thi', teacher);
    expect(res.disqualified).toBe(true);
    expect(attemptModel.updateOne.mock.calls[0][1].$set).toMatchObject({ disqualified: true, disqualifiedBy: 'teacher-1', disqualifiedReason: 'Rời màn hình 3 lần khi làm bài thi' });
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ sub: 'teacher-1' }), 'CONTEST_DISQUALIFY', 'CONTEST_ATTEMPT', ATT, expect.anything(), expect.anything(), 'Rời màn hình 3 lần khi làm bài thi');
  });

  it('không thể không công nhận lần hai; khôi phục chỉ khi đang bị loại', async () => {
    const dq = make({ _id: ATT, contestId: OID, studentId: 'u1', leaveCount: 4, disqualified: true });
    await expect(dq.svc.disqualify(OID, ATT, 'Rời màn hình 4 lần khi thi', teacher)).rejects.toThrow(/đã bị không công nhận/);
    const res = await dq.svc.reinstate(OID, ATT, teacher);
    expect(res.disqualified).toBe(false);
    expect(dq.audit.record).toHaveBeenCalledWith(expect.anything(), 'CONTEST_REINSTATE', 'CONTEST_ATTEMPT', ATT, expect.anything(), expect.anything());
    const ok = make({ _id: ATT, contestId: OID, studentId: 'u1', leaveCount: 4 });
    await expect(ok.svc.reinstate(OID, ATT, teacher)).rejects.toThrow(/đang được công nhận/);
  });

  it('lượt thi của cuộc thi khác bị coi là không tồn tại', async () => {
    const { svc } = make({ _id: ATT, contestId: 'other', studentId: 'u1', leaveCount: 5 });
    await expect(svc.disqualify(OID, ATT, 'Rời màn hình 5 lần khi thi', teacher)).rejects.toThrow(/Không tìm thấy/);
  });

  it('getResults: kèm số lần out-tab, thời gian hoàn thành, hạng chính thức (bỏ thí sinh bị loại) và canDisqualify', async () => {
    const t0 = new Date(Date.now() - 1_800_000);
    const attempts = [
      { _id: 'a1', studentId: 'u1', startedAt: t0, finishedAt: new Date(t0.getTime() + 20 * 60_000), deadlineAt: new Date(Date.now() + 1000), leaveCount: 4, disqualified: true, disqualifiedReason: 'Rời màn hình' },
      { _id: 'a2', studentId: 'u2', startedAt: t0, finishedAt: new Date(t0.getTime() + 25 * 60_000), deadlineAt: new Date(Date.now() + 1000), leaveCount: 3 },
    ];
    const attemptModel: any = { find: jest.fn(() => ({ lean: jest.fn().mockResolvedValue(attempts) })) };
    const subs = [
      { studentId: 'u1', problemSlug: 'code-1', score: 100, verdict: 'ACCEPTED' },
      { studentId: 'u2', problemSlug: 'code-1', score: 60, verdict: 'WRONG' },
    ];
    const submissionModel: any = { find: jest.fn(() => ({ select: () => ({ lean: jest.fn().mockResolvedValue(subs) }) })) };
    const svc = new ContestManageService({ getContestForStaff: jest.fn().mockResolvedValue(contest) } as never, attemptModel, submissionModel, {} as never, {} as never, {} as never);
    const res: any = await svc.getResults(OID, teacher);
    const u1 = res.rows.find((r: any) => r.studentId === 'u1');
    const u2 = res.rows.find((r: any) => r.studentId === 'u2');
    expect(u1).toMatchObject({ disqualified: true, officialRank: null, canDisqualify: false, leaveCount: 4, completionMinutes: 20, totalScore: 100 });
    expect(u2).toMatchObject({ disqualified: false, officialRank: 1, canDisqualify: true, leaveCount: 3 });
    expect(res.summary.disqualified).toBe(1);
  });
});

describe('Bảng xếp hạng chính thức & lịch sử cá nhân với thí sinh bị không công nhận', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  const contestDoc = { _id: '507f1f77bcf86cd799439011', startTime: start, endTime: new Date('2026-01-01T02:00:00.000Z'), durationMinutes: 120, problems: [{ slug: 'p1', points: 100, type: 'coding' }] };
  const sub = (studentId: string, score: number) => ({ studentId, studentName: studentId, problemSlug: 'p1', score, isLate: false, submittedAt: new Date(start.getTime() + 10 * 60_000) });

  it('leaderboard công khai loại học viên bị không công nhận', async () => {
    const contestModel: any = { findOne: jest.fn(() => ({ exec: async () => contestDoc })) };
    const subModel: any = { find: jest.fn(() => ({ sort: () => ({ lean: async () => [sub('u1', 100), sub('u2', 80)] }) })) };
    const attemptModel: any = { find: jest.fn(() => ({ select: () => ({ lean: async () => [{ studentId: 'u1', startedAt: start, disqualified: true }] }) })) };
    const lb = await new LeaderboardService(contestModel, subModel, undefined, attemptModel).computeLeaderboard(contestDoc._id, { asTeacher: true });
    expect(lb.rows.map((r) => r.studentId)).toEqual(['u2']);
    expect(lb.rows[0].rank).toBe(1);
    expect(lb.disqualifiedCount).toBe(1);
  });

  it('lịch sử cá nhân: vẫn thấy điểm của mình, nhưng hạng = null và có cờ disqualified', async () => {
    const subsFind: any = jest.fn((f: any) => (f.isLate === false ? { select: () => ({ lean: async () => [{ problemSlug: 'p1', score: 100 }] }) } : { select: () => ({ sort: () => ({ lean: async () => [{ contestId: contestDoc._id, submittedAt: start }] }) }) }));
    const contests: any = { find: () => ({ select: () => ({ lean: async () => [contestDoc] }) }) };
    const attempts: any = { find: () => ({ lean: async () => [{ contestId: contestDoc._id, studentId: 'u1', startedAt: start, finishedAt: new Date(start.getTime() + 600_000), disqualified: true, disqualifiedReason: 'Rời màn hình 3 lần' }] }) };
    const board: any = { computeLeaderboard: async () => ({ rows: [{ studentId: 'u2', rank: 1, totalScore: 80, timeMinutes: 10, penaltyMinutes: 0 }], computedStatus: 'ENDED', isFrozen: false }) };
    const rows = await new ContestHistoryService(contests, { find: subsFind } as never, attempts, board).myHistory('u1');
    expect(rows[0]).toMatchObject({ score: 100, rank: null, disqualified: true, disqualifiedReason: 'Rời màn hình 3 lần' });
  });
});
