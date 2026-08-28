import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { QuizService } from './quiz.service';
import { Question } from '../../modules-system/database/schemas/question.schema';
import { QuizAttempt } from '../../modules-system/database/schemas/quiz-attempt.schema';

describe('QuizService Unit & Integration Tests', () => {
  let service: QuizService;
  let mockQuestionModel: any;
  let mockQuizAttemptModel: any;

  const validUserId = new Types.ObjectId().toString();
  const validTestId = new Types.ObjectId().toString();
  const validAttemptId = new Types.ObjectId().toString();
  const validQuestionId1 = new Types.ObjectId().toString();
  const validQuestionId2 = new Types.ObjectId().toString();

  const mockQuestions = [
    {
      _id: new Types.ObjectId(validQuestionId1),
      content: 'Thẻ HTML5 Semantic nào dùng để bọc thanh điều hướng?',
      category: 'HTML5',
      difficulty: 'EASY',
      points: 10,
      options: [
        { key: 'A', text: '<section>', isCorrect: false },
        { key: 'B', text: '<nav>', isCorrect: true },
        { key: 'C', text: '<aside>', isCorrect: false },
        { key: 'D', text: '<header>', isCorrect: false },
      ],
      explanation: 'Thẻ <nav> được thiết kế dành riêng cho menu liên kết điều hướng.',
    },
    {
      _id: new Types.ObjectId(validQuestionId2),
      content: 'Hook nào trong React được dùng để quản lý Side Effects?',
      category: 'React',
      difficulty: 'EASY',
      points: 10,
      options: [
        { key: 'A', text: 'useState', isCorrect: false },
        { key: 'B', text: 'useEffect', isCorrect: true },
        { key: 'C', text: 'useContext', isCorrect: false },
        { key: 'D', text: 'useRef', isCorrect: false },
      ],
      explanation: 'useEffect cho phép thực thi side effects sau khi render component.',
    },
  ];

  beforeEach(async () => {
    mockQuestionModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockQuestions),
      }),
    };

    mockQuizAttemptModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: getModelToken(Question.name),
          useValue: mockQuestionModel,
        },
        {
          provide: getModelToken(QuizAttempt.name),
          useValue: mockQuizAttemptModel,
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  describe('1. Start Attempt Flow & Sanitization', () => {
    it('Should start attempt, apply PRNG seed shuffle and sanitize isCorrect/explanation from response', async () => {
      mockQuizAttemptModel.findOne.mockResolvedValue(null);

      const createdAttemptObj = {
        _id: new Types.ObjectId(validAttemptId),
        userId: new Types.ObjectId(validUserId),
        testId: new Types.ObjectId(validTestId),
        seed: 'sample-seed-123',
        shuffledQuestions: [
          { questionId: new Types.ObjectId(validQuestionId1), optionKeysOrder: ['B', 'A', 'C', 'D'] },
          { questionId: new Types.ObjectId(validQuestionId2), optionKeysOrder: ['A', 'B', 'C', 'D'] },
        ],
        startedAt: new Date(),
        timeLimitSeconds: 1800,
        status: 'IN_PROGRESS',
        score: 0,
        maxScore: 20,
      };

      mockQuizAttemptModel.create.mockResolvedValue(createdAttemptObj);

      const result = await service.startAttempt({
        userId: validUserId,
        testId: validTestId,
      });

      expect(result).toBeDefined();
      expect(result.attemptId.toString()).toBe(validAttemptId);
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.questions).toHaveLength(2);

      // Verify sanitization: isCorrect and explanation MUST BE STRIPPED OUT
      result.questions.forEach((q) => {
        expect(q).not.toHaveProperty('explanation');
        q.options.forEach((opt: any) => {
          expect(opt).not.toHaveProperty('isCorrect');
        });
      });
    });
  });

  describe('2. Overdue Submission Check', () => {
    it('2.1 Should process valid submission within time limit successfully', async () => {
      const mockAttemptDoc = {
        _id: new Types.ObjectId(validAttemptId),
        userId: new Types.ObjectId(validUserId),
        startedAt: new Date(Date.now() - 10000), // 10s ago
        timeLimitSeconds: 1800,
        status: 'IN_PROGRESS',
        score: 0,
        maxScore: 20,
        shuffledQuestions: [
          { questionId: new Types.ObjectId(validQuestionId1), optionKeysOrder: ['B', 'A', 'C', 'D'] },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      mockQuizAttemptModel.findOne.mockResolvedValue(mockAttemptDoc);

      const result = await service.submitAttempt(validAttemptId, {
        userId: validUserId,
        answers: [{ questionId: validQuestionId1, selectedOptionKey: 'B' }],
      });

      expect(result.status).toBe('GRADED');
      expect(result.score).toBe(10);
      expect(mockAttemptDoc.save).toHaveBeenCalled();
    });

    it('2.2 Should block overdue submission, update status to EXPIRED and throw BadRequestException', async () => {
      const overdueStartedAt = new Date(Date.now() - 2000000); // 2000s ago (> 1800s limit)

      const mockOverdueAttemptDoc = {
        _id: new Types.ObjectId(validAttemptId),
        userId: new Types.ObjectId(validUserId),
        startedAt: overdueStartedAt,
        timeLimitSeconds: 1800,
        status: 'IN_PROGRESS',
        score: 0,
        maxScore: 20,
        shuffledQuestions: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockQuizAttemptModel.findOne.mockResolvedValue(mockOverdueAttemptDoc);

      await expect(
        service.submitAttempt(validAttemptId, {
          userId: validUserId,
          answers: [],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOverdueAttemptDoc.status).toBe('EXPIRED');
      expect(mockOverdueAttemptDoc.save).toHaveBeenCalled();
    });
  });

  describe('3. Review Policy Enforcement', () => {
    it('3.1 Should throw ForbiddenException when Review Policy is NEVER', async () => {
      const mockAttemptDoc = {
        _id: new Types.ObjectId(validAttemptId),
        userId: new Types.ObjectId(validUserId),
        status: 'GRADED',
      };

      mockQuizAttemptModel.findOne.mockResolvedValue(mockAttemptDoc);

      await expect(
        service.reviewAttempt(validAttemptId, validUserId, 'NEVER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('3.2 Should throw BadRequestException when Review Policy is AFTER_SUBMISSION but attempt is still IN_PROGRESS', async () => {
      const mockAttemptDoc = {
        _id: new Types.ObjectId(validAttemptId),
        userId: new Types.ObjectId(validUserId),
        status: 'IN_PROGRESS',
      };

      mockQuizAttemptModel.findOne.mockResolvedValue(mockAttemptDoc);

      await expect(
        service.reviewAttempt(validAttemptId, validUserId, 'AFTER_SUBMISSION'),
      ).rejects.toThrow(BadRequestException);
    });

    it('3.3 Should return full question details with correct keys and explanations when policy allows', async () => {
      const mockAttemptDoc = {
        _id: new Types.ObjectId(validAttemptId),
        userId: new Types.ObjectId(validUserId),
        testId: new Types.ObjectId(validTestId),
        status: 'GRADED',
        score: 20,
        maxScore: 20,
        shuffledQuestions: [
          {
            questionId: new Types.ObjectId(validQuestionId1),
            optionKeysOrder: ['A', 'B', 'C', 'D'],
            selectedOptionKey: 'B',
            isCorrect: true,
            scoreEarned: 10,
          },
        ],
      };

      mockQuizAttemptModel.findOne.mockResolvedValue(mockAttemptDoc);

      const review = await service.reviewAttempt(validAttemptId, validUserId, 'AFTER_SUBMISSION');

      expect(review).toBeDefined();
      expect(review.status).toBe('GRADED');
      expect(review.questions).toHaveLength(1);

      const q1 = review.questions[0];
      expect(q1?.correctOptionKey).toBe('B');
      expect(q1?.selectedOptionKey).toBe('B');
      expect(q1?.explanation).toBe('Thẻ <nav> được thiết kế dành riêng cho menu liên kết điều hướng.');
    });
  });
});
