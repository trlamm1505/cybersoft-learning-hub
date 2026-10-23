import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException } from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { Submission } from '../../modules-system/database/schemas/submission.schema';
import { IntegrityService } from '../integrity/integrity.service';
import { ClassAssignmentsService } from '../class-assignments/class-assignments.service';
import { JudgeQueueService } from '../judge/judge-queue.service';
import { isOnPlaygroundTrack, isSqlOrLabItem, playgroundBandOf, playgroundFilter, playgroundStatuses } from './playground-catalog';

describe('playgroundStatuses: mở khóa tuần tự', () => {
  const keys = ['a', 'b', 'c', 'd', 'e'];
  it('chưa làm gì: bài #1 mở, các bài sau khóa', () => {
    expect(playgroundStatuses(keys, new Set())).toEqual(['available', 'locked', 'locked', 'locked', 'locked']);
  });
  it('xong #1 và #2: #3 mở, #4 #5 khóa; bài đã xong luôn xem lại được (completed, không khóa)', () => {
    expect(playgroundStatuses(keys, new Set(['a', 'b']))).toEqual(['completed', 'completed', 'available', 'locked', 'locked']);
  });
  it('dữ liệu cũ nhảy cóc (xong #3 mà chưa xong #1, #2): #1 mở, #2 khóa, #3 vẫn completed, #4 khóa', () => {
    expect(playgroundStatuses(keys, new Set(['c']))).toEqual(['available', 'locked', 'completed', 'locked', 'locked']);
  });
  it('xong hết: không còn bài nào mở hay khóa', () => {
    expect(playgroundStatuses(keys, new Set(keys))).toEqual(['completed', 'completed', 'completed', 'completed', 'completed']);
  });
  it('luôn có tối đa MỘT bài "available" và bài #1 chưa làm không bao giờ khóa', () => {
    for (let mask = 0; mask < 1 << keys.length; mask++) {
      const solved = new Set(keys.filter((_, i) => mask & (1 << i)));
      const st = playgroundStatuses(keys, solved);
      expect(st.filter((s) => s === 'available').length).toBeLessThanOrEqual(1);
      if (!solved.has('a')) expect(st[0]).toBe('available');
    }
  });
});

describe('danh mục Playground: bài nào thuộc lộ trình', () => {
  const day14 = { type: 'CODE_TEXT', topic: 'python-fundamentals', orderInTopic: 3, tags: ['loops'] };
  it('khối chỉ nhận 6-9 và 10-12', () => {
    expect(playgroundBandOf('6-9')).toBe('6-9');
    expect(playgroundBandOf('10-12')).toBe('10-12');
    expect(playgroundBandOf('3-5')).toBeNull();
    expect(playgroundBandOf('CAREER_ADULT')).toBeNull();
    expect(playgroundBandOf(undefined)).toBeNull();
  });
  it('bài lộ trình chuẩn đúng khối thì thuộc; sai chủ đề / thiếu thứ tự / bankOnly / SQL / Lab thì không', () => {
    expect(isOnPlaygroundTrack(day14, '6-9')).toBe(true);
    expect(isOnPlaygroundTrack(day14, '10-12')).toBe(false);
    expect(isOnPlaygroundTrack({ ...day14, orderInTopic: undefined }, '6-9')).toBe(false);
    expect(isOnPlaygroundTrack({ ...day14, bankOnly: true }, '6-9')).toBe(false);
    expect(isOnPlaygroundTrack({ ...day14, topic: 'sql' }, '6-9')).toBe(false);
    expect(isOnPlaygroundTrack({ ...day14, tags: ['sql'] }, '6-9')).toBe(false);
    expect(isOnPlaygroundTrack({ ...day14, labType: 'DATA_SQL' }, '6-9')).toBe(false);
    expect(isOnPlaygroundTrack({ ...day14, resource_id: 'ds-1' }, '6-9')).toBe(false);
  });
  it('bộ lọc Mongo luôn loại bankOnly, bài Lab (resource_id), SQL và đòi topic + orderInTopic', () => {
    const f = JSON.stringify(playgroundFilter('6-9'));
    expect(f).toContain('"bankOnly":{"$ne":true}');
    expect(f).toContain('"resource_id":{"$exists":false}');
    expect(f).toContain('"topic":"python-fundamentals"');
    expect(f).toContain('"orderInTopic":{"$gte":1}');
    expect(f).toContain('"tags":{"$nin":["sql"');
    expect(JSON.stringify(playgroundFilter('10-12'))).toContain('"topic":"algorithm-contest-prep"');
  });
  it('isSqlOrLabItem nhận ra SQL / Data / AI / Tester Lab', () => {
    expect(isSqlOrLabItem({ slug: 'demo-dash-ex-sql', topic: 'sql' })).toBe(true);
    expect(isSqlOrLabItem({ slug: 'bai-1-select-where-sql' })).toBe(true);
    expect(isSqlOrLabItem({ slug: 'da-sql-01', resource_id: 'ds-1', tags: ['da-lab'] })).toBe(true);
    expect(isSqlOrLabItem({ slug: 'career-x', labType: 'AI_PROMPT' })).toBe(true);
    expect(isSqlOrLabItem({ slug: 'day14-chao-hoi-theo-ten', topic: 'python-fundamentals', tags: ['strings'] })).toBe(false);
  });
});

describe('ExerciseService: /exercises/playground và khóa nộp bài', () => {
  const track = Array.from({ length: 5 }, (_, i) => ({
    _id: `id${i + 1}`,
    slug: `day14-bai-${i + 1}`,
    title: `Bài ${i + 1}`,
    type: 'CODE_TEXT',
    topic: 'python-fundamentals',
    orderInTopic: i + 1,
    gradeBand: '6-9',
    difficulty: 'EASY',
    tags: [],
  }));
  let solvedIds: string[];
  let aggregate: jest.Mock;
  let service: ExerciseService;
  let exerciseModel: any;
  let submissions: { distinct: jest.Mock; create: jest.Mock };
  const student = { sub: 'u1', email: 's@x', role: 'STUDENT', ageGroup: '6-9' } as any;
  const full = (n: number) => ({ ...track[n - 1], testCases: [], hiddenTestCases: [] });

  beforeEach(async () => {
    solvedIds = [];
    aggregate = jest.fn().mockResolvedValue(track.map((t) => ({ ...t })));
    exerciseModel = { aggregate, findOne: jest.fn() };
    submissions = {
      distinct: jest.fn().mockImplementation(async (_f: string, filter: any) => solvedIds.filter((id) => filter.exerciseId.$in.includes(id))),
      create: jest.fn().mockResolvedValue({ _id: 'sub1' }),
    };
    const mod = await Test.createTestingModule({
      providers: [
        ExerciseService,
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
        { provide: getModelToken(Submission.name), useValue: submissions },
        { provide: JudgeQueueService, useValue: { enqueue: jest.fn() } },
        { provide: IntegrityService, useValue: { evaluate: jest.fn().mockResolvedValue({}) } },
        { provide: ClassAssignmentsService, useValue: { assertCanSubmitCoding: jest.fn() } },
      ],
    }).compile();
    service = mod.get(ExerciseService);
  });

  const select = (doc: unknown) => ({ select: () => ({ lean: async () => doc }), lean: async () => doc });

  it('chưa làm gì: 0/5, #1 mở, #2..#5 khóa, đánh số #1..#N', async () => {
    const res = await service.playground(student);
    expect(res).toMatchObject({ band: '6-9', topic: 'python-fundamentals', total: 5, completed: 0, nextSlug: 'day14-bai-1' });
    expect(res.exercises.map((e: any) => [e.order, e.status])).toEqual([[1, 'available'], [2, 'locked'], [3, 'locked'], [4, 'locked'], [5, 'locked']]);
  });

  it('"đã hoàn thành" chỉ tính AC luyện tập tự do: bỏ bài giao của lớp (assignmentId) và bài nộp nhảy cóc cũ (outOfSequence)', async () => {
    await service.playground(student);
    const filter = submissions.distinct.mock.calls[0][1];
    expect(filter).toMatchObject({ userId: 'u1', status: 'AC', assignmentId: { $exists: false }, outOfSequence: { $ne: true } });
  });

  it('xong #1 và #2 (seed): 2/5, #3 mở, #4 #5 khóa', async () => {
    solvedIds = ['id1', 'id2'];
    const res = await service.playground(student);
    expect(res).toMatchObject({ total: 5, completed: 2, nextSlug: 'day14-bai-3' });
    expect(res.exercises.map((e: any) => e.status)).toEqual(['completed', 'completed', 'available', 'locked', 'locked']);
  });

  it('học viên không nhận khối từ client; chỉ lấy theo tài khoản (3-5 / người đi làm: danh sách rỗng)', async () => {
    const kid = await service.playground({ ...student, ageGroup: '3-5' }, '10-12');
    expect(kid).toMatchObject({ band: null, total: 0, exercises: [] });
    expect(aggregate).not.toHaveBeenCalled(); // không truy vấn bài nào cho học viên không có lộ trình
    await service.playground(student, '10-12'); // tham số band bị bỏ qua với học viên: vẫn là lộ trình 6-9 của tài khoản
    expect(JSON.stringify(aggregate.mock.calls[0][0])).toContain('python-fundamentals');
  });

  it('giảng viên chọn khối bằng band, không bị khóa, không có tiến độ cá nhân; band lạ → 400', async () => {
    const res = await service.playground({ sub: 't1', email: 't@x', role: 'TEACHER' } as any, '6-9');
    expect(res.exercises.every((e: any) => e.status === 'available')).toBe(true);
    expect(res.completed).toBe(0);
    await expect(service.playground({ sub: 't1', email: 't@x', role: 'ADMIN' } as any, '3-5')).rejects.toMatchObject({ response: { code: 'E400_INVALID_BAND' } });
    expect(submissions.distinct).not.toHaveBeenCalled();
  });

  it('nộp nhảy cóc bị chặn: bài #3 khi chưa xong #1 → 403 E403_EXERCISE_LOCKED, không tạo bài nộp', async () => {
    exerciseModel.findOne.mockReturnValue(select(full(3)));
    await expect(service.submitCode('day14-bai-3', { code: 'print(1)' } as any, 'u1', student)).rejects.toMatchObject({
      response: { code: 'E403_EXERCISE_LOCKED', message: expect.stringContaining('bài #1') },
    });
    expect(submissions.create).not.toHaveBeenCalled();
  });

  it('nộp bài đang mở (#1) và bài đã xong (làm lại) được; hoàn thành #1 thì #2 nộp được', async () => {
    exerciseModel.findOne.mockReturnValue(select(full(1)));
    await expect(service.submitCode('day14-bai-1', { code: 'print(1)' } as any, 'u1', student)).resolves.toMatchObject({ submissionId: expect.any(String) });
    solvedIds = ['id1'];
    exerciseModel.findOne.mockReturnValue(select(full(2)));
    await expect(service.submitCode('day14-bai-2', { code: 'print(1)' } as any, 'u1', student)).resolves.toBeDefined();
    exerciseModel.findOne.mockReturnValue(select(full(1)));
    await expect(service.submitCode('day14-bai-1', { code: 'print(1)' } as any, 'u1', student)).resolves.toBeDefined();
    exerciseModel.findOne.mockReturnValue(select(full(3)));
    await expect(service.submitCode('day14-bai-3', { code: 'print(1)' } as any, 'u1', student)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('khóa không áp dụng khi nộp bài giao của lớp (assignmentId), bài ngoài lộ trình, hay giảng viên', async () => {
    exerciseModel.findOne.mockReturnValue(select(full(4)));
    await expect(service.submitCode('day14-bai-4', { code: 'x', assignmentId: 'asg1' } as any, 'u1', student)).resolves.toBeDefined();
    const outside = { ...full(4), slug: 'tinh-tong-hai-so-nguyen', topic: undefined, orderInTopic: undefined };
    exerciseModel.findOne.mockReturnValue(select(outside));
    await expect(service.submitCode(outside.slug, { code: 'x' } as any, 'u1', student)).resolves.toBeDefined();
    exerciseModel.findOne.mockReturnValue(select(full(5)));
    await expect(service.submitCode('day14-bai-5', { code: 'x' } as any, 't1', { sub: 't1', email: 't@x', role: 'TEACHER' } as any)).resolves.toBeDefined();
  });

  it('GET /exercises của học viên 6-9 chỉ dùng bộ lọc lộ trình chuẩn (không SQL, không bankOnly, không bài cũ)', async () => {
    await service.findAll(student);
    const match = JSON.stringify(aggregate.mock.calls.at(-1)![0][0].$match);
    expect(match).toContain('"topic":"python-fundamentals"');
    expect(match).toContain('"orderInTopic":{"$gte":1}');
    expect(match).toContain('"bankOnly":{"$ne":true}');
  });
});
