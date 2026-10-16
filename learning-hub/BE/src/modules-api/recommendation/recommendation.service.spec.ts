import { RecommendationService } from './recommendation.service';
import type { MasteryService } from './mastery.service';
import type { TagMastery } from './recommendation.types';

/**
 * Model giả áp dụng đúng ngữ nghĩa `$exists` của MongoDB, để test chứng minh
 * bài DA bị loại thật sự khỏi kết quả, không chỉ kiểm tra tham số query.
 */
function makeExerciseModel(docs: any[]) {
  const applyFilter = (filter: Record<string, any> = {}) =>
    docs.filter((d) =>
      Object.entries(filter).every(([key, cond]) =>
        cond && typeof cond === 'object' && '$exists' in cond
          ? (d[key] !== undefined) === cond.$exists
          : d[key] === cond,
      ),
    );
  return {
    find: jest.fn((filter?: Record<string, any>) => ({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(applyFilter(filter)),
    })),
  };
}

const weakLoops: TagMastery = {
  tag: 'loops',
  attemptCount: 3,
  acCount: 0,
  masteryPercent: 0,
  lastAttemptStatus: 'WA',
  lastAttemptAt: new Date('2026-10-01T00:00:00Z'),
};

describe('RecommendationService — không gợi ý bài DA Lab cho học viên Python', () => {
  // Bài DA cố tình "hấp dẫn" hơn bài Python: dễ hơn và trùng đúng tag yếu,
  // nên nếu lọt vào tập ứng viên, engine sẽ chọn nó trước.
  const daExercise = {
    _id: 'da1',
    slug: 'da-sql-01',
    title: 'Đơn hàng giá trị cao',
    difficulty: 'EASY',
    tags: ['loops', 'da-lab', 'sql'],
    resource_id: 'ds-retail-ecommerce-sales-v1',
  };
  const pythonExercise = {
    _id: 'py1',
    slug: 'vong-lap-for',
    title: 'Vòng lặp for',
    difficulty: 'MEDIUM',
    tags: ['loops'],
  };

  const mastery = {
    getTagMastery: jest.fn().mockResolvedValue([weakLoops]),
    getSolvedExerciseIds: jest.fn().mockResolvedValue(new Set<string>()),
  } as unknown as MasteryService;

  it('bài có resource_id bị loại hoàn toàn khỏi mảng gợi ý', async () => {
    const model = makeExerciseModel([daExercise, pythonExercise]);
    const service = new RecommendationService(model as any, mastery);

    const result = await service.getRecommendations('u1');

    const slugs = result.map((r: any) => r.exercise.slug);
    expect(slugs).not.toContain('da-sql-01');
    expect(slugs).toContain('vong-lap-for');
    expect(model.find).toHaveBeenCalledWith({ resource_id: { $exists: false } });
  });

  it('chỉ có bài DA trùng tag thì không gợi ý gì, không trả bài DA thay thế', async () => {
    const model = makeExerciseModel([daExercise]);
    const service = new RecommendationService(model as any, mastery);

    const result = await service.getRecommendations('u1');

    expect(JSON.stringify(result)).not.toContain('da-sql-01');
  });
});
