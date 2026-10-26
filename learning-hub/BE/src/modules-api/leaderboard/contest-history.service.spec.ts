import 'reflect-metadata';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { ContestHistoryService, durationMinutesOf, StudentContestHistoryController } from './contest-history.service';

const C1 = '64b0000000000000000000c1';
const C2 = '64b0000000000000000000c2';
const at = (iso: string) => new Date(iso);

const q = (value: unknown) => {
  const c: any = {};
  for (const m of ['select', 'sort']) c[m] = () => c;
  c.lean = () => Promise.resolve(value);
  return c;
};

describe('durationMinutesOf', () => {
  it('làm tròn phút, tối thiểu 1, null khi thiếu mốc hoặc âm', () => {
    expect(durationMinutesOf(at('2026-01-01T00:00:00Z'), at('2026-01-01T00:42:20Z'))).toBe(42);
    expect(durationMinutesOf(at('2026-01-01T00:00:00Z'), at('2026-01-01T00:00:10Z'))).toBe(1);
    expect(durationMinutesOf(undefined, at('2026-01-01T00:00:10Z'))).toBeNull();
    expect(durationMinutesOf(at('2026-01-02T00:00:00Z'), at('2026-01-01T00:00:00Z'))).toBeNull();
  });
});

describe('ContestHistoryService', () => {
  const build = (subs: unknown[]) => {
    const submissions = { find: jest.fn(() => q(subs)) };
    const contests = {
      find: jest.fn(() =>
        q([
          { _id: C1, title: 'Thi giữa kỳ', problems: [{ points: 50 }, { points: 50 }] },
          { _id: C2, title: 'Thi cuối kỳ', problems: [{ points: 100 }] },
        ]),
      ),
    };
    const attempts = {
      find: jest.fn(() => q([{ contestId: C1, startedAt: at('2026-10-01T01:00:00Z'), finishedAt: at('2026-10-01T01:45:00Z') }])),
    };
    const leaderboard = {
      computeLeaderboard: jest.fn(async (id: string) =>
        id === C1
          ? { computedStatus: 'ENDED', isFrozen: false, rows: [{ rank: 1, studentId: 'x', totalScore: 100, timeMinutes: 1, penaltyMinutes: 0 }, { rank: 2, studentId: 'u1', totalScore: 80, timeMinutes: 30, penaltyMinutes: 20 }] }
          : { computedStatus: 'ONGOING', isFrozen: false, rows: [{ rank: 1, studentId: 'u1', totalScore: 100, timeMinutes: 10, penaltyMinutes: 0 }] },
      ),
    };
    const service = new ContestHistoryService(contests as never, submissions as never, attempts as never, leaderboard as never);
    return { service, submissions };
  };

  it('chưa nộp bài cuộc thi nào: danh sách rỗng', async () => {
    expect(await build([]).service.myHistory('u1')).toEqual([]);
  });

  it('chỉ truy vấn bài nộp của chính học viên và trả tên, điểm, thời gian, hạng/tổng thí sinh', async () => {
    const { service, submissions } = build([
      { contestId: C1, submittedAt: at('2026-10-01T01:10:00Z') },
      { contestId: C2, submittedAt: at('2026-10-10T02:00:00Z') },
    ]);
    const rows = await service.myHistory('u1');
    expect(submissions.find).toHaveBeenCalledWith({ studentId: 'u1' });
    expect(rows.map((r) => r.title)).toEqual(['Thi cuối kỳ', 'Thi giữa kỳ']); // mới nhất trước
    const mid = rows.find((r) => r.contestId === C1)!;
    expect(mid).toMatchObject({ score: 80, maxScore: 100, durationMinutes: 45, rank: 2, totalParticipants: 2, provisional: false });
    expect(mid.joinedAt).toEqual(at('2026-10-01T01:00:00Z'));
    const fin = rows.find((r) => r.contestId === C2)!;
    expect(fin).toMatchObject({ rank: 1, provisional: true }); // đang diễn ra: hạng tạm thời
  });
});

describe('StudentContestHistoryController', () => {
  it('chỉ STUDENT', () => {
    expect(Reflect.getMetadata(ROLES_KEY, StudentContestHistoryController)).toEqual(['STUDENT']);
  });
});
