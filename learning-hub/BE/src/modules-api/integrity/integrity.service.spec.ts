import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { JudgeController } from '../judge/judge.controller';
import { IntegrityController } from './integrity.controller';
import { IntegrityService } from './integrity.service';

const OID_A = '64b000000000000000000001';
const OID_B = '64b000000000000000000002';

const chain = (value: unknown) => {
  const c: any = {};
  for (const m of ['select', 'sort', 'limit']) c[m] = jest.fn(() => c);
  c.lean = jest.fn().mockResolvedValue(value);
  return c;
};

const CODE_A = `
total = 0
for i in range(10):
    total += i * 2
print(total)
values = [x for x in range(30)]
print(sum(values))
`;

describe('IntegrityService', () => {
  let submissionModel: any;
  let exerciseModel: any;
  let userModel: any;
  let service: IntegrityService;

  beforeEach(() => {
    submissionModel = {
      find: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
    };
    exerciseModel = { find: jest.fn(() => chain([])) };
    userModel = { find: jest.fn(() => chain([])) };
    service = new IntegrityService(submissionModel, exerciseModel, userModel);
  });

  describe('evaluate', () => {
    it('so khớp với bài của học viên khác và gắn cờ khi giống hệt', async () => {
      submissionModel.find.mockReturnValue(
        chain([{ _id: OID_B, userId: 'u2', code: CODE_A }]),
      );
      const s = await service.evaluate({ _id: 'ex1' }, 'u1', CODE_A, undefined);
      expect(submissionModel.find).toHaveBeenCalledWith({
        exerciseId: 'ex1',
        userId: { $ne: 'u1' },
      });
      expect(s.similarity.flagged).toBe(true);
      expect(s.flag).toBe('REVIEW');
      expect(s.similarity.matchedSubmissionId).toBe(OID_B);
    });

    it('lỗi khi so khớp không làm hỏng việc nộp: trả tín hiệu bình thường', async () => {
      submissionModel.find.mockImplementation(() => {
        throw new Error('db down');
      });
      const s = await service.evaluate({ _id: 'ex1' }, 'u1', CODE_A, undefined);
      expect(s.flag).toBe('NONE');
      expect(s.reviewStatus).toBe('NORMAL');
    });
  });

  describe('listQueue', () => {
    it('mặc định chỉ lấy bài NEEDS_REVIEW, kèm tên học viên và bài tập', async () => {
      submissionModel.find.mockReturnValue(
        chain([
          {
            _id: OID_A,
            userId: 'u1',
            exerciseId: 'ex1',
            status: 'AC',
            integrity: { flag: 'REVIEW', reviewStatus: 'NEEDS_REVIEW' },
            createdAt: new Date(),
          },
        ]),
      );
      userModel.find.mockReturnValue(
        chain([{ _id: 'u1', fullName: 'An', email: 'an@x.vn' }]),
      );
      exerciseModel.find.mockReturnValue(
        chain([{ _id: 'ex1', slug: 'tong', title: 'Tổng' }]),
      );
      const rows = await service.listQueue();
      expect(submissionModel.find).toHaveBeenCalledWith({
        'integrity.reviewStatus': 'NEEDS_REVIEW',
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].student.fullName).toBe('An');
      expect(rows[0].exercise.title).toBe('Tổng');
      expect(rows[0].judgeStatus).toBe('AC');
    });

    it('giá trị status lạ bị đưa về NEEDS_REVIEW (không cho truy vấn tùy ý)', async () => {
      submissionModel.find.mockReturnValue(chain([]));
      await service.listQueue('$ne');
      expect(submissionModel.find).toHaveBeenCalledWith({
        'integrity.reviewStatus': 'NEEDS_REVIEW',
      });
    });
  });

  describe('review — giảng viên là người quyết định', () => {
    beforeEach(() => {
      submissionModel.findById.mockReturnValue(
        chain({
          _id: OID_A,
          userId: 'u1',
          status: 'AC',
          integrity: { reviewStatus: 'NEEDS_REVIEW' },
        }),
      );
    });

    it('ghi nhận người duyệt, kết luận, lý do; chỉ đụng tới trường integrity.*', async () => {
      const res = await service.review(
        OID_A,
        { decision: 'CLEARED', note: '  Cùng khung bài giảng, hợp lệ.  ' },
        'teacher-1',
      );
      expect(res).toMatchObject({
        reviewStatus: 'REVIEWED',
        decision: 'CLEARED',
        reviewedBy: 'teacher-1',
      });
      const [, update] = submissionModel.updateOne.mock.calls[0];
      expect(update.$set['integrity.reviewNote']).toBe(
        'Cùng khung bài giảng, hợp lệ.',
      );
      expect(update.$set['integrity.reviewedBy']).toBe('teacher-1');
      for (const key of Object.keys(update.$set)) {
        expect(key.startsWith('integrity.')).toBe(true);
      }
    });

    it('từ chối kết luận không hợp lệ hoặc thiếu lý do', async () => {
      await expect(
        service.review(OID_A, { decision: 'GUILTY', note: 'x' }, 't'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.review(OID_A, { decision: 'CONCERN', note: '   ' }, 't'),
      ).rejects.toThrow(BadRequestException);
      expect(submissionModel.updateOne).not.toHaveBeenCalled();
    });

    it('id không hợp lệ, không tồn tại, hoặc bài không có tín hiệu → 404', async () => {
      await expect(
        service.review('abc', { decision: 'CLEARED', note: 'x' }, 't'),
      ).rejects.toThrow(NotFoundException);
      submissionModel.findById.mockReturnValue(chain(null));
      await expect(
        service.review(OID_A, { decision: 'CLEARED', note: 'x' }, 't'),
      ).rejects.toThrow(NotFoundException);
      submissionModel.findById.mockReturnValue(
        chain({ _id: OID_A, userId: 'u1' }),
      );
      await expect(
        service.review(OID_A, { decision: 'CLEARED', note: 'x' }, 't'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDetail', () => {
    it('trả mã của bài và bài bị so khớp để giảng viên đối chiếu', async () => {
      submissionModel.findById
        .mockReturnValueOnce(
          chain({
            _id: OID_A,
            userId: 'u1',
            exerciseId: 'ex1',
            code: CODE_A,
            integrity: { similarity: { matchedSubmissionId: OID_B } },
          }),
        )
        .mockReturnValueOnce(
          chain({ _id: OID_B, userId: 'u2', code: 'other' }),
        );
      userModel.find.mockReturnValue(
        chain([{ _id: 'u2', fullName: 'Bình', email: 'b@x.vn' }]),
      );
      const d = await service.getDetail(OID_A);
      expect(d.code).toBe(CODE_A);
      expect(d.match).toMatchObject({ code: 'other', submissionId: OID_B });
      expect(d.match.student.fullName).toBe('Bình');
    });
  });
});

describe('Phân quyền & quyền riêng tư', () => {
  it('toàn bộ API hàng chờ chỉ dành cho TEACHER/ADMIN (học viên bị RolesGuard chặn)', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, IntegrityController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, IntegrityController)).toEqual([
      'TEACHER',
      'ADMIN',
    ]);
  });

  it('học viên đọc bài của chính mình qua API judge KHÔNG nhận được trường integrity', async () => {
    const select = jest.fn((_fields: string) =>
      chain({ userId: 'u1', code: 'x' }),
    );
    const model: any = { findById: jest.fn(() => ({ select })) };
    const controller = new JudgeController(model);
    await controller.findById(OID_A, { sub: 'u1', role: 'STUDENT' } as any);
    expect(select.mock.calls[0][0]).not.toMatch(/integrity/);
  });

  it('học viên không xem được bài của học viên khác', async () => {
    const model: any = {
      findById: jest.fn(() => ({
        select: () => chain({ userId: 'u2', code: 'x' }),
      })),
    };
    const controller = new JudgeController(model);
    await expect(
      controller.findById(OID_A, { sub: 'u1', role: 'STUDENT' } as any),
    ).rejects.toThrow('Bạn không có quyền xem bài nộp này');
  });
});
