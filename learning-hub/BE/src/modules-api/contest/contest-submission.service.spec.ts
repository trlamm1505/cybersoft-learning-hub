import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { ContestSubmissionService } from './contest-submission.service';
import { Contest } from '../../modules-system/database/schemas/contest.schema';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';
import { ContestSubmission } from '../../modules-system/database/schemas/contest-submission.schema';
import * as codeRunner from '../../common/helper/code-runner.helper';

describe('ContestSubmissionService', () => {
  let service: ContestSubmissionService;
  let mockContestModel: any;
  let mockLessonModel: any;
  let mockSubmissionModel: any;

  const startTime = new Date(Date.now() - 10 * 60 * 1000);
  const endTime = new Date(Date.now() + 50 * 60 * 1000);

  const quizProblem = { slug: 'quiz-1', title: 'Quiz 1', type: 'quiz', points: 100, lessonId: 'lesson-quiz-1' };
  const codingProblem = { slug: 'code-1', title: 'Code 1', type: 'coding', points: 100, lessonId: 'lesson-code-1' };

  const mockContestObj = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Contest',
    slug: 'test-contest',
    startTime,
    endTime,
    problems: [quizProblem, codingProblem],
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
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockContestObj) }),
    };
    mockLessonModel = {
      findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(quizLesson) }),
    };
    mockSubmissionModel = {
      create: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestSubmissionService,
        { provide: getModelToken(Contest.name), useValue: mockContestModel },
        { provide: getModelToken(Lesson.name), useValue: mockLessonModel },
        { provide: getModelToken(ContestSubmission.name), useValue: mockSubmissionModel },
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
        exec: jest.fn().mockResolvedValue({ ...mockContestObj, endTime: new Date(Date.now() - 1000) }),
      });

      const result = await service.submit('507f1f77bcf86cd799439011', {
        studentId: 'student-1',
        problemSlug: 'quiz-1',
        quizAnswers: { '0': 'B' },
      });

      expect(result.isLate).toBe(true);
      expect(mockSubmissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ isLate: true }),
      );
    });

    it('throws BadRequestException when submitted before contest.startTime', async () => {
      mockContestModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockContestObj, startTime: new Date(Date.now() + 60_000) }),
      });

      await expect(
        service.submit('507f1f77bcf86cd799439011', {
          studentId: 'student-1',
          problemSlug: 'quiz-1',
          quizAnswers: { '0': 'B' },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submit — quiz grading', () => {
    it('grades quiz submissions server-side from Lesson.quizQuestions, ignoring any client-supplied correctness', async () => {
      const result = await service.submit('507f1f77bcf86cd799439011', {
        studentId: 'student-1',
        problemSlug: 'quiz-1',
        quizAnswers: { '0': 'B' }, // correct answer
      });

      expect(result.verdict).toBe('AC');
      expect(result.score).toBe(100);
      expect(result.passedCount).toBe(1);
      expect(result.totalCount).toBe(1);
    });

    it('scores 0 / WA when the selected answer is wrong', async () => {
      const result = await service.submit('507f1f77bcf86cd799439011', {
        studentId: 'student-1',
        problemSlug: 'quiz-1',
        quizAnswers: { '0': 'A' }, // wrong answer
      });

      expect(result.verdict).toBe('WA');
      expect(result.score).toBe(0);
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

      jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
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

      const result = await service.submit('507f1f77bcf86cd799439011', {
        studentId: 'student-1',
        problemSlug: 'code-1',
        code: 'print(input())',
      });

      expect(result.passedCount).toBe(1);
      expect(result.totalCount).toBe(2);
      expect(result.score).toBe(50);
      expect(result.verdict).toBe('PARTIAL');
    });
  });
});
