import { cleanDisplayName, DEFAULT_FREEZE_MINUTES, LeaderboardService } from './leaderboard.service';

const T0 = new Date('2026-01-01T00:00:00.000Z');
const END = new Date('2026-01-01T03:00:00.000Z'); // thi 180 phút => đóng băng từ phút 120
const min = (m: number) => new Date(T0.getTime() + m * 60_000);

const contest = {
  _id: '507f1f77bcf86cd799439011',
  startTime: T0,
  endTime: END,
  durationMinutes: 180,
  problems: [
    { slug: 'p1', points: 100 },
    { slug: 'p2', points: 100 },
  ],
};

const sub = (studentId: string, problemSlug: string, score: number, at: number, over: object = {}) => ({
  studentId,
  studentName: studentId,
  problemSlug,
  score,
  submittedAt: min(at),
  isLate: false,
  ...over,
});

function build(opts: { subs: any[]; attempts?: any[]; users?: any[]; withUsers?: boolean }) {
  const contestModel = { findOne: () => ({ exec: async () => contest }) };
  const submissionModel = {
    find: (f: any) => ({
      sort: () => ({
        lean: async () =>
          opts.subs.filter((s) => (f.isLate === false ? s.isLate === false : true) && (!f.submittedAt?.$lte || s.submittedAt <= f.submittedAt.$lte)),
      }),
    }),
  };
  const attemptModel = { find: () => ({ select: () => ({ lean: async () => opts.attempts ?? [] }) }) };
  const userModel = { find: () => ({ select: () => ({ lean: async () => opts.users ?? [] }) }) };
  return new LeaderboardService(contestModel as never, submissionModel as never, opts.withUsers === false ? undefined : (userModel as never), attemptModel as never);
}

describe('ICPC leaderboard', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(min(100)));
  afterEach(() => jest.useRealTimers());

  it('phạt thời gian CHỈ với bài đạt điểm tối đa: thời gian = (lúc đạt - lúc bắt đầu) + 20 phút x số lần sai trước đó', async () => {
    const svc = build({
      subs: [
        sub('A', 'p1', 0, 5),
        sub('A', 'p1', 40, 10),
        sub('A', 'p1', 100, 30), // 2 lần chưa đủ điểm trước đó
      ],
    });
    const [a] = (await svc.computeLeaderboard(contest._id)).rows;
    expect(a).toMatchObject({ totalScore: 100, timeMinutes: 30, penaltyMinutes: 40, solvedCount: 1 });
  });

  it('bài chưa đạt điểm tối đa không bị cộng phạt hay thời gian vào tổng, dù nộp sai nhiều lần', async () => {
    const svc = build({
      subs: [sub('A', 'p1', 60, 5), sub('A', 'p1', 60, 8), sub('A', 'p1', 70, 12), sub('A', 'p2', 100, 20)],
    });
    const [a] = (await svc.computeLeaderboard(contest._id)).rows;
    expect(a).toMatchObject({ totalScore: 170, timeMinutes: 20, penaltyMinutes: 0, solvedCount: 1 });
  });

  it('điểm mỗi bài là điểm CAO NHẤT, không phải lần nộp cuối', async () => {
    const svc = build({ subs: [sub('A', 'p1', 100, 10), sub('A', 'p1', 20, 50)] });
    const [a] = (await svc.computeLeaderboard(contest._id)).rows;
    expect(a.totalScore).toBe(100);
    expect(a.timeMinutes).toBe(10);
  });

  it('tổng thời gian = tổng thời gian các bài đã đạt điểm tối đa', async () => {
    const svc = build({
      subs: [sub('A', 'p1', 100, 10), sub('A', 'p2', 0, 15), sub('A', 'p2', 100, 40)],
    });
    const [a] = (await svc.computeLeaderboard(contest._id)).rows;
    expect(a).toMatchObject({ timeMinutes: 50, penaltyMinutes: 20, totalScore: 200, solvedCount: 2 });
  });

  it('xếp theo tổng điểm giảm dần; bằng điểm thì tổng thời gian (kể cả phạt) thấp hơn đứng trên', async () => {
    const svc = build({
      subs: [
        sub('slowclean', 'p1', 100, 50), // 50
        sub('fastpenalised', 'p1', 0, 5), sub('fastpenalised', 'p1', 100, 20), // 20 + 20 = 40
        sub('top', 'p1', 100, 90), sub('top', 'p2', 100, 95), // 2 bài, điểm cao nhất
      ],
    });
    const rows = (await svc.computeLeaderboard(contest._id)).rows;
    expect(rows.map((r) => r.studentId)).toEqual(['top', 'fastpenalised', 'slowclean']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('thời gian tính từ giờ vào thi riêng của thí sinh (nếu có), không phải giờ mở cuộc thi', async () => {
    const svc = build({
      subs: [sub('late', 'p1', 100, 70)],
      attempts: [{ studentId: 'late', startedAt: min(60) }],
    });
    const [r] = (await svc.computeLeaderboard(contest._id)).rows;
    expect(r.timeMinutes).toBe(10);
  });

  it('bài nộp muộn (isLate) không được tính điểm nhưng không làm hỏng bảng', async () => {
    const svc = build({ subs: [sub('A', 'p1', 100, 10), sub('B', 'p1', 100, 200, { isLate: true })] });
    const rows = (await svc.computeLeaderboard(contest._id)).rows;
    expect(rows.map((r) => r.studentId)).toEqual(['A']);
  });

  it('mặc định đóng băng 60 phút cuối: bài nộp sau thời điểm đóng băng không làm BXH công khai nhảy; giảng viên thấy thật', async () => {
    expect(DEFAULT_FREEZE_MINUTES).toBe(60);
    jest.setSystemTime(min(150)); // đang trong 60 phút cuối (từ phút 120)
    const svc = build({ subs: [sub('A', 'p1', 100, 100), sub('B', 'p1', 100, 140)] });
    const pub = await svc.computeLeaderboard(contest._id);
    expect(pub.isFrozen).toBe(true);
    expect(pub.rows.map((r) => r.studentId)).toEqual(['A']);
    const staff = await svc.computeLeaderboard(contest._id, { asTeacher: true });
    expect(staff.isFrozen).toBe(false);
    expect(staff.rows.map((r) => r.studentId)).toEqual(['A', 'B']);
  });

  it('trước giờ đóng băng thì chưa đóng băng, sau khi kết thúc tự rã băng', async () => {
    const svc = build({ subs: [sub('A', 'p1', 100, 100), sub('B', 'p1', 100, 140)] });
    jest.setSystemTime(min(110));
    expect((await svc.computeLeaderboard(contest._id)).isFrozen).toBe(false);
    jest.setSystemTime(new Date(END.getTime() + 60_000));
    const done = await svc.computeLeaderboard(contest._id);
    expect(done.isFrozen).toBe(false);
    expect(done.computedStatus).toBe('ENDED');
    expect(done.rows.map((r) => r.studentId)).toEqual(['A', 'B']);
  });

  describe('tên hiển thị', () => {
    it('cleanDisplayName bỏ ObjectId nối vào tên', () => {
      expect(cleanDisplayName('6HOC SINH LOP 10 (6ad07c49e753d22e5ad2483d)')).toBe('6HOC SINH LOP 10');
      expect(cleanDisplayName('An  Nguyễn 6ad07c49e753d22e5ad2483d')).toBe('An Nguyễn');
      expect(cleanDisplayName('Lê Văn Bình')).toBe('Lê Văn Bình');
      expect(cleanDisplayName(undefined)).toBe('');
    });

    it('lấy họ tên MỚI NHẤT từ User (đổi tên là BXH đổi theo), bỏ qua bản chụp cũ lúc nộp bài', async () => {
      const id = '6ad07c49e753d22e5ad2483d';
      const svc = build({
        subs: [sub(id, 'p1', 100, 10, { studentName: `Tên Cũ (${id})` })],
        users: [{ _id: id, fullName: 'Tên Mới' }],
      });
      const [r] = (await svc.computeLeaderboard(contest._id)).rows;
      expect(r.studentName).toBe('Tên Mới');
    });

    it('không tìm được User thì dùng bản chụp đã làm sạch, rỗng thì "Học viên"', async () => {
      const id = '6ad07c49e753d22e5ad2483d';
      const svc = build({
        subs: [sub(id, 'p1', 100, 10, { studentName: `An (${id})` }), sub('X', 'p1', 100, 11, { studentName: '' })],
      });
      const names = Object.fromEntries((await svc.computeLeaderboard(contest._id)).rows.map((r) => [r.studentId, r.studentName]));
      expect(names[id]).toBe('An');
      expect(names.X).toBe('Học viên');
    });
  });
});
