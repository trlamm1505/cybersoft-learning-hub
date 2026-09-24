import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachContextBuilder } from './coach-context.builder';
import { COACH_LLM_CLIENT } from './coach.constants';
import { CoachMessage } from '../../modules-system/database/schemas/coach-message.schema';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { Submission } from '../../modules-system/database/schemas/submission.schema';
import { CoachContext } from './coach-context.types';

function makeContext(overrides: Partial<CoachContext> = {}): CoachContext {
  return {
    userId: 'user1',
    exercise: {
      slug: 'bai-1',
      title: 'Bài 1',
      description: 'Mô tả ngắn',
      difficulty: 'EASY',
      visibleTestCases: [{ input: '1', expectedOutput: '1' }],
      hiddenTestCount: 1,
    },
    attemptSummary: {
      totalAttempts: 0,
      lastStatus: null,
      lastPassedCount: 0,
      lastTotalCount: 0,
      hasEverPassed: false,
    },
    unlockedHints: [],
    recentHistory: [],
    policy: { allowFullSolution: false, maxHintLevelUnlocked: 0 },
    ...overrides,
  };
}

describe('CoachService — logging và giới hạn token', () => {
  let service: CoachService;

  const mockContextBuilder = { build: jest.fn() };
  const mockLlmClient = { chat: jest.fn() };
  const mockCoachMessageModel = {
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
  };
  const mockExerciseModel = { findOne: jest.fn() };
  const mockSubmissionModel = { findOne: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachService,
        { provide: CoachContextBuilder, useValue: mockContextBuilder },
        { provide: COACH_LLM_CLIENT, useValue: mockLlmClient },
        {
          provide: getModelToken(CoachMessage.name),
          useValue: mockCoachMessageModel,
        },
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
        {
          provide: getModelToken(Submission.name),
          useValue: mockSubmissionModel,
        },
      ],
    }).compile();

    service = module.get<CoachService>(CoachService);
  });

  it('ném BadRequestException khi thiếu message', async () => {
    await expect(
      service.chat({ exerciseSlug: 'bai-1', message: '   ' }, 'u1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('ghi log cả message của user và của assistant (2 lần gọi create)', async () => {
    mockContextBuilder.build.mockResolvedValue(makeContext());
    mockLlmClient.chat.mockResolvedValue({
      content: 'Gợi ý ngắn gọn cho bạn.',
      promptTokens: 100,
      completionTokens: 20,
    });

    await service.chat({
      exerciseSlug: 'bai-1',
      message: 'Mình bị sai ở đâu?',
    }, 'u1');

    expect(mockCoachMessageModel.create).toHaveBeenCalledTimes(2);
    expect(mockCoachMessageModel.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ role: 'user', content: 'Mình bị sai ở đâu?' }),
    );
    expect(mockCoachMessageModel.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        role: 'assistant',
        content: 'Gợi ý ngắn gọn cho bạn.',
      }),
    );
  });

  it('trả về usage với maxPromptTokens/maxCompletionTokens để client biết giới hạn', async () => {
    mockContextBuilder.build.mockResolvedValue(makeContext());
    mockLlmClient.chat.mockResolvedValue({
      content: 'Trả lời ngắn.',
      promptTokens: 50,
      completionTokens: 10,
    });

    const result = await service.chat({
      exerciseSlug: 'bai-1',
      message: 'Hỏi gì đó',
    }, 'u1');

    expect(result.usage.maxPromptTokens).toBeGreaterThan(0);
    expect(result.usage.maxCompletionTokens).toBeGreaterThan(0);
  });

  it('cắt bớt completion nếu vượt giới hạn MAX_COMPLETION_TOKENS', async () => {
    mockContextBuilder.build.mockResolvedValue(makeContext());
    const hugeContent = 'a'.repeat(20000); // ~5000 tokens ước lượng, vượt xa giới hạn 800
    mockLlmClient.chat.mockResolvedValue({
      content: hugeContent,
      promptTokens: 50,
      completionTokens: 5000,
    });

    const result = await service.chat({
      exerciseSlug: 'bai-1',
      message: 'Hỏi gì đó',
    }, 'u1');

    expect(result.reply.length).toBeLessThan(hugeContent.length);
    expect(result.usage.completionTokens).toBeLessThanOrEqual(800);
  });

  it('ném BadRequestException nếu context (đã lồng lịch sử dài) vượt giới hạn prompt token', async () => {
    const longHistory = Array.from({ length: 50 }, () => ({
      role: 'user' as const,
      content: 'x'.repeat(2000),
    }));
    mockContextBuilder.build.mockResolvedValue(
      makeContext({ recentHistory: longHistory }),
    );

    await expect(
      service.chat({
        exerciseSlug: 'bai-1',
        message: 'Hỏi gì đó',
      }, 'u1'),
    ).rejects.toThrow(BadRequestException);

    expect(mockLlmClient.chat).not.toHaveBeenCalled();
  });

  it('policy chặn full solution khi allowFullSolution=false vẫn được log với policyBlocked=true', async () => {
    mockContextBuilder.build.mockResolvedValue(
      makeContext({
        policy: { allowFullSolution: false, maxHintLevelUnlocked: 0 },
      }),
    );
    const fullSolutionReply = [
      '```python',
      'a=1',
      'b=2',
      'c=3',
      'd=4',
      'e=5',
      'f=6',
      '```',
    ].join('\n');
    mockLlmClient.chat.mockResolvedValue({
      content: fullSolutionReply,
      promptTokens: 50,
      completionTokens: 30,
    });

    const result = await service.chat({
      exerciseSlug: 'bai-1',
      message: 'Cho mình code đầy đủ',
    }, 'u1');

    expect(result.policy.blocked).toBe(true);
    expect(result.reply).not.toContain('a=1');
    expect(mockCoachMessageModel.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ role: 'assistant', policyBlocked: true }),
    );
  });
});

function leanChain(resolvedValue: any) {
  return {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolvedValue),
  };
}

describe('CoachService.debugLoop — phân tích test thật, giới hạn vòng lặp', () => {
  let service: CoachService;

  const mockContextBuilder = { build: jest.fn() };
  const mockLlmClient = { chat: jest.fn() };
  const mockCoachMessageModel = {
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
  };
  const mockExerciseModel = { findOne: jest.fn() };
  const mockSubmissionModel = { findOne: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachService,
        { provide: CoachContextBuilder, useValue: mockContextBuilder },
        { provide: COACH_LLM_CLIENT, useValue: mockLlmClient },
        {
          provide: getModelToken(CoachMessage.name),
          useValue: mockCoachMessageModel,
        },
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
        {
          provide: getModelToken(Submission.name),
          useValue: mockSubmissionModel,
        },
      ],
    }).compile();

    service = module.get<CoachService>(CoachService);
  });

  it('ném NotFoundException nếu không tìm thấy exercise', async () => {
    mockExerciseModel.findOne.mockReturnValue(leanChain(null));

    await expect(
      service.debugLoop({
        exerciseSlug: 'khong-ton-tai',
        submissionId: 's1',
      }, 'u1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('ném NotFoundException nếu submission không thuộc đúng user/exercise', async () => {
    mockExerciseModel.findOne.mockReturnValue(
      leanChain({ _id: 'ex1', title: 'Bài 1' }),
    );
    mockSubmissionModel.findOne.mockReturnValue(leanChain(null));

    await expect(
      service.debugLoop({
        exerciseSlug: 'bai-1',
        submissionId: 's-khong-ton-tai',
      }, 'u1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('phân tích submission WA dựa trên results thật, không bịa dữ liệu', async () => {
    mockExerciseModel.findOne.mockReturnValue(
      leanChain({ _id: 'ex1', title: 'Bài 1' }),
    );
    mockSubmissionModel.findOne.mockReturnValue(
      leanChain({
        _id: 's1',
        status: 'WA',
        passedCount: 1,
        totalCount: 2,
        createdAt: new Date('2026-01-01T00:10:00Z'),
        results: [
          { index: 0, passed: true },
          {
            index: 1,
            passed: false,
            input: '3 4',
            expectedOutput: '7',
            actualOutput: '34',
            isHidden: false,
          },
        ],
      }),
    );
    mockSubmissionModel.find.mockReturnValue(leanChain([]));

    const result = await service.debugLoop({
      exerciseSlug: 'bai-1',
      submissionId: 's1',
    }, 'u1');

    expect(result.errorCategory).toBe('WRONG_OUTPUT');
    expect(result.feedback).toContain('34');
    expect(result.loopCount).toBe(1);
    expect(result.loopLimitReached).toBe(false);
    expect(mockCoachMessageModel.create).toHaveBeenCalledTimes(1);
  });

  it('đếm loopCount dựa trên các submission chưa AC liên tiếp trước đó, dừng đếm khi gặp AC', async () => {
    mockExerciseModel.findOne.mockReturnValue(
      leanChain({ _id: 'ex1', title: 'Bài 1' }),
    );
    mockSubmissionModel.findOne.mockReturnValue(
      leanChain({
        _id: 's5',
        status: 'WA',
        passedCount: 1,
        totalCount: 2,
        createdAt: new Date('2026-01-01T00:50:00Z'),
        results: [
          {
            index: 0,
            passed: false,
            input: 'x',
            expectedOutput: 'y',
            actualOutput: 'z',
          },
        ],
      }),
    );
    // 4 submission trước đó: WA, WA, AC (chặn đếm), WA — chỉ 2 cái đầu được tính.
    mockSubmissionModel.find.mockReturnValue(
      leanChain([
        { status: 'WA' },
        { status: 'WA' },
        { status: 'AC' },
        { status: 'WA' },
      ]),
    );

    const result = await service.debugLoop({
      exerciseSlug: 'bai-1',
      submissionId: 's5',
    }, 'u1');

    expect(result.loopCount).toBe(3); // 2 lần trước (trước AC) + lần hiện tại
  });

  it('chạm giới hạn vòng lặp trả về loopLimitReached=true', async () => {
    mockExerciseModel.findOne.mockReturnValue(
      leanChain({ _id: 'ex1', title: 'Bài 1' }),
    );
    mockSubmissionModel.findOne.mockReturnValue(
      leanChain({
        _id: 's6',
        status: 'WA',
        passedCount: 0,
        totalCount: 2,
        createdAt: new Date('2026-01-01T01:00:00Z'),
        results: [
          {
            index: 0,
            passed: false,
            input: 'x',
            expectedOutput: 'y',
            actualOutput: 'z',
          },
        ],
      }),
    );
    mockSubmissionModel.find.mockReturnValue(
      leanChain([
        { status: 'WA' },
        { status: 'WA' },
        { status: 'WA' },
        { status: 'WA' },
      ]),
    );

    const result = await service.debugLoop({
      exerciseSlug: 'bai-1',
      submissionId: 's6',
    }, 'u1');

    expect(result.loopCount).toBe(5);
    expect(result.loopLimitReached).toBe(true);
    expect(result.nextStep).toMatch(/giới hạn|người hướng dẫn/);
  });
});
