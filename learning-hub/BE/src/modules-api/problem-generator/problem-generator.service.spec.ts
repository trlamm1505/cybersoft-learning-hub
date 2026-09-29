import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { ProblemGeneratorService } from './problem-generator.service';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { ProblemDraft } from './problem-generator.types';

function makeDraft(overrides: Partial<ProblemDraft> = {}): ProblemDraft {
  return {
    specId: 'spec-test',
    title: 'Bai kiem thu save draft',
    slug: 'bai-kiem-thu-save-draft',
    description: 'Mo ta bai kiem thu cho saveDraft.',
    difficulty: 'EASY',
    tags: ['test'],
    starterCode: '',
    solutionCode: 'a = int(input())\nb = int(input())\nprint(a + b)',
    testCases: [
      { input: '3\n5', expectedOutput: '8', isHidden: false },
      { input: '1\n1', expectedOutput: '2', isHidden: true },
    ],
    ...overrides,
  };
}

describe('ProblemGeneratorService.saveDraft — human-in-the-loop duplicate override', () => {
  let service: ProblemGeneratorService;
  let mockExerciseModel: any;
  let existingExercisesInDb: Array<{ slug: string; title: string; description: string }>;

  beforeEach(async () => {
    existingExercisesInDb = [];

    mockExerciseModel = {
      findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockImplementation(() => Promise.resolve(existingExercisesInDb)),
        }),
      }),
      create: jest.fn().mockImplementation((data: any) => Promise.resolve({ ...data, _id: 'new-id' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemGeneratorService,
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
      ],
    }).compile();

    service = module.get(ProblemGeneratorService);
  });

  it('lưu thành công bình thường khi không có nghi vấn trùng lặp nào (forceSave không cần thiết)', async () => {
    const draft = makeDraft();
    const result = await service.saveDraft(draft);

    expect(result.slug).toBe(draft.slug);
    const createdPayload = mockExerciseModel.create.mock.calls[0][0];
    expect(createdPayload.slug).toBe(draft.slug);
    expect(createdPayload.hasDuplicateWarning).toBeUndefined();
  });

  it('từ chối lưu (ConflictException) khi có cảnh báo trùng lặp MỀM và forceSave không được gửi', async () => {
    existingExercisesInDb = [
      {
        slug: 'bai-tuong-tu-da-co',
        title: 'Bai kiem thu save draft phien ban khac',
        description: 'Mo ta bai kiem thu cho saveDraft voi chut khac biet nho.',
      },
    ];
    const draft = makeDraft();

    await expect(service.saveDraft(draft)).rejects.toThrow(ConflictException);
    expect(mockExerciseModel.create).not.toHaveBeenCalled();
  });

  it('cho phép lưu khi forceSave=true với cảnh báo trùng lặp MỀM, và ghi audit trail vào Exercise', async () => {
    existingExercisesInDb = [
      {
        slug: 'bai-tuong-tu-da-co',
        title: 'Bai kiem thu save draft phien ban khac',
        description: 'Mo ta bai kiem thu cho saveDraft voi chut khac biet nho.',
      },
    ];
    const draft = makeDraft();

    const result = await service.saveDraft(draft, {
      forceSave: true,
      overrideReason: 'Da doi chieu, hai bai khac nhau ve logic',
      approvedBy: 'teacher-approve-id',
    });

    expect(result.slug).toBe(draft.slug);
    expect(mockExerciseModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: draft.slug,
        hasDuplicateWarning: true,
        approvedBy: 'teacher-approve-id',
        overrideReason: 'Da doi chieu, hai bai khac nhau ve logic',
        approvedAt: expect.any(Date),
      }),
    );
  });

  it('KHÔNG cho phép forceSave vượt qua hard-block (slug trùng tuyệt đối) dù forceSave=true', async () => {
    const draft = makeDraft();
    existingExercisesInDb = [
      {
        slug: draft.slug, // trùng slug tuyệt đối -> isHardBlock=true
        title: 'Bai hoan toan khac ten',
        description: 'Noi dung khong lien quan gi ca',
      },
    ];

    await expect(
      service.saveDraft(draft, { forceSave: true, approvedBy: 'teacher-approve-id' }),
    ).rejects.toThrow(ConflictException);
    expect(mockExerciseModel.create).not.toHaveBeenCalled();
  });

  it('KHÔNG cho phép forceSave vượt qua điều kiện reference solution phải pass mọi test', async () => {
    const draft = makeDraft({
      solutionCode: 'a = int(input())\nb = int(input())\nprint(a - b)', // sai logic, fail test
    });

    await expect(
      service.saveDraft(draft, { forceSave: true, approvedBy: 'teacher-approve-id' }),
    ).rejects.toThrow(ConflictException);
    expect(mockExerciseModel.create).not.toHaveBeenCalled();
  }, 15000);

  it('vẫn từ chối lưu trùng slug với bài đã tồn tại thật trong DB, bất kể forceSave', async () => {
    const draft = makeDraft();
    mockExerciseModel.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'already-exists', slug: draft.slug }),
    });

    await expect(
      service.saveDraft(draft, { forceSave: true }),
    ).rejects.toThrow(ConflictException);
    expect(mockExerciseModel.create).not.toHaveBeenCalled();
  });
});

describe('ProblemGeneratorService.revalidateDraft — "Chạy lại test" sau khi giáo viên tự sửa draft', () => {
  let service: ProblemGeneratorService;
  let mockExerciseModel: any;

  beforeEach(async () => {
    mockExerciseModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemGeneratorService,
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
      ],
    }).compile();

    service = module.get(ProblemGeneratorService);
  });

  it('trả về allTestsPassed=true khi solutionCode đã sửa dùng sys.stdin.read() hợp lệ (regression cho bug "sys bị chặn nhầm")', async () => {
    const draft = makeDraft({
      solutionCode:
        'def main():\n' +
        '    import sys\n' +
        '    raw = sys.stdin.read().split()\n' +
        '    if len(raw) >= 3:\n' +
        '        a, b, c = map(int, raw[:3])\n' +
        '        print(a * b * c)\n\n' +
        "if __name__ == '__main__':\n" +
        '    main()',
      testCases: [
        { input: '2 3 4', expectedOutput: '24', isHidden: false },
        { input: '1 1 1', expectedOutput: '1', isHidden: true },
      ],
    });

    const result = await service.revalidateDraft(draft);
    expect(result.allTestsPassed).toBe(true);
    expect(result.testResults.every((t) => t.passed)).toBe(true);
  }, 15000);

  it('trả về allTestsPassed=false với thông tin actualOutput cụ thể khi solutionCode đã sửa vẫn còn sai', async () => {
    const draft = makeDraft({
      solutionCode: 'a = int(input())\nb = int(input())\nprint(a - b)',
    });

    const result = await service.revalidateDraft(draft);
    expect(result.allTestsPassed).toBe(false);
    expect(result.testResults.some((t) => !t.passed)).toBe(true);
  }, 15000);

  it('KHÔNG ghi gì vào DB — chỉ chạy validator, không gọi exerciseModel.create', async () => {
    mockExerciseModel.create = jest.fn();
    const draft = makeDraft();

    await service.revalidateDraft(draft);
    expect(mockExerciseModel.create).not.toHaveBeenCalled();
  }, 15000);
});
