import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { CoachContextBuilder } from './coach-context.builder';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { Submission } from '../../modules-system/database/schemas/submission.schema';
import { HintUsage } from '../../modules-system/database/schemas/hint-usage.schema';
import { Hint } from '../../modules-system/database/schemas/hint.schema';
import { CoachMessage } from '../../modules-system/database/schemas/coach-message.schema';

function leanChain(resolvedValue: any) {
  return {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolvedValue),
  };
}

describe('CoachContextBuilder — context schema tối thiểu, không lộ dữ liệu cấm', () => {
  let builder: CoachContextBuilder;

  const mockExerciseModel = { findOne: jest.fn() };
  const mockSubmissionModel = { find: jest.fn() };
  const mockHintUsageModel = { find: jest.fn() };
  const mockHintModel = { find: jest.fn() };
  const mockCoachMessageModel = { find: jest.fn() };

  const fakeExercise = {
    _id: 'ex1',
    title: 'Tính tổng hai số nguyên',
    slug: 'tinh-tong-hai-so-nguyen',
    description: 'Đọc a, b in ra a+b',
    difficulty: 'EASY',
    solutionCode: 'a,b=map(int,input().split())\nprint(a+b)',
    testCases: [
      { input: '1 2', expectedOutput: '3', isHidden: false },
      { input: '100 200', expectedOutput: '300', isHidden: true },
      { input: '-5 5', expectedOutput: '0', isHidden: true },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachContextBuilder,
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
        { provide: getModelToken(Submission.name), useValue: mockSubmissionModel },
        { provide: getModelToken(HintUsage.name), useValue: mockHintUsageModel },
        { provide: getModelToken(Hint.name), useValue: mockHintModel },
        { provide: getModelToken(CoachMessage.name), useValue: mockCoachMessageModel },
      ],
    }).compile();

    builder = module.get<CoachContextBuilder>(CoachContextBuilder);
  });

  it('ném NotFoundException nếu bài tập không tồn tại', async () => {
    mockExerciseModel.findOne.mockReturnValue(leanChain(null));

    await expect(builder.build('user1', 'khong-ton-tai')).rejects.toThrow(NotFoundException);
  });

  it('không đưa hidden test case (input/expectedOutput) vào context', async () => {
    mockExerciseModel.findOne.mockReturnValue(leanChain(fakeExercise));
    mockSubmissionModel.find.mockReturnValue(leanChain([]));
    mockHintUsageModel.find.mockReturnValue(leanChain([]));
    mockHintModel.find.mockReturnValue(leanChain([]));
    mockCoachMessageModel.find.mockReturnValue(leanChain([]));

    const context = await builder.build('user1', 'tinh-tong-hai-so-nguyen');

    expect(context.exercise.visibleTestCases).toHaveLength(1);
    expect(context.exercise.visibleTestCases[0]).toEqual({ input: '1 2', expectedOutput: '3' });
    expect(context.exercise.hiddenTestCount).toBe(2);

    const serialized = JSON.stringify(context);
    expect(serialized).not.toContain('100 200');
    expect(serialized).not.toContain('-5 5');
  });

  it('không đưa solutionCode vào context dù model exercise có field này', async () => {
    mockExerciseModel.findOne.mockReturnValue(leanChain(fakeExercise));
    mockSubmissionModel.find.mockReturnValue(leanChain([]));
    mockHintUsageModel.find.mockReturnValue(leanChain([]));
    mockHintModel.find.mockReturnValue(leanChain([]));
    mockCoachMessageModel.find.mockReturnValue(leanChain([]));

    const context = await builder.build('user1', 'tinh-tong-hai-so-nguyen');

    const serialized = JSON.stringify(context);
    expect(serialized).not.toMatch(/solutionCode/i);
    expect(serialized).not.toContain('a,b=map(int,input().split())');
  });

  it('chỉ đưa nội dung hint đã unlock, không đưa hint chưa mở', async () => {
    mockExerciseModel.findOne.mockReturnValue(leanChain(fakeExercise));
    mockSubmissionModel.find.mockReturnValue(leanChain([]));
    mockHintUsageModel.find.mockReturnValue(leanChain([{ level: 1 }]));
    mockHintModel.find.mockReturnValue(
      leanChain([{ level: 1, title: 'Khái niệm', content: 'Đọc kỹ đề bài.' }]),
    );
    mockCoachMessageModel.find.mockReturnValue(leanChain([]));

    const context = await builder.build('user1', 'tinh-tong-hai-so-nguyen');

    expect(context.unlockedHints).toHaveLength(1);
    expect(context.unlockedHints[0].level).toBe(1);
    expect(context.policy.maxHintLevelUnlocked).toBe(1);
    expect(context.policy.allowFullSolution).toBe(false);

    // find phải được gọi lọc theo đúng level đã unlock, không lấy toàn bộ hint
    expect(mockHintModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseSlug: 'tinh-tong-hai-so-nguyen', level: { $in: [1] } }),
    );
  });

  it('allowFullSolution = true khi học viên đã từng AC bài này', async () => {
    mockExerciseModel.findOne.mockReturnValue(leanChain(fakeExercise));
    mockSubmissionModel.find.mockReturnValue(
      leanChain([{ status: 'AC', passedCount: 3, totalCount: 3 }]),
    );
    mockHintUsageModel.find.mockReturnValue(leanChain([]));
    mockHintModel.find.mockReturnValue(leanChain([]));
    mockCoachMessageModel.find.mockReturnValue(leanChain([]));

    const context = await builder.build('user1', 'tinh-tong-hai-so-nguyen');

    expect(context.attemptSummary.hasEverPassed).toBe(true);
    expect(context.policy.allowFullSolution).toBe(true);
  });

  it('allowFullSolution = true khi học viên đã mở tới tầng gợi ý 3', async () => {
    mockExerciseModel.findOne.mockReturnValue(leanChain(fakeExercise));
    mockSubmissionModel.find.mockReturnValue(leanChain([]));
    mockHintUsageModel.find.mockReturnValue(leanChain([{ level: 1 }, { level: 2 }, { level: 3 }]));
    mockHintModel.find.mockReturnValue(
      leanChain([
        { level: 1, title: 'Khái niệm', content: 'A' },
        { level: 2, title: 'Chiến lược', content: 'B' },
        { level: 3, title: 'Khung code', content: 'C' },
      ]),
    );
    mockCoachMessageModel.find.mockReturnValue(leanChain([]));

    const context = await builder.build('user1', 'tinh-tong-hai-so-nguyen');

    expect(context.policy.maxHintLevelUnlocked).toBe(3);
    expect(context.policy.allowFullSolution).toBe(true);
  });
});
