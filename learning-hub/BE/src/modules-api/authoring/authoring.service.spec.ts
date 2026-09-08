import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthoringService } from './authoring.service';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';

describe('AuthoringService', () => {
  let service: AuthoringService;
  let mockLessonModel: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthoringService,
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
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

    it('should pass validation when coding lesson has learningOutcome and testCases', () => {
      expect(() =>
        service.validatePublicationEligibility({
          title: 'Valid Coding',
          type: 'coding',
          learningOutcome: 'Lập trình tính tổng hai số',
          testCases: [{ input: '1 2', expectedOutput: '3' }],
        } as any),
      ).not.toThrow();
    });
  });

  describe('createLesson', () => {
    it('should allow creating a draft lesson without testCases or learningOutcome', async () => {
      mockLessonModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const dto: any = {
        title: 'Draft Lesson',
        slug: 'draft-lesson',
        type: 'coding',
        status: 'draft',
      };

      const result = await service.createLesson(dto);
      expect(result.title).toBe('Draft Lesson');
      expect(result.status).toBe('draft');
    });

    it('should block creating a published lesson if validation fails', async () => {
      mockLessonModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const dto: any = {
        title: 'Published Without Tests',
        slug: 'published-no-tests',
        type: 'coding',
        status: 'published',
        learningOutcome: 'Học hàm trong Python',
        testCases: [],
      };

      await expect(service.createLesson(dto)).rejects.toThrow(BadRequestException);
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

      const packageJson = await service.exportLessonJson('lesson-1');
      expect(packageJson.version).toBe('1.0');
      expect(packageJson.lessonData.title).toBe('Sample Lesson');
      expect(packageJson.lessonData.testCases).toHaveLength(1);
    });
  });
});
