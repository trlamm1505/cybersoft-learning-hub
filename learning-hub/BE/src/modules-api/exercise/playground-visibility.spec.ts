import { AuthoringService } from '../authoring/authoring.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import type { MasteryService } from '../recommendation/mastery.service';

/** Day 31: mọi API dành cho học viên 6-9 / 10-12 dùng CÙNG một lộ trình Playground chuẩn (không SQL, không Ngân hàng đề). */

describe('AuthoringService.findAll cho học viên Khối 6-9 / 10-12', () => {
  const lessons = [
    { _id: 'l1', slug: 'day14-bai-1', type: 'coding', status: 'published', authorId: 'teacher-1' },
    { _id: 'l2', slug: 'tinh-tong-hai-so-nguyen', type: 'coding', status: 'published', authorId: 'teacher-1' }, // bài cũ ngoài lộ trình
    { _id: 'l3', slug: 'bai-1-select-where-sql', type: 'coding', status: 'published', authorId: 'teacher-1' }, // SQL
    { _id: 'l4', slug: 'on-tap-python', type: 'quiz', status: 'published', authorId: 'teacher-1' },
    { _id: 'l5', slug: 'on-tap-sql', type: 'quiz', status: 'published', authorId: 'teacher-1' }, // quiz SQL
  ];
  const build = () => {
    const lessonModel: any = { find: jest.fn(() => ({ sort: () => ({ lean: () => ({ exec: () => Promise.resolve(lessons) }) }) })) };
    const exerciseModel: any = {
      find: jest.fn(() => ({ select: () => ({ lean: () => Promise.resolve([{ slug: 'day14-bai-1' }, { slug: 'day14-bai-2' }]) }) })),
      aggregate: jest.fn().mockResolvedValue([{ _id: 'e2', slug: 'day14-bai-2', title: 'Bài 2', description: 'd', difficulty: 'EASY', testCaseCount: 3 }]),
    };
    return { svc: new AuthoringService(lessonModel, exerciseModel, {} as never), exerciseModel };
  };

  it('chỉ giữ bài coding thuộc lộ trình chuẩn của khối; bỏ bài cũ ngoài lộ trình và mọi bài/quiz SQL', async () => {
    const { svc, exerciseModel } = build();
    const slugs = ((await svc.findAll(true, { ageGroup: '6-9' })) as any[]).map((l) => l.slug).sort();
    expect(slugs).toEqual(['day14-bai-1', 'day14-bai-2', 'on-tap-python']);
    const match = JSON.stringify(exerciseModel.aggregate.mock.calls[0][0][0].$match);
    expect(match).toContain('"topic":"python-fundamentals"');
    expect(match).toContain('"bankOnly":{"$ne":true}');
  });

  it('khối 10-12 dùng lộ trình thuật toán; giảng viên vẫn nhận đủ (không bị lọc)', async () => {
    const { svc, exerciseModel } = build();
    await svc.findAll(true, { ageGroup: '10-12' });
    expect(JSON.stringify(exerciseModel.aggregate.mock.calls[0][0][0].$match)).toContain('"topic":"algorithm-contest-prep"');
    const staff = build();
    const all = (await staff.svc.findAll(false)) as any[];
    expect(all.map((l) => l.slug)).toEqual(expect.arrayContaining(['tinh-tong-hai-so-nguyen', 'bai-1-select-where-sql', 'on-tap-sql']));
  });
});

describe('RecommendationService: tiến độ và gợi ý bám đúng lộ trình Playground', () => {
  const track = [1, 2, 3, 4, 5].map((n) => ({
    _id: `id${n}`, slug: `day14-bai-${n}`, title: `Bài ${n}`, difficulty: 'EASY', tags: ['loops'], orderInTopic: n,
  }));
  const trackModel = (docs = track): { find: jest.Mock } => ({
    find: jest.fn((..._a: unknown[]) => ({ select: () => ({ lean: () => Promise.resolve([...docs].reverse()) }) })), // trả ngược để kiểm tra có sắp lại
  });
  const mastery = (solved: string[], attempts: Array<{ exerciseId: string; status: string }> = [], classSolved: string[] = solved) =>
    ({
      getGradedAttempts: jest.fn().mockResolvedValue(attempts),
      getTagMastery: jest.fn().mockResolvedValue([]),
      getSolvedExerciseIds: jest.fn().mockResolvedValue(new Set(classSolved)),
      getPlaygroundSolvedIds: jest.fn().mockResolvedValue(new Set(solved)), // chỉ AC luyện tập tự do (xem PRACTICE_AC_FILTER)
    }) as unknown as MasteryService;

  it('getStats: mẫu số = số bài của lộ trình (N), đã giải chỉ đếm bài trong lộ trình', async () => {
    const attempts = [
      { exerciseId: 'id1', status: 'AC' },
      { exerciseId: 'id2', status: 'AC' },
      { exerciseId: 'id4', status: 'AC' }, // AC của bài giao lớp (không tính ở Playground): không làm đổi X/N
      { exerciseId: 'bai-cu-ngoai-lo-trinh', status: 'AC' }, // bài lớp giao ngoài lộ trình: không làm đổi X/N
      { exerciseId: 'id3', status: 'WA' },
    ];
    const model = trackModel();
    const service = new RecommendationService(model as never, mastery(['id1', 'id2'], attempts));
    const stats = await service.getStats('u1', '6-9');
    expect(stats.totalExercises).toBe(5);
    expect(stats.solvedExercises).toBe(2);
    expect(stats.submissions.ac).toBe(4); // số lượt nộp theo kết quả vẫn tính đủ mọi lượt
    expect(JSON.stringify(model.find.mock.calls[0][0])).toContain('"topic":"python-fundamentals"');
  });

  it('getRecommendations: chỉ gợi ý bài đang mở khóa (không gợi ý bài khóa phía sau)', async () => {
    const service = new RecommendationService(trackModel() as never, mastery(['id1', 'id2'], [], ['id1', 'id2', 'id3', 'id4'])); // AC lớp của #3, #4 không mở khóa Playground
    const result = await service.getRecommendations('u1', '6-9');
    const slugs = result.map((r) => r.exercise.slug);
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs.every((s) => s === 'day14-bai-3')).toBe(true); // #3 là bài mở khóa duy nhất chưa giải
  });

  it('khối không có lộ trình (người đi làm) giữ cách tính cũ: không áp bộ lọc Playground', async () => {
    const model: any = { find: jest.fn(() => ({ select: () => ({ lean: () => Promise.resolve([]) }) })) };
    const service = new RecommendationService(model, mastery([]));
    await service.getStats('u1', 'CAREER_ADULT');
    expect(JSON.stringify(model.find.mock.calls[0][0])).not.toContain('orderInTopic');
  });
});

describe('bài mẫu demo-dash-*: ẩn khỏi mọi danh sách chọn bài của giảng viên', () => {
  it('bộ lọc loại slug demo-dash-* nhưng vẫn cho bài thật', () => {
    const { DEMO_EXERCISE_SLUG, notDemoExercise } = jest.requireActual('./playground-catalog');
    expect(notDemoExercise).toEqual({ $not: DEMO_EXERCISE_SLUG });
    expect(DEMO_EXERCISE_SLUG.test('demo-dash-ex-other')).toBe(true);
    expect(DEMO_EXERCISE_SLUG.test('day14-chao-hoi-theo-ten')).toBe(false);
    expect(DEMO_EXERCISE_SLUG.test('my-demo-dash-ex')).toBe(false);
  });
});
