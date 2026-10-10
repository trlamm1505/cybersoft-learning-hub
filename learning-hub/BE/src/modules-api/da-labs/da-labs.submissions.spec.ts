import { DaLabsService } from './da-labs.service';

const lean = (value: unknown) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const SQL_LAB = {
  _id: 'ex-sql-1',
  slug: 'da-sql-01',
  type: 'SQL_LAB',
  points: 10,
  resource_id: 'ds-retail-ecommerce-sales-v1',
  solutionCode: 'SELECT 1',
};
const INSIGHT_LAB = {
  _id: 'ex-insight-1',
  slug: 'da-insight-01',
  type: 'DA_INSIGHT',
  points: 10,
  resource_id: 'ds-retail-ecommerce-sales-v1',
  solutionCode: 'SELECT 1',
  description: 'd',
  insightRubric: [],
};

describe('DaLabsService — lưu bài nộp SQL, chống spam bản ghi, danh sách cho giảng viên', () => {
  let exerciseModel: { findOne: jest.Mock; find: jest.Mock };
  let submissionModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let userModel: { find: jest.Mock };
  let sqlGrader: { grade: jest.Mock };
  let insightGrader: { grade: jest.Mock };
  let service: DaLabsService;

  beforeEach(() => {
    exerciseModel = { findOne: jest.fn(() => lean(SQL_LAB)), find: jest.fn() };
    submissionModel = {
      create: jest.fn(async (doc) => ({ _id: 'new-sub', ...doc })),
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
    };
    userModel = { find: jest.fn() };
    sqlGrader = {
      grade: jest
        .fn()
        .mockResolvedValue({
          status: 'ACCEPTED',
          score: 10,
          maxScore: 10,
          feedback: 'Đúng.',
        }),
    };
    insightGrader = { grade: jest.fn() };
    service = new DaLabsService(
      exerciseModel as any,
      {} as any,
      sqlGrader as any,
      insightGrader as any,
      submissionModel as any,
      userModel as any,
    );
  });

  describe('[M5] bài SQL được lưu với type SQL', () => {
    it('lần đầu: tạo bản ghi GRADED kèm câu SQL, điểm, điểm cao nhất', async () => {
      await service.submitSql('da-sql-01', 'SELECT 1', 'u1');

      expect(submissionModel.findOne).toHaveBeenCalledWith({
        userId: 'u1',
        exerciseId: 'ex-sql-1',
        type: 'SQL',
      });
      expect(submissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          type: 'SQL',
          status: 'GRADED',
          content: 'SELECT 1',
          score: 10,
          bestScore: 10,
          attemptCount: 1,
        }),
      );
    });

    it('[L6] lần sau: cập nhật đúng bản ghi cũ, tăng số lần, giữ điểm cao nhất', async () => {
      const existing: any = {
        attemptCount: 2,
        bestScore: 10,
        save: jest.fn().mockResolvedValue(undefined),
      };
      submissionModel.findOne.mockResolvedValue(existing);
      sqlGrader.grade.mockResolvedValue({
        status: 'WRONG_ANSWER',
        score: 0,
        maxScore: 10,
        feedback: 'Sai.',
      });

      await service.submitSql('da-sql-01', 'SELECT 2', 'u1');

      expect(submissionModel.create).not.toHaveBeenCalled();
      expect(existing).toMatchObject({
        attemptCount: 3,
        bestScore: 10,
        score: 0,
        content: 'SELECT 2',
      });
      expect(existing.save).toHaveBeenCalled();
    });

    it('câu bị lớp chặn từ chối (REJECTED) không được lưu', async () => {
      sqlGrader.grade.mockResolvedValue({
        status: 'REJECTED',
        score: 0,
        maxScore: 10,
        feedback: 'Bị chặn.',
      });

      await service.submitSql('da-sql-01', 'DROP TABLE x', 'u1');

      expect(submissionModel.findOne).not.toHaveBeenCalled();
      expect(submissionModel.create).not.toHaveBeenCalled();
    });
  });

  it('[L6] Insight: bài cũ đang chờ giảng viên chấm thì bị ghi đè, không tạo bản ghi mới', async () => {
    exerciseModel.findOne.mockReturnValue(lean(INSIGHT_LAB));
    insightGrader.grade.mockResolvedValue({
      status: 'PENDING_REVIEW',
      score: 0,
      maxScore: 10,
      feedback: 'Chờ giảng viên.',
      criteria: [],
    });
    const pending: any = { _id: 'pending-1', attemptCount: 1, save: jest.fn() };
    pending.save.mockResolvedValue(pending);
    submissionModel.findOne.mockResolvedValue(pending);

    const res = await service.submitInsight(
      'da-insight-01',
      'Nhận định mới',
      'u1',
    );

    expect(submissionModel.findOne).toHaveBeenCalledWith({
      userId: 'u1',
      exerciseId: 'ex-insight-1',
      type: { $ne: 'SQL' },
      status: 'PENDING_REVIEW',
    });
    expect(submissionModel.create).not.toHaveBeenCalled();
    expect(pending).toMatchObject({
      content: 'Nhận định mới',
      attemptCount: 2,
    });
    expect(res.submissionId).toBe('pending-1');
  });

  it('[M5] giảng viên lọc bài theo loại, kèm thông tin học viên và bài', async () => {
    const docs = [
      {
        _id: 's1',
        type: 'SQL',
        userId: 'u1',
        exerciseId: 'ex-sql-1',
        status: 'GRADED',
        score: 10,
        maxScore: 10,
        content: 'SELECT 1',
      },
    ];
    submissionModel.find.mockReturnValue(lean(docs));
    userModel.find.mockReturnValue(
      lean([{ _id: 'u1', fullName: 'An', email: 'an@x.vn' }]),
    );
    exerciseModel.find.mockReturnValue(
      lean([{ _id: 'ex-sql-1', slug: 'da-sql-01', title: 'Đơn hàng' }]),
    );

    const rows = await service.listLabSubmissions('SQL');

    expect(submissionModel.find).toHaveBeenCalledWith({ type: 'SQL' });
    expect(rows[0]).toMatchObject({
      type: 'SQL',
      attemptCount: 1,
      bestScore: 10,
      student: { fullName: 'An' },
      exercise: { title: 'Đơn hàng' },
    });

    submissionModel.find.mockReturnValue(lean([]));
    await service.listLabSubmissions('INSIGHT');
    expect(submissionModel.find).toHaveBeenLastCalledWith({
      type: { $ne: 'SQL' },
    });
  });
});
