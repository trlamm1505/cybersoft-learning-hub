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
    expect(ops).toHaveLength(12);
    expect(INITIAL_TESTER_LABS).toHaveLength(12);
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

describe('TesterLabsService.review theo rubric chuẩn 40/30/30', () => {
  const build = () => {
    const sub: any = { userId: 's1', labId: 'l1', status: 'SUBMITTED', isFinalized: false, save: jest.fn() };
    const submissionModel = { findById: jest.fn().mockResolvedValue(sub) };
    // Lab cũ trong CSDL còn rubric 10 điểm: điểm vẫn chấm theo rubric chuẩn, không theo rubric lưu trong lab.
    const labModel = { findById: () => ({ lean: async () => ({ _id: 'l1', rubricCriteria: [{ key: 'cleanup', label: 'x', maxScore: 2, kind: 'quality' }] }) }) };
    return { service: new TesterLabsService(labModel as any, submissionModel as any, {} as any), sub };
  };
  const grades = [
    { key: 'test-coverage', score: 35 },
    { key: 'bug-report-clarity', score: 25 },
    { key: 'severity-classification', score: 20 },
  ];

  it('chấm đủ 3 tiêu chí + nhận xét >= 20 ký tự -> REVIEWED, tổng thang 100', async () => {
    const { service, sub } = build();
    const res = await service.review('507f1f77bcf86cd799439011', teacher, { grades, reviewerNotes: 'Bao phủ ca biên tốt, cần phân loại severity chuẩn hơn.' });
    expect(res.summary).toMatchObject({ total: 80, max: 100 });
    expect(sub.status).toBe('REVIEWED');
    expect(sub.save).toHaveBeenCalled();
  });

  it('nhận xét dưới 20 ký tự (kể cả sau khi bỏ thẻ HTML) -> 400, không lưu', async () => {
    const { service, sub } = build();
    await expect(service.review('507f1f77bcf86cd799439011', teacher, { grades, reviewerNotes: '<b>Ổn</b>' })).rejects.toMatchObject({
      response: { code: 'E400_FEEDBACK_TOO_SHORT' },
    });
    expect(sub.save).not.toHaveBeenCalled();
  });

  it('thiếu tiêu chí hoặc dùng tiêu chí rubric cũ -> 400', async () => {
    const { service } = build();
    const notes = 'Nhận xét đủ dài cho học viên tham khảo.';
    await expect(service.review('507f1f77bcf86cd799439011', teacher, { grades: grades.slice(0, 2), reviewerNotes: notes })).rejects.toMatchObject({
      response: { code: 'E400_RUBRIC_INCOMPLETE' },
    });
    await expect(service.review('507f1f77bcf86cd799439011', teacher, { grades: [{ key: 'cleanup', score: 2 }], reviewerNotes: notes })).rejects.toMatchObject({
      response: { code: 'E400_RUBRIC_UNKNOWN' },
    });
  });
});

describe('TesterLabsService.capabilities', () => {
  const svc = () => new TesterLabsService({} as any, {} as any, {} as any);
  afterEach(() => {
    delete process.env.TESTER_LAB_PEER_REVIEW;
  });
  it('giảng viên được đọc/chấm; học viên mặc định không (không phải gọi để bị 403)', () => {
    expect(svc().capabilities({ sub: 't', role: 'TEACHER' })).toMatchObject({ canReview: true, peerReview: false });
    expect(svc().capabilities({ sub: 's', role: 'STUDENT' })).toMatchObject({ canReview: false, peerReview: false });
  });
  it('bật peer-review thì học viên được xem danh sách bài cần chấm', () => {
    process.env.TESTER_LAB_PEER_REVIEW = 'true';
    expect(svc().capabilities({ sub: 's', role: 'STUDENT' })).toMatchObject({ canReview: true, peerReview: true });
  });
});

describe('TesterLabsService.canSeeReviewQueue (cờ để FE khỏi gọi hàng chờ rồi nhận 403)', () => {
  const withClasses = (owned: boolean) => {
    const exists = jest.fn().mockResolvedValue(owned ? { _id: 'c1' } : null);
    return { svc: new TesterLabsService({} as any, {} as any, {} as any, { exists } as any), exists };
  };
  it('giảng viên chỉ thấy khi đang phụ trách lớp Tester QA chưa lưu trữ; hỏi đúng bộ lọc lớp', async () => {
    const yes = withClasses(true);
    await expect(yes.svc.canSeeReviewQueue({ sub: 't1', role: 'TEACHER' })).resolves.toBe(true);
    expect(yes.exists).toHaveBeenCalledWith({ courseKey: 'tester-qa', archived: { $ne: true }, $or: [{ teacherId: 't1' }, { teacherIds: 't1' }] });
    await expect(withClasses(false).svc.canSeeReviewQueue({ sub: 't2', role: 'TEACHER' })).resolves.toBe(false);
  });
  it('Admin luôn thấy; học viên không bao giờ thấy', async () => {
    await expect(withClasses(false).svc.canSeeReviewQueue({ sub: 'a', role: 'ADMIN' })).resolves.toBe(true);
    await expect(withClasses(true).svc.canSeeReviewQueue({ sub: 's', role: 'STUDENT' })).resolves.toBe(false);
  });
});

describe('TesterLabsService: bài nộp file xuất hiện trong hàng chờ chấm của giảng viên', () => {
  /** Model giả lưu trong bộ nhớ: create() ghi bản ghi, find() lọc theo status/invalidated như truy vấn hàng chờ thật. */
  const memoryModel = () => {
    const rows: any[] = [];
    return {
      rows,
      create: jest.fn(async (doc: any) => {
        const row = { _id: `sub${rows.length + 1}`, createdAt: new Date('2026-10-19T08:23:00Z'), ...doc };
        rows.push(row);
        return row;
      }),
      find: jest.fn((filter: any) => {
        const out = rows.filter((r) => (!filter.status || r.status === filter.status) && r.invalidated !== true);
        const q: any = { sort: () => q, limit: () => q, select: () => q, lean: async () => out };
        return q;
      }),
    };
  };

  const build = () => {
    const lab = { _id: 'lab1', labCode: 'LAB-01', title: 'Bug hunt Đăng ký / Đăng nhập', allowedFileTypes: ['xlsx', 'csv', 'pdf'], requiredColumns: [], minRows: 0 };
    const labModel = {
      findOne: () => ({ lean: async () => lab }),
      find: () => ({ select: () => ({ lean: async () => [lab] }) }),
    };
    const submissionModel = memoryModel();
    const uploadService = { store: jest.fn(async () => ({ artifactUrl: '2b636da2.xlsx', fileType: 'xlsx', fileSize: 18603 })) };
    const userModel = { find: () => ({ select: () => ({ lean: async () => [{ _id: '507f1f77bcf86cd799439011', fullName: 'Người đi làm', email: 'n1@gmail.com' }] }) }) };
    const classModel = { exists: jest.fn().mockResolvedValue(true) };
    const service = new TesterLabsService(labModel as any, submissionModel as any, uploadService as any, classModel as any, undefined, userModel as any);
    return { service, submissionModel };
  };

  it('nộp file → bản ghi kind FILE, status SUBMITTED → giảng viên phụ trách lớp Tester QA thấy trong hàng chờ kèm loại và dung lượng file', async () => {
    const { service, submissionModel } = build();
    await service.submit('LAB-01', '507f1f77bcf86cd799439011', { originalname: 'bao-cao.xlsx', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 18603, buffer: Buffer.from('x') } as any);

    expect(submissionModel.rows[0]).toMatchObject({ kind: 'FILE', status: 'SUBMITTED' });

    const queue = await service.reviewQueue(teacher);
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      kind: 'FILE',
      file: { fileType: 'xlsx', fileSize: 18603 },
      formData: null,
      student: { email: 'n1@gmail.com' },
      lab: { labCode: 'LAB-01' },
    });
    // Không lộ tên file lưu trên máy chủ.
    expect(JSON.stringify(queue[0])).not.toContain('2b636da2');
  });

  it('bài cũ thiếu trường kind vẫn được coi là bài nộp file', async () => {
    const { service, submissionModel } = build();
    submissionModel.rows.push({ _id: 'old1', labId: 'lab1', userId: '507f1f77bcf86cd799439011', status: 'SUBMITTED', fileType: 'csv', fileSize: 120, createdAt: new Date() });

    const [item] = await service.reviewQueue(teacher);
    expect(item.kind).toBe('FILE');
    expect(item.file).toEqual({ fileType: 'csv', fileSize: 120 });
  });
});
