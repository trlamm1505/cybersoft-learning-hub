import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ExerciseService } from './exercise.service';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { Submission } from '../../modules-system/database/schemas/submission.schema';
import { JudgeQueueService } from '../judge/judge-queue.service';

describe('ExerciseService.findAll — hasSolution/testCaseCount badge fields', () => {
  let service: ExerciseService;
  let mockExerciseModel: any;

  beforeEach(async () => {
    mockExerciseModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseService,
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
        { provide: getModelToken(Submission.name), useValue: {} },
        { provide: JudgeQueueService, useValue: {} },
      ],
    }).compile();

    service = module.get<ExerciseService>(ExerciseService);
  });

  function mockFind(docs: any[]) {
    mockExerciseModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(docs),
      }),
    });
  }

  it('sets hasSolution=true and correct testCaseCount when both are present', async () => {
    mockFind([
      {
        title: 'Bai co solution',
        slug: 'bai-co-solution',
        solutionCode: 'print(1)',
        testCases: [{ input: '1', expectedOutput: '1' }, { input: '2', expectedOutput: '2' }],
      },
    ]);

    const result = await service.findAll();
    expect(result[0].hasSolution).toBe(true);
    expect(result[0].testCaseCount).toBe(2);
  });

  it('sets hasSolution=false when solutionCode is empty/whitespace-only', async () => {
    mockFind([
      { title: 'Bai chua co solution', slug: 'bai-chua-co', solutionCode: '   ', testCases: [] },
    ]);

    const result = await service.findAll();
    expect(result[0].hasSolution).toBe(false);
    expect(result[0].testCaseCount).toBe(0);
  });

  it('sets hasSolution=false when solutionCode field is entirely absent', async () => {
    mockFind([{ title: 'Bai khong co field', slug: 'bai-khong-co-field' }]);

    const result = await service.findAll();
    expect(result[0].hasSolution).toBe(false);
    expect(result[0].testCaseCount).toBe(0);
  });

  it('never leaks raw testCases/solutionCode fields in the response (only counts/booleans)', async () => {
    mockFind([
      {
        title: 'Bai bi mat',
        slug: 'bai-bi-mat',
        solutionCode: 'print("dap an bi mat")',
        testCases: [{ input: 'x', expectedOutput: 'secret-output', isHidden: true }],
      },
    ]);

    const result = await service.findAll();
    expect(result[0]).not.toHaveProperty('solutionCode');
    expect(result[0]).not.toHaveProperty('testCases');
  });

  it('preserves sourceLessonSlug field for the "Validated" badge on the FE', async () => {
    mockFind([
      {
        title: 'Bai da publish qua Lesson',
        slug: 'bai-da-publish',
        sourceLessonSlug: 'bai-da-publish',
        solutionCode: 'print(1)',
        testCases: [{ input: '1', expectedOutput: '1' }],
      },
    ]);

    const result = await service.findAll();
    expect(result[0].sourceLessonSlug).toBe('bai-da-publish');
  });
});
