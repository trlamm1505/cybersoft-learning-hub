import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ExerciseService } from './exercise.service';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { Submission } from '../../modules-system/database/schemas/submission.schema';
import { IntegrityService } from '../integrity/integrity.service';
import { ClassAssignmentsService } from '../class-assignments/class-assignments.service';
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
        { provide: IntegrityService, useValue: {} },
        { provide: ClassAssignmentsService, useValue: { assertCanSubmitCoding: jest.fn() } },
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

/** findOne(...).select(...).lean() hoặc findOne(...).lean(): submitCode chủ động select('+hiddenTestCases'). */
function findOneReturning(value: any) {
  const lean = jest.fn().mockResolvedValue(value);
  return { lean, select: jest.fn().mockReturnValue({ lean }) };
}

describe('ExerciseService.submitCode — chặn nộp Python vào bài DA Lab', () => {
  let service: ExerciseService;
  const mockExerciseModel = { findOne: jest.fn() };
  const mockSubmissionModel = { create: jest.fn() };
  const mockJudge = { enqueue: jest.fn() };
  const mockIntegrity = { evaluate: jest.fn().mockResolvedValue({ flag: 'NONE' }) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseService,
        { provide: getModelToken(Exercise.name), useValue: mockExerciseModel },
        { provide: getModelToken(Submission.name), useValue: mockSubmissionModel },
        { provide: JudgeQueueService, useValue: mockJudge },
        { provide: IntegrityService, useValue: mockIntegrity },
        { provide: ClassAssignmentsService, useValue: { assertCanSubmitCoding: jest.fn() } },
        { provide: ClassAssignmentsService, useValue: { assertCanSubmitCoding: jest.fn() } },
      ],
    }).compile();
    service = module.get<ExerciseService>(ExerciseService);
  });

  it.each([
    { slug: 'da-sql-01', type: 'SQL_LAB', resource_id: 'ds-retail-ecommerce-sales-v1' },
    { slug: 'da-insight-01', type: 'DA_INSIGHT', resource_id: 'ds-retail-ecommerce-sales-v1' },
  ])('$slug: BadRequestException, không tạo submission, không vào hàng đợi', async (exercise) => {
    mockExerciseModel.findOne.mockReturnValue(findOneReturning(exercise));

    await expect(service.submitCode(exercise.slug, { code: 'print(1)' } as any, 'u1')).rejects.toThrow(
      'Invalid submission type',
    );
    expect(mockSubmissionModel.create).not.toHaveBeenCalled();
    expect(mockJudge.enqueue).not.toHaveBeenCalled();
  });

  it('bài Python bình thường vẫn được nộp và vào hàng đợi', async () => {
    mockExerciseModel.findOne.mockReturnValue(
      findOneReturning({
        _id: 'ex1',
        slug: 'tinh-tong',
        type: 'CODE_TEXT',
        testCases: [{ input: '1', expectedOutput: '1' }],
      }),
    );
    mockSubmissionModel.create.mockResolvedValue({ _id: 'sub1' });

    const res = await service.submitCode('tinh-tong', { code: 'print(1)' } as any, 'u1');

    expect(res).toEqual({ submissionId: 'sub1', status: 'QUEUED' });
    expect(mockJudge.enqueue).toHaveBeenCalledWith('sub1');
  });
  it('lưu tín hiệu liêm chính cùng bài nộp nhưng KHÔNG đổi trạng thái chấm (vẫn QUEUED, không điểm)', async () => {
    mockExerciseModel.findOne.mockReturnValue(
      findOneReturning({ _id: 'ex1', slug: 'de', type: 'CODE_TEXT', testCases: [] }),
    );
    const flagged = { flag: 'REVIEW', reviewStatus: 'NEEDS_REVIEW' };
    mockIntegrity.evaluate.mockResolvedValueOnce(flagged);
    mockSubmissionModel.create.mockResolvedValue({ _id: 'sub2' });

    const res = await service.submitCode('de', { code: 'print(1)', integrity: {} } as any, 'u1');

    const created = mockSubmissionModel.create.mock.calls[0][0];
    expect(created.integrity).toBe(flagged);
    expect(created.status).toBe('QUEUED');
    expect(created.passedCount).toBe(0);
    expect(res.status).toBe('QUEUED');
    expect(mockJudge.enqueue).toHaveBeenCalledWith('sub2');
  });
});

describe('ExerciseService — ma trận, quyền sở hữu, truy cập theo nhóm', () => {
  let service: ExerciseService;
  let model: any;
  const teacher = { sub: 't1', email: 't@x', role: 'TEACHER' };
  const admin = { sub: 'a1', email: 'a@x', role: 'ADMIN' };
  const OID = '64b64b64b64b64b64b64b64b';

  const leanOf = (v: any) => ({ lean: jest.fn().mockResolvedValue(v) });

  beforeEach(async () => {
    model = {
      findById: jest.fn(),
      findOne: jest.fn(),
      exists: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (d: any) => ({ ...d })),
      updateOne: jest.fn().mockResolvedValue({}),
      deleteOne: jest.fn().mockResolvedValue({}),
    };
    const module = await Test.createTestingModule({
      providers: [
        ExerciseService,
        { provide: getModelToken(Exercise.name), useValue: model },
        { provide: getModelToken(Submission.name), useValue: {} },
        { provide: JudgeQueueService, useValue: {} },
        { provide: IntegrityService, useValue: {} },
        { provide: ClassAssignmentsService, useValue: { assertCanSubmitCoding: jest.fn() } },
      ],
    }).compile();
    service = module.get(ExerciseService);
    // findBySlugFull được create/update gọi lại để trả kết quả
    model.findOne.mockReturnValue({ select: () => leanOf({ slug: 'x' }) });
  });

  it('create: sai ma trận -> 400, không ghi', async () => {
    await expect(
      service.create(
        { title: 'T', description: 'D', targetGroup: 'K3_5', labType: 'PYTHON_CODE' },
        teacher,
      ),
    ).rejects.toThrow(/chỉ nhận labType PUZZLE_BLOCK/);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('create: ghi authorId từ token, bỏ qua authorId do client gửi', async () => {
    await service.create(
      {
        title: 'T',
        description: 'D',
        targetGroup: 'K6_9',
        labType: 'PYTHON_CODE',
        authorId: 'hacker',
      } as any,
      teacher,
    );
    expect(model.create.mock.calls[0][0].authorId).toBe('t1');
  });

  it('update một phần: chỉ đổi labType nhưng lệch targetGroup hiện tại -> 400', async () => {
    model.findById.mockReturnValue(
      leanOf({ _id: OID, slug: 's', authorId: 't1', targetGroup: 'K6_9', labType: 'PYTHON_CODE' }),
    );
    await expect(service.update(OID, { labType: 'ALGO_JUDGE' }, teacher)).rejects.toThrow(
      /chỉ nhận labType PYTHON_CODE/,
    );
    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('update một phần: chỉ đổi targetGroup lệch labType hiện tại -> 400', async () => {
    model.findById.mockReturnValue(
      leanOf({ _id: OID, slug: 's', authorId: 't1', targetGroup: 'K6_9', labType: 'PYTHON_CODE' }),
    );
    await expect(service.update(OID, { targetGroup: 'K10_12' }, teacher)).rejects.toThrow(
      /K10_12/,
    );
  });

  it('update: đổi cả hai cho khớp ma trận -> được ghi', async () => {
    model.findById.mockReturnValue(
      leanOf({ _id: OID, slug: 's', authorId: 't1', targetGroup: 'K6_9', labType: 'PYTHON_CODE' }),
    );
    await service.update(OID, { targetGroup: 'K10_12', labType: 'ALGO_JUDGE' }, teacher);
    expect(model.updateOne).toHaveBeenCalled();
  });

  it('teacher không sửa/xóa bài của người khác (403), admin thì được', async () => {
    model.findById.mockReturnValue(leanOf({ _id: OID, slug: 's', authorId: 'someone-else' }));
    await expect(service.update(OID, { title: 'x' }, teacher)).rejects.toThrow(/chính mình/);
    await expect(service.remove(OID, teacher)).rejects.toThrow(/chính mình/);
    await expect(service.remove(OID, admin)).resolves.toEqual({ deleted: true, slug: 's' });
  });

  it('findBySlug: học viên K3_5 vào bài K10_12 -> 403; khách -> 401; bài cũ không giới hạn', async () => {
    const sel = (v: any) => ({ select: () => leanOf(v) });
    model.findOne.mockReturnValue(sel({ slug: 'k', targetGroup: 'K10_12', testCases: [] }));
    await expect(
      service.findBySlug('k', { sub: 's', email: 'e', role: 'STUDENT', ageGroup: '3-5' }),
    ).rejects.toThrow(/không thuộc nhóm/);
    await expect(service.findBySlug('k')).rejects.toThrow(/đăng nhập/);
    await expect(
      service.findBySlug('k', { sub: 's', email: 'e', role: 'STUDENT', ageGroup: '10-12' }),
    ).resolves.toMatchObject({ slug: 'k' });

    model.findOne.mockReturnValue(sel({ slug: 'cu', testCases: [] }));
    await expect(service.findBySlug('cu')).resolves.toMatchObject({ slug: 'cu' });
  });

  it('bài chỉ gắn gradeBand (không có targetGroup) cũng không lọt sang khối khác (403)', async () => {
    const sel = (v: any) => ({ select: () => leanOf(v) });
    model.findOne.mockReturnValue(sel({ slug: 'a', gradeBand: '9-12', testCases: [] }));
    await expect(
      service.findBySlug('a', { sub: 's', email: 'e', role: 'STUDENT', ageGroup: '6-9' }),
    ).rejects.toThrow(/không thuộc khối/);
    await expect(
      service.findBySlug('a', { sub: 's', email: 'e', role: 'STUDENT', ageGroup: '10-12' }),
    ).resolves.toMatchObject({ slug: 'a' });
    await expect(service.findBySlug('a', { sub: 't', email: 'e', role: 'TEACHER' })).resolves.toMatchObject({ slug: 'a' });
  });

  it('findAll: học sinh 6-9 chỉ truy vấn bài khối mình (hoặc bài cũ chưa gắn khối)', async () => {
    const chain: any = { select: () => chain, lean: jest.fn().mockResolvedValue([]) };
    model.find = jest.fn().mockReturnValue(chain);
    await service.findAll({ sub: 's', email: 'e', role: 'STUDENT', ageGroup: '6-9' });
    const filter = model.find.mock.calls[model.find.mock.calls.length - 1][0];
    expect(JSON.stringify(filter)).toContain('"gradeBand":{"$in":["6-9"]}');
    await service.findAll({ sub: 't', email: 'e', role: 'TEACHER' });
    expect(JSON.stringify(model.find.mock.calls[model.find.mock.calls.length - 1][0])).not.toContain('gradeBand');
  });
});

describe('ExerciseService.assignLegacyGrade', () => {
  let service: ExerciseService;
  let model: any;

  beforeEach(async () => {
    model = {
      find: jest.fn().mockReturnValue({
        select: () => ({ lean: jest.fn().mockResolvedValue([{ slug: 'a' }, { slug: 'b' }]) }),
      }),
      updateMany: jest.fn().mockResolvedValue({}),
    };
    const module = await Test.createTestingModule({
      providers: [
        ExerciseService,
        { provide: getModelToken(Exercise.name), useValue: model },
        { provide: getModelToken(Submission.name), useValue: {} },
        { provide: JudgeQueueService, useValue: {} },
        { provide: IntegrityService, useValue: {} },
        { provide: ClassAssignmentsService, useValue: { assertCanSubmitCoding: jest.fn() } },
      ],
    }).compile();
    service = module.get(ExerciseService);
  });

  it('dryRun chỉ liệt kê, không ghi', async () => {
    const res = await service.assignLegacyGrade(true);
    expect(res).toEqual({ dryRun: true, matched: 2, slugs: ['a', 'b'] });
    expect(model.updateMany).not.toHaveBeenCalled();
  });

  it('chỉ nhắm bài CODE_TEXT chưa phân nhóm, bỏ demo-dash-ex-*, gán 6-9/K6_9/PYTHON_CODE', async () => {
    await service.assignLegacyGrade(false);
    const [filter, update] = model.updateMany.mock.calls[0];
    expect(filter).toMatchObject({
      type: 'CODE_TEXT',
      gradeBand: { $exists: false },
      targetGroup: { $exists: false },
      labType: { $exists: false },
    });
    expect(filter.slug.$not.test('demo-dash-ex-loops')).toBe(true);
    expect(filter.slug.$not.test('fibonacci')).toBe(false);
    expect(update).toEqual({ $set: { gradeBand: '6-9', targetGroup: 'K6_9', labType: 'PYTHON_CODE' } });
  });
});
