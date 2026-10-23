import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ContestService } from './contest.service';
import { Contest } from '../../modules-system/database/schemas/contest.schema';
import { User } from '../../modules-system/database/schemas/user.schema';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { Question } from '../../modules-system/database/schemas/question.schema';
import { ContestSubmission } from '../../modules-system/database/schemas/contest-submission.schema';
import { ContestAttempt } from '../../modules-system/database/schemas/contest-attempt.schema';

const OID = '507f1f77bcf86cd799439011';
const lean = (value: unknown) => ({ lean: jest.fn().mockResolvedValue(value) });

describe('ContestService', () => {
  let service: ContestService;
  let mockContestModel: any;
  let mockUserModel: any;
  let mockLessonModel: any;
  let mockExerciseModel: any;
  let mockQuestionModel: any;
  let mockSubmissionModel: any;
  let mockAttemptModel: any;

  const problem = {
    slug: 'p1',
    title: 'P1',
    type: 'coding',
    source: 'lesson',
    points: 10,
    order: 1,
  };

  const mockContestObj = {
    _id: OID,
    title: 'Test Contest',
    slug: 'test-contest',
    startTime: new Date(Date.now() - 10 * 60 * 1000), // 10m ago
    endTime: new Date(Date.now() + 50 * 60 * 1000), // in 50m
    durationMinutes: 60,
    registrations: [
      {
        studentId: 'student-1',
        studentName: 'Nguyen Van A',
        registeredAt: new Date(),
      },
    ],
    problems: [problem],
    status: 'published',
    toObject: function () {
      return { ...this };
    },
    save: jest.fn(),
  };

  const contestReturns = (doc: unknown) =>
    mockContestModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(doc),
    });

  const futureWindow = () => {
    const start = new Date(Date.now() + 3_600_000);
    return { startTime: start, endTime: new Date(start.getTime() + 3_600_000) };
  };

  beforeEach(async () => {
    mockContestModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, _id: OID }),
    }));
    mockContestModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockContestObj]),
      }),
    });
    mockContestModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockContestObj),
    });
    mockContestModel.findById = jest.fn().mockResolvedValue({
      ...mockContestObj,
      save: jest.fn().mockResolvedValue(mockContestObj),
    });
    mockContestModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockContestObj);
    mockContestModel.countDocuments = jest.fn().mockResolvedValue(1);

    mockUserModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(lean({ fullName: 'Nguyen Van A' })),
      }),
    };
    mockLessonModel = {
      findById: jest.fn().mockReturnValue(
        lean({
          _id: 'l1',
          title: 'Bài 1',
          slug: 'bai-1',
          type: 'coding',
          points: 10,
          testCases: [{ input: '1', expectedOutput: '1' }],
        }),
      ),
    };
    mockExerciseModel = { findOne: jest.fn().mockReturnValue(lean(null)) };
    mockQuestionModel = {
      find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue(lean([])) }),
    };
    mockSubmissionModel = { deleteMany: jest.fn().mockResolvedValue({}) };
    mockAttemptModel = {
      deleteMany: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue(lean([])) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestService,
        { provide: getModelToken(Contest.name), useValue: mockContestModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Lesson.name), useValue: mockLessonModel },
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
        { provide: getModelToken(Question.name), useValue: mockQuestionModel },
        { provide: getModelToken(ContestSubmission.name), useValue: mockSubmissionModel },
        { provide: getModelToken(ContestAttempt.name), useValue: mockAttemptModel },
      ],
    }).compile();

    service = module.get<ContestService>(ContestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createContest', () => {
    it('should throw BadRequestException if startTime >= endTime', async () => {
      const now = new Date();
      await expect(
        service.createContest(
          { title: 'Invalid Time Contest', startTime: new Date(now.getTime() + 600000), endTime: now },
          'teacher-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create contest successfully with valid times', async () => {
      contestReturns(null);
      const result = await service.createContest(
        { title: 'New Contest 2026', ...futureWindow(), status: 'draft' },
        'teacher-1',
      );
      expect(result.title).toBe('New Contest 2026');
    });

    it('chỉ nhận các trường cho phép: không cho client ghi đè registrations/authorId', async () => {
      contestReturns(null);
      await service.createContest(
        {
          title: 'Bảo mật',
          ...futureWindow(),
          status: 'draft',
          registrations: [{ studentId: 'x' }],
          authorId: 'someone-else',
        } as any,
        'teacher-real',
      );
      const saved = mockContestModel.mock.calls[0][0];
      expect(saved.authorId).toBe('teacher-real');
      expect(saved.registrations).toEqual([]);
    });

    it('cuộc thi công khai bắt buộc có ít nhất một đề; bản nháp thì không', async () => {
      contestReturns(null);
      await expect(
        service.createContest({ title: 'Trống', ...futureWindow(), status: 'published' }, 't'),
      ).rejects.toThrow('ít nhất một đề');
      await expect(
        service.createContest({ title: 'Nháp trống', ...futureWindow(), status: 'draft' }, 't'),
      ).resolves.toBeDefined();
    });

    it('thời lượng cá nhân không bao giờ dài hơn khung giờ thi', async () => {
      contestReturns(null);
      await service.createContest(
        { title: 'Dài quá', ...futureWindow(), durationMinutes: 999, status: 'draft' },
        't',
      );
      expect(mockContestModel.mock.calls[0][0].durationMinutes).toBe(60);
    });
  });

  describe('normalizeProblems — phối hợp trắc nghiệm + Code Playground', () => {
    it('nhận bài Code Playground (exercise), lấy điểm mặc định từ bài', async () => {
      mockExerciseModel.findOne.mockReturnValue(
        lean({ slug: 'tong', title: 'Tổng', type: 'CODE_TEXT', points: 25, testCases: [{ input: '1', expectedOutput: '1' }] }),
      );
      const out = await service.normalizeProblems([{ source: 'exercise', exerciseSlug: 'tong', title: '' }], true);
      expect(out).toEqual([
        expect.objectContaining({ source: 'exercise', exerciseSlug: 'tong', type: 'coding', points: 25, slug: 'tong', order: 1 }),
      ]);
    });

    it('từ chối bài SQL/DA khỏi cuộc thi code', async () => {
      mockExerciseModel.findOne.mockReturnValue(lean({ slug: 'sql', title: 'SQL', type: 'SQL_LAB', testCases: [] }));
      await expect(
        service.normalizeProblems([{ source: 'exercise', exerciseSlug: 'sql', title: '' }], true),
      ).rejects.toThrow('không phải bài code Python');
    });

    it('xuất bản yêu cầu bài code có test case', async () => {
      mockExerciseModel.findOne.mockReturnValue(lean({ slug: 'trong', title: 'Trống', type: 'CODE_TEXT', testCases: [] }));
      await expect(
        service.normalizeProblems([{ source: 'exercise', exerciseSlug: 'trong', title: '' }], true),
      ).rejects.toThrow('chưa có test case');
      await expect(
        service.normalizeProblems([{ source: 'exercise', exerciseSlug: 'trong', title: '' }], false),
      ).resolves.toHaveLength(1);
    });

    it('phần trắc nghiệm từ ngân hàng: gộp câu hỏi, điểm mặc định là tổng điểm câu', async () => {
      const a = '507f1f77bcf86cd799439021';
      const b = '507f1f77bcf86cd799439022';
      mockQuestionModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue(
          lean([
            { _id: a, points: 5, options: [{ key: 'A', isCorrect: true }] },
            { _id: b, points: 15, options: [{ key: 'B', isCorrect: true }] },
          ]),
        ),
      });
      const out = await service.normalizeProblems(
        [{ source: 'bank', title: 'Phần 1', questionIds: [a, b, a, 'khong-hop-le'] }],
        true,
      );
      expect(out[0]).toMatchObject({ source: 'bank', type: 'quiz', points: 20, questionIds: [a, b] });
      expect(out[0].slug).toBe('phan-1');
    });

    it('báo lỗi khi câu hỏi không còn trong ngân hàng hoặc chưa có đáp án đúng', async () => {
      const a = '507f1f77bcf86cd799439021';
      await expect(
        service.normalizeProblems([{ source: 'bank', title: 'X', questionIds: [a] }], true),
      ).rejects.toThrow('không còn trong ngân hàng');
      mockQuestionModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue(lean([{ _id: a, points: 5, options: [{ key: 'A', isCorrect: false }] }])),
      });
      await expect(
        service.normalizeProblems([{ source: 'bank', title: 'X', questionIds: [a] }], true),
      ).rejects.toThrow('chưa có đáp án đúng');
    });

    it('từ chối đề trùng, bài khối lệnh và bài đã soạn không tồn tại', async () => {
      mockLessonModel.findById.mockReturnValue(lean({ _id: 'l1', title: 'B', slug: 'b', type: 'coding', testCases: [{}] }));
      await expect(
        service.normalizeProblems(
          [
            { source: 'lesson', lessonId: '507f1f77bcf86cd799439031', title: '' },
            { source: 'lesson', lessonId: '507f1f77bcf86cd799439031', title: '' },
          ],
          true,
        ),
      ).rejects.toThrow('bị chọn trùng');

      mockLessonModel.findById.mockReturnValue(lean({ _id: 'l2', title: 'Block', slug: 'blk', type: 'block' }));
      await expect(
        service.normalizeProblems([{ source: 'lesson', lessonId: '507f1f77bcf86cd799439032', title: '' }], false),
      ).rejects.toThrow('khối lệnh');

      mockLessonModel.findById.mockReturnValue(lean(null));
      await expect(
        service.normalizeProblems([{ source: 'lesson', lessonId: '507f1f77bcf86cd799439033', title: 'Mất' }], false),
      ).rejects.toThrow('Không tìm thấy bài đã soạn');
    });

    it('điểm được kẹp trong khoảng cho phép', async () => {
      mockExerciseModel.findOne.mockReturnValue(lean({ slug: 'tong', title: 'Tổng', type: 'CODE_TEXT', testCases: [{}] }));
      const [p] = await service.normalizeProblems(
        [{ source: 'exercise', exerciseSlug: 'tong', title: '', points: 999_999 }],
        true,
      );
      expect(p.points).toBe(1000);
    });
  });

  describe('findAll / findOne — bản nháp và quyền riêng tư', () => {
    const teacher = { sub: 'teacher-a', role: 'TEACHER' };
    const student = { sub: 'student-1', role: 'STUDENT' };

    it('giảng viên thấy cả bản nháp (không lọc)', async () => {
      await service.findAll(teacher);
      expect(mockContestModel.find).toHaveBeenCalledWith({});
    });

    it('học viên và khách KHÔNG thấy bản nháp', async () => {
      await service.findAll(student);
      expect(mockContestModel.find).toHaveBeenLastCalledWith({ status: { $ne: 'draft' } });
      await service.findAll(undefined);
      expect(mockContestModel.find).toHaveBeenLastCalledWith({ status: { $ne: 'draft' } });
    });

    it('không lộ danh sách đăng ký (tên/ID học viên) cho người xem, chỉ trả cờ và số lượng', async () => {
      const [view]: any[] = await service.findAll(student);
      expect(view.registrations).toBeUndefined();
      expect(view.isRegistered).toBe(true);
      expect(view.registrationsCount).toBe(1);
      expect(JSON.stringify(view)).not.toContain('Nguyen Van A');

      const [guest]: any[] = await service.findAll(undefined);
      expect(guest.isRegistered).toBe(false);
    });

    it('trả trạng thái lượt thi của chính học viên (máy chủ giữ), giảng viên không cần', async () => {
      mockAttemptModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue(lean([{ contestId: OID, finishedAt: new Date() }])),
      });
      const [mine]: any[] = await service.findAll(student);
      expect(mine.myAttemptStatus).toBe('FINISHED');
      expect(mockAttemptModel.find).toHaveBeenCalledWith({ studentId: 'student-1', contestId: { $in: [OID] } });

      mockAttemptModel.find.mockClear();
      const [staffView]: any[] = await service.findAll(teacher);
      expect(staffView.myAttemptStatus).toBe('NOT_STARTED');
      expect(mockAttemptModel.find).not.toHaveBeenCalled();
    });

    it('học viên không thấy cấu hình nội bộ của đề (questionIds/exerciseSlug)', async () => {
      contestReturns({
        ...mockContestObj,
        problems: [{ ...problem, source: 'bank', questionIds: ['q1'], exerciseSlug: 'x' }],
      });
      const view: any = await service.findOne(OID, student);
      expect(view.problems[0].questionIds).toBeUndefined();
      expect(view.problems[0].exerciseSlug).toBeUndefined();
      const staffView: any = await service.findOne(OID, teacher);
      expect(staffView.problems[0].questionIds).toEqual(['q1']);
    });

    it('bản nháp trả 404 cho học viên/khách nhưng giảng viên mở được', async () => {
      contestReturns({ ...mockContestObj, status: 'draft' });
      await expect(service.findOne(OID, student)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(OID, undefined)).rejects.toThrow(NotFoundException);
      await expect(service.checkContestStatus(OID, student)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(OID, teacher)).resolves.toBeDefined();
    });
  });

  describe('registerContest', () => {
    it('should register a new student to ongoing contest', async () => {
      contestReturns({
        ...mockContestObj,
        registrations: [],
        save: jest.fn().mockResolvedValue(mockContestObj),
      });
      const result = await service.registerContest(OID, 'student-new');
      expect(result.success).toBe(true);
      expect(result.message).toContain('thành công');
    });

    it('should throw BadRequestException if contest has already ended', async () => {
      contestReturns({ ...mockContestObj, endTime: new Date(Date.now() - 10000) });
      await expect(service.registerContest(OID, 'student-late')).rejects.toThrow(BadRequestException);
    });

    it('không đăng ký được vào bản nháp', async () => {
      contestReturns({ ...mockContestObj, status: 'draft', registrations: [] });
      await expect(service.registerContest(OID, 'student-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkContestStatus', () => {
    it('should return server time guard response with ONGOING status', async () => {
      const statusRes = await service.checkContestStatus(OID, 'student-1');
      expect(statusRes.computedStatus).toBe('ONGOING');
      expect(statusRes.isAllowedToJoin).toBe(true);
      expect(statusRes.isAllowedToSubmit).toBe(true);
      expect(statusRes.serverTime).toBeDefined();
      expect(statusRes.integrityEnabled).toBe(true);
    });

    it('báo cuộc thi có bật giám sát liêm chính để hiện thông báo trước khi vào thi', async () => {
      contestReturns({ ...mockContestObj, integrityEnabled: false });
      const off = await service.checkContestStatus(OID, 'student-1');
      expect(off.integrityEnabled).toBe(false);
    });

    it('should return UPCOMING status and disallow joining if contest has not started', async () => {
      contestReturns({
        ...mockContestObj,
        startTime: new Date(Date.now() + 3600000),
        endTime: new Date(Date.now() + 7200000),
      });
      const statusRes = await service.checkContestStatus(OID);
      expect(statusRes.computedStatus).toBe('UPCOMING');
      expect(statusRes.isAllowedToJoin).toBe(false);
      expect(statusRes.isAllowedToSubmit).toBe(false);
      expect(statusRes.message).toContain('chưa bắt đầu');
    });
  });

  describe('updateContest — không ghi đè tuỳ ý, không phá dữ liệu', () => {
    const teacher = { sub: 'teacher-1', role: 'TEACHER' };

    function editable(extra: Record<string, unknown> = {}) {
      const doc: any = {
        ...mockContestObj,
        authorId: 'teacher-1',
        durationMinutes: 30,
        save: jest.fn().mockImplementation(async function (this: any) {
          return doc;
        }),
        ...extra,
      };
      mockContestModel.findById = jest.fn().mockResolvedValue(doc);
      return doc;
    }

    it('sửa tiêu đề không làm mất thời lượng cá nhân đã đặt (trước đây bị đặt lại thành cả khung giờ)', async () => {
      const doc = editable();
      await service.updateContest(OID, { title: 'Tên mới' }, teacher);
      expect(doc.title).toBe('Tên mới');
      expect(doc.durationMinutes).toBe(30);
    });

    it('bỏ qua trường lạ trong body: không ghi đè registrations/authorId', async () => {
      const doc = editable();
      await service.updateContest(
        OID,
        { title: 'Ok', registrations: [], authorId: 'hacker' } as any,
        teacher,
      );
      expect(doc.registrations).toHaveLength(1);
      expect(doc.authorId).toBe('teacher-1');
    });

    it('cuộc thi đã bắt đầu: không đổi giờ bắt đầu và không đổi danh sách đề/điểm', async () => {
      editable();
      await expect(
        service.updateContest(OID, { startTime: new Date(Date.now() - 3_600_000) }, teacher),
      ).rejects.toThrow('không thể đổi giờ bắt đầu');

      mockLessonModel.findById.mockReturnValue(
        lean({ _id: 'l9', title: 'Khác', slug: 'khac', type: 'coding', testCases: [{}] }),
      );
      await expect(
        service.updateContest(OID, { problems: [{ source: 'lesson', lessonId: '507f1f77bcf86cd799439099', title: '' }] }, teacher),
      ).rejects.toThrow('không thể thay đổi danh sách đề');
    });

    it('cuộc thi đã bắt đầu vẫn cho gia hạn giờ kết thúc', async () => {
      const doc = editable();
      const newEnd = new Date(Date.now() + 2 * 3_600_000);
      await service.updateContest(OID, { endTime: newEnd }, teacher);
      expect(doc.endTime).toEqual(newEnd);
    });

    it('xuất bản bản nháp có đề cũ thiếu nguồn thì báo rõ để chọn lại', async () => {
      editable({ status: 'draft', problems: [{ slug: 'cu', title: 'Đề cũ', type: 'coding', points: 10 }] });
      await expect(
        service.updateContest(OID, { status: 'published' }, teacher),
      ).rejects.toThrow('Không tìm thấy bài đã soạn');
    });
  });

  describe('IDOR — ownership check (assertCanModify via updateContest/deleteContest)', () => {
    const teacherA = { sub: 'teacher-a', role: 'TEACHER' };
    const teacherB = { sub: 'teacher-b', role: 'TEACHER' };
    const admin = { sub: 'admin-1', role: 'ADMIN' };

    function ownedContest(authorId?: string) {
      return {
        ...mockContestObj,
        authorId,
        save: jest.fn().mockResolvedValue({ ...mockContestObj, authorId }),
      };
    }

    it('KHÔNG cho Teacher B sửa contest do Teacher A tạo', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));
      await expect(
        service.updateContest(OID, { title: 'Hacked' } as any, teacherB),
      ).rejects.toThrow(ForbiddenException);
    });

    it('cho phép chính Teacher A (chủ sở hữu) sửa contest của mình', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));
      await expect(
        service.updateContest(OID, { title: 'Sua boi chinh chu' } as any, teacherA),
      ).resolves.toBeDefined();
    });

    it('ADMIN sửa được contest của bất kỳ giáo viên nào', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));
      await expect(
        service.updateContest(OID, { title: 'Admin sua' } as any, admin),
      ).resolves.toBeDefined();
    });

    it('contest seed với authorId "teacher-1" được coi là dùng chung, Teacher B vẫn sửa được', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-1'));
      await expect(
        service.updateContest(OID, { title: 'Sua contest seed' } as any, teacherB),
      ).resolves.toBeDefined();
    });

    it('KHÔNG cho Teacher B xoá contest của Teacher A', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));
      await expect(service.deleteContest(OID, teacherB)).rejects.toThrow(ForbiddenException);
      expect(mockSubmissionModel.deleteMany).not.toHaveBeenCalled();
    });

    it('cho phép Teacher A xoá contest của chính mình và dọn bài nộp + lượt thi mồ côi', async () => {
      mockContestModel.findById = jest.fn().mockResolvedValue(ownedContest('teacher-a'));
      const result = await service.deleteContest(OID, teacherA);
      expect(result.success).toBe(true);
      expect(mockSubmissionModel.deleteMany).toHaveBeenCalledWith({ contestId: OID });
      expect(mockAttemptModel.deleteMany).toHaveBeenCalledWith({ contestId: OID });
    });
  });
});
