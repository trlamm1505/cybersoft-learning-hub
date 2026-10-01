import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthoringService } from './authoring.service';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';

describe('AuthoringService', () => {
  let service: AuthoringService;
  let mockLessonModel: any;
  let mockExerciseModel: any;

  const mockLessonDoc = (data: any) => ({
    ...data,
    toObject: () => data,
    save: jest.fn().mockResolvedValue({ _id: 'mock-id-123', ...data }),
  });

  beforeEach(async () => {
    mockLessonModel = jest.fn().mockImplementation((dto) => mockLessonDoc(dto));
    mockLessonModel.findOne = jest.fn();
    mockLessonModel.findById = jest.fn();
    mockLessonModel.findByIdAndUpdate = jest.fn();
    mockLessonModel.find = jest.fn();

    // Đồng bộ sang exercises chỉ thật sự chạy khi lesson coding published
    // (syncPublishedCodingLessonToExerciseBank tự return sớm với draft) —
    // mặc định: không có exercise nào cùng slug từ trước (findOne -> null),
    // và findOneAndUpdate resolve thành công. Từng test case override lại
    // findOne khi cần mô phỏng "slug đã bị chiếm".
    mockExerciseModel = {
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      }),
      findOneAndUpdate: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthoringService,
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
        {
          provide: getModelToken(Exercise.name),
          useValue: mockExerciseModel,
        },
      ],
    }).compile();

    service = module.get<AuthoringService>(AuthoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validatePublicationEligibility', () => {
    it('should throw BadRequestException if learningOutcome is missing', () => {
      expect(() =>
        service.validatePublicationEligibility({
          title: 'Test Coding',
          type: 'coding',
          learningOutcome: '',
          testCases: [{ input: '1', expectedOutput: '2' }],
        } as any),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for coding lesson without testCases', () => {
      expect(() =>
        service.validatePublicationEligibility({
          title: 'Test Coding',
          type: 'coding',
          learningOutcome: 'Hiểu cấu trúc điều kiện',
          solutionCode: 'print(1)',
          testCases: [],
        } as any),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for quiz lesson without quizQuestions', () => {
      expect(() =>
        service.validatePublicationEligibility({
          title: 'Test Quiz',
          type: 'quiz',
          learningOutcome: 'Hiểu biến trong Python',
          quizQuestions: [],
        } as any),
      ).toThrow(BadRequestException);
    });

    it('should pass validation when coding lesson has learningOutcome, solutionCode and testCases', () => {
      expect(() =>
        service.validatePublicationEligibility({
          title: 'Valid Coding',
          type: 'coding',
          learningOutcome: 'Lập trình tính tổng hai số',
          solutionCode: 'print(sum(map(int, input().split())))',
          testCases: [{ input: '1 2', expectedOutput: '3' }],
        } as any),
      ).not.toThrow();
    });

    it('should throw BadRequestException for coding lesson without solutionCode', () => {
      expect(() =>
        service.validatePublicationEligibility({
          title: 'Missing Solution',
          type: 'coding',
          learningOutcome: 'Hiểu vòng lặp',
          testCases: [{ input: '1', expectedOutput: '1' }],
        } as any),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if title is missing', () => {
      expect(() =>
        service.validatePublicationEligibility({
          title: '',
          type: 'coding',
          learningOutcome: 'Hiểu vòng lặp',
          solutionCode: 'print(1)',
          testCases: [{ input: '1', expectedOutput: '1' }],
        } as any),
      ).toThrow(BadRequestException);
    });
  });

  describe('createLesson', () => {
    it('should allow creating a draft lesson without testCases or learningOutcome', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto: any = {
        title: 'Draft Lesson',
        slug: 'draft-lesson',
        type: 'coding',
        status: 'draft',
      };

      const result = await service.createLesson(dto, 'teacher-test-id');
      expect(result.title).toBe('Draft Lesson');
      expect(result.status).toBe('draft');
    });

    it('should block creating a published lesson if validation fails', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto: any = {
        title: 'Published Without Tests',
        slug: 'published-no-tests',
        type: 'coding',
        status: 'published',
        learningOutcome: 'Học hàm trong Python',
        testCases: [],
      };

      await expect(service.createLesson(dto, 'teacher-test-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('syncPublishedCodingLessonToExerciseBank (via createLesson publish)', () => {
    function publishedCodingDto(overrides: any = {}) {
      return {
        title: 'Bai Coding',
        slug: 'bai-coding',
        type: 'coding',
        status: 'published',
        learningOutcome: 'Hoc vong lap',
        solutionCode: 'print(1)',
        testCases: [{ input: '1', expectedOutput: '1' }],
        ...overrides,
      };
    }

    it('upserts vào đúng slug gốc khi chưa có exercise nào cùng slug', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      // Mặc định trong beforeEach: exerciseModel.findOne trả null (chưa ai chiếm slug).

      await service.createLesson(publishedCodingDto(), 'teacher-test-id');

      expect(mockExerciseModel.findOneAndUpdate).toHaveBeenCalledWith(
        { slug: 'bai-coding' },
        expect.objectContaining({
          $set: expect.objectContaining({ slug: 'bai-coding', sourceLessonSlug: 'bai-coding' }),
        }),
        expect.any(Object),
      );
    });

    it('upserts vào đúng slug gốc khi exercise cùng slug đã tồn tại nhưng do CHÍNH lesson này sở hữu (sourceLessonSlug khớp)', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockExerciseModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ slug: 'bai-coding', sourceLessonSlug: 'bai-coding' }),
      });

      await service.createLesson(publishedCodingDto(), 'teacher-test-id');

      expect(mockExerciseModel.findOneAndUpdate).toHaveBeenCalledWith(
        { slug: 'bai-coding' },
        expect.objectContaining({
          $set: expect.objectContaining({ slug: 'bai-coding' }),
        }),
        expect.any(Object),
      );
    });

    it('KHÔNG ghi đè khi slug đã bị nguồn khác chiếm (không có sourceLessonSlug khớp) — tự sinh slug hậu tố mới', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      // Slug 'bai-coding' đã tồn tại nhưng KHÔNG có sourceLessonSlug khớp lesson này
      // (ví dụ: bài do AI Tạo Đề lưu trực tiếp qua saveDraft(), không qua publish lesson).
      mockExerciseModel.findOne.mockImplementation((query: any) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(
          query.slug === 'bai-coding'
            ? { slug: 'bai-coding', sourceLessonSlug: undefined }
            : null, // slug hậu tố 'bai-coding-2' còn trống
        ),
      }));

      await service.createLesson(publishedCodingDto(), 'teacher-test-id');

      expect(mockExerciseModel.findOneAndUpdate).toHaveBeenCalledWith(
        { slug: 'bai-coding-2' },
        expect.objectContaining({
          $set: expect.objectContaining({
            slug: 'bai-coding-2',
            sourceLessonSlug: 'bai-coding',
          }),
        }),
        expect.any(Object),
      );
    });

    it('tìm hậu tố tiếp theo còn trống nếu -2 cũng đã bị chiếm', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      const taken = new Set(['bai-coding', 'bai-coding-2', 'bai-coding-3']);
      mockExerciseModel.findOne.mockImplementation((query: any) => ({
        select: jest.fn().mockReturnThis(),
        lean: jest
          .fn()
          .mockResolvedValue(
            taken.has(query.slug) ? { slug: query.slug, sourceLessonSlug: undefined } : null,
          ),
      }));

      await service.createLesson(publishedCodingDto(), 'teacher-test-id');

      expect(mockExerciseModel.findOneAndUpdate).toHaveBeenCalledWith(
        { slug: 'bai-coding-4' },
        expect.anything(),
        expect.any(Object),
      );
    });

    it('không đồng bộ gì khi lesson là draft (chưa publish)', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await service.createLesson(publishedCodingDto({ status: 'draft' }), 'teacher-test-id');

      expect(mockExerciseModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('IDOR — ownership check (assertCanModify via updateLesson/deleteLesson/findOne)', () => {
    const teacherA = { sub: 'teacher-a', role: 'TEACHER' };
    const teacherB = { sub: 'teacher-b', role: 'TEACHER' };
    const admin = { sub: 'admin-1', role: 'ADMIN' };

    function ownedLessonDoc(authorId?: string) {
      return {
        _id: 'lesson-1',
        title: 'Bai cua Teacher A',
        slug: 'bai-cua-a',
        type: 'coding',
        status: 'draft',
        authorId,
        toObject: () => ({
          _id: 'lesson-1',
          title: 'Bai cua Teacher A',
          slug: 'bai-cua-a',
          type: 'coding',
          status: 'draft',
          authorId,
        }),
      };
    }

    it('KHÔNG cho Teacher B sửa lesson do Teacher A tạo (authorId khác requester.sub)', async () => {
      mockLessonModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-a')),
      });

      await expect(
        service.updateLesson('lesson-1', { title: 'Hacked' } as any, teacherB),
      ).rejects.toThrow(ForbiddenException);
    });

    it('cho phép chính Teacher A (chủ sở hữu) sửa lesson của mình', async () => {
      mockLessonModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-a')),
      });
      mockLessonModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-a')),
      });

      await expect(
        service.updateLesson('lesson-1', { title: 'Sua boi chinh chu' } as any, teacherA),
      ).resolves.toBeDefined();
    });

    it('ADMIN sửa được lesson của bất kỳ giáo viên nào', async () => {
      mockLessonModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-a')),
      });
      mockLessonModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-a')),
      });

      await expect(
        service.updateLesson('lesson-1', { title: 'Admin sua' } as any, admin),
      ).resolves.toBeDefined();
    });

    it('lesson KHÔNG có authorId (tài nguyên dùng chung/seed) thì mọi Teacher đều sửa được', async () => {
      mockLessonModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc(undefined)),
      });
      mockLessonModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc(undefined)),
      });

      await expect(
        service.updateLesson('lesson-1', { title: 'Ai cung sua duoc' } as any, teacherB),
      ).resolves.toBeDefined();
    });

    it('lesson với authorId mặc định "teacher-1" (seed) được coi là dùng chung, Teacher B vẫn sửa được', async () => {
      mockLessonModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-1')),
      });
      mockLessonModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-1')),
      });

      await expect(
        service.updateLesson('lesson-1', { title: 'Sua bai seed' } as any, teacherB),
      ).resolves.toBeDefined();
    });

    it('KHÔNG cho Teacher B xoá lesson của Teacher A', async () => {
      mockLessonModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-a')),
      });

      await expect(service.deleteLesson('lesson-1', teacherB)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('KHÔNG cho Teacher B xem chi tiết (findOne) lesson của Teacher A', async () => {
      mockLessonModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(ownedLessonDoc('teacher-a')),
      });

      await expect(service.findOne('lesson-1', teacherB)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Input sanitization (sanitizePayloadByType) — strip control chars, no XSS-relevant injection', () => {
    it('loại bỏ ký tự điều khiển ẩn khỏi title/description/learningOutcome khi tạo lesson mới', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto: any = {
        title: 'Bai\x00 co ky tu\x07 an',
        slug: 'bai-co-ky-tu-an',
        type: 'coding',
        status: 'draft',
        description: 'Mo ta\x1B[31m do sanitize',
      };

      const result = await service.createLesson(dto, 'teacher-test-id');
      expect(result.title).toBe('Bai co ky tu an');
      expect(result.description).toBe('Mo ta[31m do sanitize');
    });

    it('giữ nguyên nội dung code/markdown hợp lệ (xuống dòng, tab) không bị strip nhầm', async () => {
      mockLessonModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto: any = {
        title: 'Bai co code',
        slug: 'bai-co-code',
        type: 'coding',
        status: 'draft',
        learningOutcome: 'Dong 1\nDong 2\tThut le',
      };

      const result = await service.createLesson(dto, 'teacher-test-id');
      expect(result.learningOutcome).toBe('Dong 1\nDong 2\tThut le');
    });
  });

  describe('exportLessonJson', () => {
    it('should export formatted JSON package with version 1.0', async () => {
      const sampleLesson = {
        _id: 'lesson-1',
        title: 'Sample Lesson',
        slug: 'sample-lesson',
        type: 'coding',
        status: 'published',
        learningOutcome: 'Nắm vững cú pháp',
        testCases: [{ input: 'a', expectedOutput: 'b' }],
      };

      mockLessonModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockLessonDoc(sampleLesson)),
      });

      const packageJson = await service.exportLessonJson('lesson-1', {
        sub: 'teacher-test-id',
        role: 'TEACHER',
      });
      expect(packageJson.version).toBe('1.0');
      expect(packageJson.lessonData.title).toBe('Sample Lesson');
      expect(packageJson.lessonData.testCases).toHaveLength(1);
    });
  });
});
