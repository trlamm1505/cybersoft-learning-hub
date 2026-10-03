import { ServiceUnavailableException } from '@nestjs/common';
import { DaLabsService } from './da-labs.service';
import type { InsightGradeResult } from './insight-grader.service';

const LAB = {
  _id: 'ex-insight-1',
  slug: 'da-insight-01',
  type: 'DA_INSIGHT',
  topic: 'da-lab-pack',
  description: 'Phân khúc nào đóng góp doanh thu lớn nhất?',
  resource_id: 'ds-retail-ecommerce-sales-v1',
  solutionCode: 'SELECT 1',
  points: 10,
  insightRubric: [{ id: 'accuracy', title: 'Đúng dữ liệu', maxPoints: 10, description: '' }],
};
const ANSWER = 'Phân khúc VIP đóng góp 78,98% doanh thu các đơn hoàn tất, nên ưu tiên giữ chân nhóm này.';

const lean = (value: unknown) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

describe('DaLabsService — lưu bài nộp Insight và hàng chờ giảng viên', () => {
  let exerciseModel: { findOne: jest.Mock; find: jest.Mock };
  let submissionModel: { create: jest.Mock; find: jest.Mock; findOne: jest.Mock };
  let userModel: { find: jest.Mock };
  let insightGrader: { grade: jest.Mock };
  let service: DaLabsService;

  beforeEach(() => {
    exerciseModel = { findOne: jest.fn(() => lean(LAB)), find: jest.fn() };
    submissionModel = {
      create: jest.fn(async (doc) => ({ _id: 'sub-1', ...doc })),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    userModel = { find: jest.fn() };
    insightGrader = { grade: jest.fn() };
    service = new DaLabsService(
      exerciseModel as any,
      {} as any,
      {} as any,
      insightGrader as any,
      submissionModel as any,
      userModel as any,
    );
  });

  const graderReturns = (r: Partial<InsightGradeResult>) =>
    insightGrader.grade.mockResolvedValue({
      score: 0,
      maxScore: 10,
      feedback: '',
      criteria: [],
      ...r,
    });

  it('AI chấm được: lưu GRADED kèm điểm, aiExplanation, tiêu chí và nội dung bài', async () => {
    graderReturns({
      status: 'GRADED',
      score: 9,
      feedback: 'Lập luận khớp dữ liệu.',
      criteria: [{ id: 'accuracy', title: 'Đúng dữ liệu', score: 9, maxPoints: 10, evidence: 'x', reasoning: 'y' }],
    });

    const res = await service.submitInsight('da-insight-01', ANSWER, 'u1');

    expect(submissionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        exerciseId: 'ex-insight-1',
        content: ANSWER,
        status: 'GRADED',
        score: 9,
        maxScore: 10,
        aiExplanation: 'Lập luận khớp dữ liệu.',
      }),
    );
    expect(res).toMatchObject({ status: 'GRADED', score: 9, submissionId: 'sub-1' });
  });

  it.each([
    ['guardrail từ chối (nhồi từ khóa)', 'REJECTED', 'Câu trả lời giống danh sách từ khóa.'],
    ['chưa có model / AI trả sai cấu trúc', 'PENDING_REVIEW', 'Chưa chấm tự động được.'],
  ] as const)('%s: lưu PENDING_REVIEW, điểm 0', async (_name, status, feedback) => {
    graderReturns({ status, feedback });

    const res = await service.submitInsight('da-insight-01', ANSWER, 'u1');

    expect(submissionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING_REVIEW', score: 0, content: ANSWER }),
    );
    expect(res.status).toBe('PENDING_REVIEW');
    expect(res.feedback).toContain('giảng viên');
  });

  it('lỗi hệ thống khi chấm (sandbox mất kết nối): vẫn lưu PENDING_REVIEW, không ném lỗi ra UI', async () => {
    insightGrader.grade.mockRejectedValue(new ServiceUnavailableException('sandbox down'));

    const res = await service.submitInsight('da-insight-01', ANSWER, 'u1');

    expect(submissionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PENDING_REVIEW', userId: 'u1', content: ANSWER }),
    );
    expect(res).toMatchObject({ status: 'PENDING_REVIEW', submissionId: 'sub-1' });
  });

  it('hàng chờ giảng viên: chỉ PENDING_REVIEW, gắn thông tin học viên và bài tập', async () => {
    submissionModel.find.mockReturnValue(
      lean([
        {
          _id: 'sub-1',
          userId: 'u1',
          exerciseId: 'ex-insight-1',
          exerciseSlug: 'da-insight-01',
          content: ANSWER,
          status: 'PENDING_REVIEW',
          maxScore: 10,
          aiExplanation: 'Chưa chấm tự động được.',
          criteria: [],
          createdAt: new Date('2026-10-03T00:00:00Z'),
        },
      ]),
    );
    userModel.find.mockReturnValue(lean([{ _id: 'u1', fullName: 'Bé Bo', email: 'student@gmail.com' }]));
    exerciseModel.find.mockReturnValue(lean([LAB]));

    const list = await service.listPendingReviews();

    expect(submissionModel.find).toHaveBeenCalledWith({ status: 'PENDING_REVIEW' });
    expect(list).toEqual([
      expect.objectContaining({
        id: 'sub-1',
        content: ANSWER,
        student: { id: 'u1', fullName: 'Bé Bo', email: 'student@gmail.com' },
        exercise: expect.objectContaining({ slug: 'da-insight-01', points: 10 }),
      }),
    ]);
    // Chỉ lấy tên và email, không kéo password hash của học viên.
    expect(userModel.find.mock.results[0].value.select).toHaveBeenCalledWith('fullName email');
  });
  describe('getMySubmission — học viên xem bài nộp của chính mình', () => {
    it('lọc theo userId từ JWT và exerciseId, lấy bản mới nhất, không trả reviewedBy', async () => {
      const chain = lean({
        _id: 'sub-9',
        exerciseId: 'ex-insight-1',
        content: ANSWER,
        status: 'GRADED',
        score: 7,
        maxScore: 10,
        aiExplanation: 'Câu trả lời cần ít nhất 40 từ.',
        teacherComment: 'Cần thêm số liệu.',
        reviewedAt: new Date('2026-10-03T06:19:13Z'),
        createdAt: new Date('2026-10-03T06:00:00Z'),
      });
      submissionModel.findOne.mockReturnValue(chain);

      const res = await service.getMySubmission('ex-insight-1', 'u1');

      expect(submissionModel.findOne).toHaveBeenCalledWith({ exerciseId: 'ex-insight-1', userId: 'u1' });
      expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(chain.select.mock.calls[0][0]).not.toContain('reviewedBy');
      expect(res).toMatchObject({
        id: 'sub-9',
        status: 'GRADED',
        score: 7,
        teacherComment: 'Cần thêm số liệu.',
        content: ANSWER,
      });
    });

    it('chưa từng nộp thì trả null', async () => {
      submissionModel.findOne.mockReturnValue(lean(null));

      await expect(service.getMySubmission('ex-insight-1', 'u1')).resolves.toBeNull();
    });
  });
});
