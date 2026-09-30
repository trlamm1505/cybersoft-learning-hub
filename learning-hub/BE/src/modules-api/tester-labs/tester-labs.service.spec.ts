import { ForbiddenException } from '@nestjs/common';
import { INITIAL_TESTER_LABS } from '../../data/initial-tester-labs';
import { TesterLabsService } from './tester-labs.service';

const teacher = { sub: 't1', role: 'TEACHER' };
const student = { sub: 's1', role: 'STUDENT' };

describe('TesterLabsService.onModuleInit (auto-seed)', () => {
  it('upsert theo labCode với $setOnInsert — không ghi đè lab đã có', async () => {
    const labModel = { bulkWrite: jest.fn().mockResolvedValue({}) };
    const service = new TesterLabsService(labModel as any, {} as any, {} as any);

    await service.onModuleInit();
    await service.onModuleInit();

    const ops = labModel.bulkWrite.mock.calls[0][0];
    expect(ops).toHaveLength(10);
    expect(INITIAL_TESTER_LABS).toHaveLength(10);
    for (const op of ops) {
      expect(op.updateOne.upsert).toBe(true);
      expect(op.updateOne.filter).toEqual({ labCode: expect.any(String) });
      expect(Object.keys(op.updateOne.update)).toEqual(['$setOnInsert']);
    }
  });
});

describe('TesterLabsService access control', () => {
  const OLD_ENV = process.env.TESTER_LAB_PEER_REVIEW;
  const submission = (userId: string) => ({
    userId,
    labId: 'l1',
    artifactUrl: 'abc.csv',
    save: jest.fn(),
  });

  const build = (sub: any) => {
    const query: any = { sort: () => query, select: jest.fn(() => query), lean: async () => [] };
    const submissionModel = { findById: jest.fn().mockResolvedValue(sub), find: jest.fn(() => query) };
    const labModel = { findOne: () => ({ lean: async () => ({ _id: 'l1' }) }) };
    const service = new TesterLabsService(labModel as any, submissionModel as any, {} as any);
    return { service, query };
  };

  afterEach(() => {
    process.env.TESTER_LAB_PEER_REVIEW = OLD_ENV;
  });

  it('học viên không xem được danh sách bài cần chấm khi tắt peer-review', async () => {
    delete process.env.TESTER_LAB_PEER_REVIEW;
    const { service } = build(null);

    await expect(service.listReviewable('LAB-01', student)).rejects.toThrow(ForbiddenException);
  });

  it('học viên không chấm được bài khi tắt peer-review', async () => {
    delete process.env.TESTER_LAB_PEER_REVIEW;
    const { service } = build(submission('other'));

    await expect(service.review('507f1f77bcf86cd799439011', student, { grades: [] })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('học viên không tải được artifact của người khác (IDOR)', async () => {
    delete process.env.TESTER_LAB_PEER_REVIEW;
    const { service } = build(submission('other'));

    await expect(service.getArtifactPath('507f1f77bcf86cd799439011', student)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('chủ bài và giảng viên tải được artifact', async () => {
    const owner = build(submission('s1'));
    const other = build(submission('s1'));

    await expect(owner.service.getArtifactPath('507f1f77bcf86cd799439011', student)).resolves.toContain('abc.csv');
    await expect(other.service.getArtifactPath('507f1f77bcf86cd799439011', teacher)).resolves.toContain('abc.csv');
  });

  it('peer-review bật: học viên thấy danh sách nhưng bị ẩn người nộp và tên file', async () => {
    process.env.TESTER_LAB_PEER_REVIEW = 'true';
    const { service, query } = build(null);

    await service.listReviewable('LAB-01', student);

    expect(query.select).toHaveBeenCalledWith('-userId -artifactUrl -reviewerId');
  });

  it('giảng viên xem đầy đủ, không bị ẩn trường', async () => {
    const { service, query } = build(null);

    await service.listReviewable('LAB-01', teacher);

    expect(query.select).not.toHaveBeenCalled();
  });

  it('không ai được tự chấm bài của mình', async () => {
    const { service } = build(submission('t1'));

    await expect(service.review('507f1f77bcf86cd799439011', teacher, { grades: [] })).rejects.toThrow(
      ForbiddenException,
    );
  });
});
