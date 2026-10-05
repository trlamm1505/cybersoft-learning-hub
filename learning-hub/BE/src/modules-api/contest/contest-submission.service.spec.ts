import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContestSubmissionService } from './contest-submission.service';
import { ContestProblemContentService } from './contest-problem-content.service';
import { ContestAttemptService } from './contest-attempt.service';
import { Contest } from '../../modules-system/database/schemas/contest.schema';
import { Lesson } from '../../modules-system/database/schemas/lesson.schema';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { Question } from '../../modules-system/database/schemas/question.schema';
import { ContestSubmission } from '../../modules-system/database/schemas/contest-submission.schema';
import { User } from '../../modules-system/database/schemas/user.schema';
import * as codeRunner from '../../common/helper/code-runner.helper';

describe('ContestSubmissionService', () => {
  let service: ContestSubmissionService;
  let mockContestModel: any;
  let mockLessonModel: any;
  let mockExerciseModel: any;
  let mockQuestionModel: any;
  let mockSubmissionModel: any;
  let mockUserModel: any;
  let mockAttempt: {
    requireActive: jest.Mock;
    similarityFor: jest.Mock;
    recordIntegrity: jest.Mock;
  };

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

  const lean = (value: unknown) => ({ lean: jest.fn().mockResolvedValue(value) });
  const contestReturns = (doc: unknown) =>
    mockContestModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(doc),
    });

  beforeEach(async () => {
    mockContestModel = {
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockContestObj) }),
    };
    mockLessonModel = { findById: jest.fn().mockReturnValue(lean(quizLesson)) };
    mockExerciseModel = { findOne: jest.fn().mockReturnValue(lean(null)) };
    mockQuestionModel = { find: jest.fn().mockReturnValue(lean([])) };
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
    mockAttempt = {
      requireActive: jest.fn().mockResolvedValue({ _id: 'attempt-1' }),
      similarityFor: jest.fn().mockResolvedValue({ score: 0 }),
      recordIntegrity: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestSubmissionService,
        ContestProblemContentService,
        { provide: getModelToken(Contest.name), useValue: mockContestModel },
        { provide: getModelToken(Lesson.name), useValue: mockLessonModel },
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
        { provide: getModelToken(Question.name), useValue: mockQuestionModel },
        {
          provide: getModelToken(ContestSubmission.name),
          useValue: mockSubmissionModel,
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: ContestAttemptService, useValue: mockAttempt },
      ],
    }).compile();

    service = module.get<ContestSubmissionService>(ContestSubmissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submit — late guard', () => {
    it('marks isLate:true and still logs when submitted after contest.endTime, without trusting the client', async () => {
      contestReturns({ ...mockContestObj, endTime: new Date(Date.now() - 1000) });

      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } },
        'student-1',
      );

      expect(result.isLate).toBe(true);
      expect(mockSubmissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ isLate: true }),
      );
      // Sau giờ kết thúc không cần lượt thi và không ghi tín hiệu liêm chính.
      expect(mockAttempt.requireActive).not.toHaveBeenCalled();
      expect(mockAttempt.recordIntegrity).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when submitted before contest.startTime', async () => {
      contestReturns({ ...mockContestObj, startTime: new Date(Date.now() + 60_000) });

      await expect(
        service.submit(
          '507f1f77bcf86cd799439011',
          { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } },
          'student-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submit — lượt thi do máy chủ giữ (không còn tin localStorage)', () => {
    it('không có lượt thi đang mở (chưa vào thi / đã nộp / hết giờ cá nhân) thì từ chối, không lưu bài', async () => {
      mockAttempt.requireActive.mockRejectedValue(
        new BadRequestException('Đã hết thời gian làm bài của bạn.'),
      );
      await expect(
        service.submit(
          '507f1f77bcf86cd799439011',
          { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } },
          'student-1',
        ),
      ).rejects.toThrow('hết thời gian');
      expect(mockSubmissionModel.create).not.toHaveBeenCalled();
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
      contestReturns({ ...mockContestObj, endTime: new Date(Date.now() - 1000) });

      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } },
        'student-1',
      );

      expect(result).toMatchObject({ verdict: 'AC', score: 100, resultHidden: false });
    });

    it('phần trắc nghiệm ghép từ ngân hàng câu hỏi: chấm theo đúng thứ tự câu đã chọn', async () => {
      const bankProblem = {
        slug: 'quiz-bank',
        title: 'Trắc nghiệm',
        type: 'quiz',
        source: 'bank',
        points: 20,
        questionIds: ['q2', 'q1'],
      };
      contestReturns({ ...mockContestObj, problems: [bankProblem] });
      mockQuestionModel.find.mockReturnValue(
        lean([
          { _id: 'q1', content: 'Câu 1', options: [{ key: 'A', text: 'x', isCorrect: true }, { key: 'B', text: 'y' }] },
          { _id: 'q2', content: 'Câu 2', options: [{ key: 'A', text: 'x' }, { key: 'B', text: 'y', isCorrect: true }] },
        ]),
      );

      // Thứ tự đã chọn là q2, q1 → câu 0 là q2 (đáp án B), câu 1 là q1 (đáp án A).
      await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'quiz-bank', quizAnswers: { '0': 'B', '1': 'A' } },
        'student-1',
      );
      expect(mockSubmissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ verdict: 'AC', score: 20, passedCount: 2, totalCount: 2 }),
      );
    });
  });

  describe('submit — đề chưa chấm được', () => {
    it('đề code không có test case bị từ chối (trước đây chấm AC full điểm cho mọi bài làm)', async () => {
      mockLessonModel.findById.mockReturnValue(lean({ _id: 'lesson-code-1', testCases: [] }));
      await expect(
        service.submit('507f1f77bcf86cd799439011', { problemSlug: 'code-1', code: 'print(1)' }, 'student-1'),
      ).rejects.toThrow('chưa có nội dung chấm điểm');
      expect(mockSubmissionModel.create).not.toHaveBeenCalled();
    });

    it('đề trỏ tới bài không còn tồn tại cũng bị từ chối', async () => {
      mockLessonModel.findById.mockReturnValue(lean(null));
      await expect(
        service.submit('507f1f77bcf86cd799439011', { problemSlug: 'code-1', code: 'print(1)' }, 'student-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
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
      // Giảng viên xem đề không cần lượt thi.
      expect(mockAttempt.requireActive).not.toHaveBeenCalled();
    });

    it('học viên chỉ xem được đề khi đã vào thi (có lượt thi đang mở)', async () => {
      mockAttempt.requireActive.mockRejectedValue(
        new BadRequestException('Bạn chưa bắt đầu làm bài thi.'),
      );
      await expect(
        service.getProblemForStudent('507f1f77bcf86cd799439011', 'quiz-1', { sub: 'student-1', role: 'STUDENT' }),
      ).rejects.toThrow('chưa bắt đầu');
    });
  });

  describe('submit — coding grading', () => {
    const twoTests = {
      _id: 'lesson-code-1',
      testCases: [
        { input: '1', expectedOutput: '1' },
        { input: '2', expectedOutput: '2' },
      ],
    };
    const ran = (stdout: string) => ({
      stdout,
      stderr: '',
      exitCode: 0,
      timedOut: false,
      executionTimeMs: 5,
      blocked: false,
    });

    it('computes score proportional to passedCount/totalCount', async () => {
      mockLessonModel.findById.mockReturnValue(lean(twoTests));
      jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
      jest
        .spyOn(codeRunner, 'runPythonCode')
        .mockResolvedValueOnce(ran('1'))
        .mockResolvedValueOnce(ran('wrong'));

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

    it('bài từ Code Playground (exercise): chấm bằng test case và giới hạn thời gian của bài', async () => {
      contestReturns({
        ...mockContestObj,
        problems: [
          { slug: 'tong', title: 'Tổng', type: 'coding', source: 'exercise', exerciseSlug: 'tong', points: 30 },
        ],
      });
      mockExerciseModel.findOne.mockReturnValue(
        lean({
          slug: 'tong',
          description: 'Đề',
          starterCode: '# khung',
          timeLimitMs: 1500,
          testCases: [{ input: '1', expectedOutput: '1', isHidden: false }],
        }),
      );
      jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
      const run = jest.spyOn(codeRunner, 'runPythonCode').mockResolvedValue(ran('1'));

      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'tong', code: 'print(input())' },
        'student-1',
      );

      expect(result).toMatchObject({ verdict: 'AC', score: 30, maxPoints: 30 });
      expect(run).toHaveBeenCalledWith('print(input())', '1', 1500);
    });
  });

  describe('Day 24 — tín hiệu liêm chính trong cuộc thi', () => {
    beforeEach(() => {
      mockLessonModel.findById.mockReturnValue(
        lean({ _id: 'lesson-code-1', starterCode: '# khung', testCases: [{ input: '1', expectedOutput: '1' }] }),
      );
      jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
      jest.spyOn(codeRunner, 'runPythonCode').mockResolvedValue({
        stdout: '1',
        stderr: '',
        exitCode: 0,
        timedOut: false,
        executionTimeMs: 5,
        blocked: false,
      });
    });

    it('ghi tín hiệu kèm điểm tương đồng nhưng KHÔNG đổi điểm/verdict đã chấm', async () => {
      mockAttempt.similarityFor.mockResolvedValue({ score: 0.97, submissionId: 'other', userId: 'u2' });
      const payload = { startedAt: new Date().toISOString(), focusEvents: [] };

      const result = await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'code-1', code: 'print(input())', integrity: payload },
        'student-1',
      );

      expect(mockAttempt.similarityFor).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'code-1',
        'student-1',
        'print(input())',
        '# khung',
      );
      expect(mockAttempt.recordIntegrity).toHaveBeenCalledWith(
        expect.anything(),
        { _id: 'attempt-1' },
        payload,
        { score: 0.97, submissionId: 'other', userId: 'u2' },
        expect.any(Date),
      );
      // Giống 97% nhưng điểm vẫn do test case quyết định.
      expect(result).toMatchObject({ verdict: 'AC', score: 100 });
      expect(mockSubmissionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: 100, verdict: 'AC' }),
      );
    });

    it('lỗi khi ghi tín hiệu không làm hỏng việc nộp bài', async () => {
      mockAttempt.recordIntegrity.mockRejectedValue(new Error('db down'));
      await expect(
        service.submit(
          '507f1f77bcf86cd799439011',
          { problemSlug: 'code-1', code: 'print(input())' },
          'student-1',
        ),
      ).resolves.toMatchObject({ verdict: 'AC' });
    });

    it('cuộc thi tắt giám sát thì không so khớp, không ghi tín hiệu', async () => {
      contestReturns({ ...mockContestObj, integrityEnabled: false });
      await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'code-1', code: 'print(input())' },
        'student-1',
      );
      expect(mockAttempt.similarityFor).not.toHaveBeenCalled();
      expect(mockAttempt.recordIntegrity).not.toHaveBeenCalled();
    });

    it('bài trắc nghiệm vẫn ghi tín hiệu (rời màn hình) nhưng không so khớp mã', async () => {
      mockLessonModel.findById.mockReturnValue(lean(quizLesson));
      await service.submit(
        '507f1f77bcf86cd799439011',
        { problemSlug: 'quiz-1', quizAnswers: { '0': 'B' } },
        'student-1',
      );
      expect(mockAttempt.similarityFor).not.toHaveBeenCalled();
      expect(mockAttempt.recordIntegrity).toHaveBeenCalled();
    });
  });
});
