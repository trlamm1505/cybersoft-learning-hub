import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContestSubmissionService } from './contest-submission.service';
import { Contest } from '../../modules-system/database/schemas/contest.schema';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';
import { ContestSubmission } from '../../modules-system/database/schemas/contest-submission.schema';
import { User } from '../../modules-system/database/schemas/user.schema';
import * as codeRunner from '../../common/helper/code-runner.helper';

describe('ContestSubmissionService', () => {
  let service: ContestSubmissionService;
  let mockContestModel: any;
  let mockLessonModel: any;
  let mockSubmissionModel: any;
  let mockUserModel: any;

  const startTime = new Date(Date.now() - 10 * 60 * 1000);
  const endTime = new Date(Date.now() + 50 * 60 * 1000);

  const quizProblem = {
    slug: 'quiz-1',
    title: 'Quiz 1',
    type: 'quiz',
    points: 100,
    lessonId: 'lesson-quiz-1',
  };
  const codingProblem = {
    slug: 'code-1',
    title: 'Code 1',
    type: 'coding',
    points: 100,
    lessonId: 'lesson-code-1',
  };

  const mockContestObj = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Contest',
    slug: 'test-contest',
    startTime,
    endTime,
    problems: [quizProblem, codingProblem],
    registrations: [{ studentId: 'student-1', studentName: 'Nguyen Van A' }],
  };

  const quizLesson = {
    _id: 'lesson-quiz-1',
    quizQuestions: [
      {
        content: 'What is 1+1?',
        points: 10,
        options: [
          { key: 'A', text: '1', isCorrect: false },
          { key: 'B', text: '2', isCorrect: true },
        ],
      },
    ],
  };

  beforeEach(async () => {
    mockContestModel = {
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockContestObj) }),
    };
    mockLessonModel = {
      findById: jest
        .fn()
        .mockReturnValue({ lean: jest.fn().mockResolvedValue(quizLesson) }),
    };
    mockSubmissionModel = {
      create: jest.fn().mockResolvedValue({}),
      exists: jest.fn().mockResolvedValue(null),
    };
    mockUserModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ fullName: 'Nguyen Van A' }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestSubmissionService,
        { provide: getModelToken(Contest.name), useValue: mockContestModel },
        { provide: getModelToken(Lesson.name), useValue: mockLessonModel },
        {
          provide: getModelToken(ContestSubmission.name),
          useValue: mockSubmissionModel,
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<ContestSubmissionService>(ContestSubmissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submit — late guard', () => {
    it('marks isLate:true and still logs when submitted after contest.endTime, without trusting the client', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockContestObj,
          endTime: new Date(Date.now() - 1000),
        }),
      });

      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } },
        'student-1',
      );

      expect(result.isLate).toBe(true);
      expect(mockSubmissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ isLate: true }),
      );
    });

    it('throws BadRequestException when submitted before contest.startTime', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockContestObj,
          startTime: new Date(Date.now() + 60_000),
        }),
      });

      await expect(
        service.submit(
          '507f1f77bcf86cd799439011',
          { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } },
          'student-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submit — quiz grading', () => {
    // [M4] Điểm quiz được chấm và LƯU phía server; response trong lúc thi không lộ đúng/sai.
    it('grades quiz submissions server-side from Lesson.quizQuestions, ignoring any client-supplied correctness', async () => {
      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } }, // correct answer
        'student-1',
      );

      expect(mockSubmissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ verdict: 'AC', score: 100, passedCount: 1, totalCount: 1 }),
      );
      expect(result).toMatchObject({ verdict: 'SUBMITTED', score: null, passedCount: null, resultHidden: true });
    });

    it('scores 0 / WA when the selected answer is wrong', async () => {
      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'quiz-1', quizAnswers: { '0': 'A' } }, // wrong answer
        'student-1',
      );

      expect(mockSubmissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ verdict: 'WA', score: 0 }),
      );
      expect(result.score).toBeNull();
    });

    it('[M4] quiz chỉ được nộp một lần trong thời gian thi', async () => {
      mockSubmissionModel.exists.mockResolvedValue({ _id: 'old' });

      await expect(
        service.submit('507f1f77bcf86cd799439011', { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } }, 'student-1'),
      ).rejects.toThrow('chỉ được nộp một lần');
      expect(mockSubmissionModel.create).not.toHaveBeenCalled();
    });

    it('[M4] sau khi cuộc thi kết thúc thì trả kết quả chi tiết', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockContestObj, endTime: new Date(Date.now() - 1000) }),
      });

      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } },
        'student-1',
      );

      expect(result).toMatchObject({ verdict: 'AC', score: 100, resultHidden: false });
    });
  });

  describe('[M4] kiểm tra đăng ký', () => {
    it('học viên chưa đăng ký không nộp được bài', async () => {
      await expect(
        service.submit('507f1f77bcf86cd799439011', { problemSlug: 'code-1', code: 'print(1)' }, 'student-lạ'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockSubmissionModel.create).not.toHaveBeenCalled();
    });

    it('học viên chưa đăng ký không xem được đề; giảng viên xem được', async () => {
      await expect(
        service.getProblemForStudent('507f1f77bcf86cd799439011', 'quiz-1', { sub: 'student-lạ', role: 'STUDENT' }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      const problem = await service.getProblemForStudent('507f1f77bcf86cd799439011', 'quiz-1', {
        sub: 'teacher-1',
        role: 'TEACHER',
      });
      expect(problem.slug).toBe('quiz-1');
      expect(JSON.stringify(problem)).not.toContain('isCorrect');
    });
  });

  describe('submit — coding grading', () => {
    it('computes score proportional to passedCount/totalCount', async () => {
      mockLessonModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'lesson-code-1',
          testCases: [
            { input: '1', expectedOutput: '1' },
            { input: '2', expectedOutput: '2' },
          ],
        }),
      });

      jest
        .spyOn(codeRunner, 'checkPythonSyntax')
        .mockResolvedValue({ ok: true });
      jest
        .spyOn(codeRunner, 'runPythonCode')
        .mockResolvedValueOnce({
          stdout: '1',
          stderr: '',
          exitCode: 0,
          timedOut: false,
          executionTimeMs: 5,
          blocked: false,
        })
        .mockResolvedValueOnce({
          stdout: 'wrong',
          stderr: '',
          exitCode: 0,
          timedOut: false,
          executionTimeMs: 5,
          blocked: false,
        });

      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'code-1', code: 'print(input())' },
        'student-1',
      );

      expect(result.passedCount).toBe(1);
      expect(result.totalCount).toBe(2);
      expect(result.score).toBe(50);
      expect(result.verdict).toBe('PARTIAL');
    });
  });
});
