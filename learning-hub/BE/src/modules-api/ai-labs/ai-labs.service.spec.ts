import { AI_LAB_HISTORY_LIMIT, AiLabsService } from './ai-labs.service';

const lean = (value: unknown) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const LAB = {
  _id: 'ex-ai-1',
  slug: 'ai-lab-01',
  points: 10,
  resource_id: 'eval-cs-faq-basic-v1',
  aiLabSpec: {
    rag: false,
    techniques: [],
    passQuality: 50,
    budget: { maxCostUsd: 1, maxLatencyMs: 9999 },
  },
};

const gradeResult = (score: number) => ({
  status: 'PASSED',
  qualityScore: score * 10,
  cost: 0.001,
  latency: 500,
  score,
  maxScore: 10,
  penalties: [],
  techniques: [],
  structureWarning: null,
  normalized: {
    prompt: `prompt ${score}`,
    model: 'gemini-2.5-flash',
    config: { temperature: 0, maxTokens: 256 },
  },
  runManifest: { seed: 'x', promptSha256: `hash-${score}` },
});

describe('AiLabsService.submit — lịch sử thí nghiệm có giới hạn', () => {
  let exerciseModel: { findOne: jest.Mock };
  let submissionModel: {
    findOne: jest.Mock;
    create: jest.Mock;
    updateOne: jest.Mock;
    find: jest.Mock;
  };
  let userModel: { find: jest.Mock };
  let grader: { grade: jest.Mock };
  let service: AiLabsService;

  beforeEach(() => {
    exerciseModel = { findOne: jest.fn(() => lean(LAB)) };
    submissionModel = {
      findOne: jest.fn(() => lean(null)),
      create: jest.fn(async (doc) => ({ _id: 'sub-1', ...doc })),
      updateOne: jest.fn().mockResolvedValue({}),
      find: jest.fn(),
    };
    userModel = { find: jest.fn() };
    grader = { grade: jest.fn() };
    service = new AiLabsService(
      exerciseModel as any,
      submissionModel as any,
      {} as any,
      grader as any,
      userModel as any,
    );
  });

  it('lần đầu: tạo bản ghi với tóm tắt và lịch sử 1 lần chạy', async () => {
    grader.grade.mockResolvedValue(gradeResult(7));

    const res = await service.submit('ai-lab-01', {}, 'u1');

    expect(submissionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        totalAttempts: 1,
        bestQualityScore: 70,
        latestSubmission: expect.objectContaining({
          promptHash: 'hash-7',
          score: 7,
        }),
        history: [
          expect.objectContaining({
            promptHash: 'hash-7',
            score: 7,
            runManifest: { seed: 'x', promptSha256: 'hash-7' },
            createdAt: expect.any(Date),
          }),
        ],
      }),
    );
    expect(res).toMatchObject({
      totalAttempts: 1,
      best: { score: 7 },
      submissionId: 'sub-1',
    });
    expect(res.history).toHaveLength(1);
    expect(res).not.toHaveProperty('normalized');
  });

  it('lần sau: $push lịch sử có $slice, giữ best cũ khi điểm thấp hơn, tăng totalAttempts', async () => {
    submissionModel.findOne.mockReturnValue(
      lean({
        _id: 'sub-1',
        score: 9,
        qualityScore: 90,
        totalAttempts: 3,
        bestQualityScore: 90,
        best: { score: 9, prompt: 'cũ' },
        history: [
          { promptHash: 'h1' },
          { promptHash: 'h2' },
          { promptHash: 'h3' },
        ],
      }),
    );
    grader.grade.mockResolvedValue(gradeResult(4));

    const res = await service.submit('ai-lab-01', {}, 'u1');

    expect(submissionModel.create).not.toHaveBeenCalled();
    const [filter, update] = submissionModel.updateOne.mock.calls[0];
    expect(filter).toEqual({ _id: 'sub-1' });
    expect(update.$set).toMatchObject({
      score: 4,
      totalAttempts: 4,
      bestQualityScore: 90,
      best: { score: 9, prompt: 'cũ' },
      latestSubmission: expect.objectContaining({ score: 4 }),
    });
    expect(update.$push.history).toEqual({
      $each: [expect.objectContaining({ promptHash: 'hash-4' })],
      $slice: -AI_LAB_HISTORY_LIMIT,
    });
    expect(res.history.map((h: any) => h.promptHash)).toEqual([
      'h1',
      'h2',
      'h3',
      'hash-4',
    ]);
  });

  it(`lịch sử không vượt quá ${AI_LAB_HISTORY_LIMIT} lần: bỏ lần cũ nhất`, async () => {
    const full = Array.from({ length: AI_LAB_HISTORY_LIMIT }, (_, i) => ({
      promptHash: `old-${i}`,
    }));
    submissionModel.findOne.mockReturnValue(
      lean({
        _id: 'sub-1',
        score: 5,
        totalAttempts: 12,
        best: { score: 5 },
        history: full,
      }),
    );
    grader.grade.mockResolvedValue(gradeResult(8));

    const res = await service.submit('ai-lab-01', {}, 'u1');

    expect(res.history).toHaveLength(AI_LAB_HISTORY_LIMIT);
    expect(res.history[0].promptHash).toBe('old-1');
    expect(res.history[AI_LAB_HISTORY_LIMIT - 1].promptHash).toBe('hash-8');
    expect(res).toMatchObject({
      totalAttempts: 13,
      best: { score: 8 },
      bestQualityScore: 80,
    });
  });

  it('bản ghi cũ (attemptCount, chưa có lịch sử) được chuyển sang cấu trúc mới', async () => {
    submissionModel.findOne.mockReturnValue(
      lean({
        _id: 'sub-1',
        score: 6,
        qualityScore: 60,
        attemptCount: 2,
        best: { score: 6 },
      }),
    );
    grader.grade.mockResolvedValue(gradeResult(3));

    const res = await service.submit('ai-lab-01', {}, 'u1');

    const update = submissionModel.updateOne.mock.calls[0][1];
    expect(update.$set.totalAttempts).toBe(3);
    expect(update.$set.bestQualityScore).toBe(60);
    expect(update.$unset).toEqual({ attemptCount: '' });
    expect(res.history).toHaveLength(1);
  });

  it('getMySubmission trả lịch sử và totalAttempts (kể cả bản ghi cũ)', async () => {
    submissionModel.findOne.mockReturnValue(
      lean({
        _id: 'sub-1',
        userId: 'u1',
        attemptCount: 2,
        score: 5,
        updatedAt: new Date(),
      }),
    );

    const mine = await service.getMySubmission('ai-lab-01', 'u1');

    expect(mine).toMatchObject({
      submissionId: 'sub-1',
      totalAttempts: 2,
      history: [],
    });
    expect(mine).not.toHaveProperty('userId');
  });

  it('giảng viên xem danh sách không kèm run manifest và lịch sử chi tiết', async () => {
    const chain = lean([
      {
        _id: 's1',
        userId: 'u1',
        exerciseSlug: 'ai-lab-01',
        score: 8,
        maxScore: 10,
      },
    ]);
    submissionModel.find.mockReturnValue(chain);
    userModel.find.mockReturnValue(lean([{ _id: 'u1', fullName: 'An' }]));

    const rows = await service.listSubmissionsForStaff();

    expect(chain.select).toHaveBeenCalledWith('-runManifest -history');
    expect(rows[0]).toMatchObject({
      exerciseSlug: 'ai-lab-01',
      totalAttempts: 1,
      student: { fullName: 'An' },
    });
  });
});
