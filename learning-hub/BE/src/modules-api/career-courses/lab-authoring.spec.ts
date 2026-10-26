import 'reflect-metadata';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { DaLabAuthoringController, DaLabAuthoringService } from '../da-labs/da-lab-authoring.service';
import { AiLabAuthoringController, AiLabAuthoringService, validatePattern } from '../ai-labs/ai-lab-authoring.service';
import { TesterLabAuthoringController, TesterLabAuthoringService } from '../tester-labs/tester-lab-authoring.service';

const teacher = { sub: 't1', email: 't@x.vn', role: 'TEACHER' } as never;
const sortChain = (value: unknown) => {
  const c: any = {};
  for (const m of ['sort', 'select']) c[m] = () => c;
  c.lean = async () => value;
  return c;
};

describe('Giảng viên tạo bài SQL Lab', () => {
  const build = (runResult: any = { status: 'OK', result: { rowCount: 3 } }, slugTaken = false) => {
    const created: any[] = [];
    const exercises = {
      exists: jest.fn().mockResolvedValue(slugTaken ? { _id: 'x' } : null),
      findOne: jest.fn(() => sortChain({ orderInTopic: 15 })),
      create: jest.fn(async (doc: any) => {
        created.push(doc);
        return { _id: 'new1', ...doc };
      }),
    };
    const grader = { run: jest.fn().mockResolvedValue(runResult) };
    return { svc: new DaLabAuthoringService(exercises as never, grader as never), exercises, grader, created };
  };
  const ok = { title: 'Top khách hàng', description: 'Liệt kê 5 khách chi nhiều nhất', solutionCode: 'SELECT 1', difficulty: 'easy', points: 12 };

  it('tạo bài vào đúng bộ da-lab-pack (để Hub và /my-class tự nhận), xếp cuối, ghi tác giả', async () => {
    const { svc, created, grader } = build();
    const r = await svc.createSqlLab(ok, teacher);
    expect(grader.run).toHaveBeenCalledWith('ds-retail-ecommerce-sales-v1', 'SELECT 1');
    expect(created[0]).toMatchObject({ type: 'SQL_LAB', topic: 'da-lab-pack', resource_id: 'ds-retail-ecommerce-sales-v1', orderInTopic: 16, authorId: 't1', difficulty: 'EASY', points: 12, solutionCode: 'SELECT 1' });
    expect(created[0].slug).toMatch(/^da-sql-/);
    expect(r).toMatchObject({ id: 'new1', type: 'SQL_LAB', orderInTopic: 16 });
    expect(JSON.stringify(r)).not.toContain('solutionCode');
  });

  it('từ chối đáp án mẫu lỗi / không trả dòng / thiếu trường / slug trùng', async () => {
    await expect(build({ status: 'SQL_ERROR', error: 'no such column' }).svc.createSqlLab(ok, teacher)).rejects.toThrow(/không chạy được/);
    await expect(build({ status: 'OK', result: { rowCount: 0 } }).svc.createSqlLab(ok, teacher)).rejects.toThrow(/không trả dòng/);
    await expect(build().svc.createSqlLab({ ...ok, solutionCode: '' }, teacher)).rejects.toThrow(BadRequestException);
    await expect(build().svc.createSqlLab({ ...ok, difficulty: 'IMPOSSIBLE' }, teacher)).rejects.toThrow(/Độ khó/);
    await expect(build().svc.createSqlLab({ ...ok, points: 500 }, teacher)).rejects.toThrow(/Điểm/);
    await expect(build({ status: 'OK', result: { rowCount: 1 } }, true).svc.createSqlLab(ok, teacher)).rejects.toThrow(ConflictException);
  });

  it('endpoint chỉ cho TEACHER/ADMIN', () => {
    expect(Reflect.getMetadata(ROLES_KEY, DaLabAuthoringController)).toEqual(['TEACHER', 'ADMIN']);
  });
});

describe('Giảng viên tạo bài AI Lab', () => {
  const build = (evalOk = true, slugTaken = false) => {
    const created: any[] = [];
    const exercises = {
      exists: jest.fn().mockResolvedValue(slugTaken ? { _id: 'x' } : null),
      findOne: jest.fn(() => sortChain({ orderInTopic: 8 })),
      create: jest.fn(async (doc: any) => {
        created.push(doc);
        return { _id: 'ai1', ...doc };
      }),
    };
    const datasets = { fetchEvaluationSet: evalOk ? jest.fn().mockResolvedValue({ items: [] }) : jest.fn().mockRejectedValue(new Error('404')) };
    return { svc: new AiLabAuthoringService(exercises as never, datasets as never), created, datasets };
  };
  const ok = {
    title: 'Prompt trả lời JSON',
    description: 'Viết prompt buộc mô hình trả JSON hợp lệ',
    resource_id: 'eval-cs-faq-basic-v1',
    techniques: [{ label: 'Yêu cầu JSON', hint: 'Nêu rõ JSON', pattern: '(json)', weight: 2 }],
  };

  it('tạo bài với đặc tả chấm (kỹ thuật, ngưỡng, ngân sách), nối vào ai-lab-pack', async () => {
    const { svc, created, datasets } = build();
    const r = await svc.createAiLab(ok, teacher);
    expect(datasets.fetchEvaluationSet).toHaveBeenCalledWith('eval-cs-faq-basic-v1');
    expect(created[0]).toMatchObject({ type: 'AI_LAB', topic: 'ai-lab-pack', orderInTopic: 9, authorId: 't1', resource_id: 'eval-cs-faq-basic-v1' });
    expect(created[0].aiLabSpec).toMatchObject({ rag: false, passQuality: 50, budget: { maxCostUsd: 0.01, maxLatencyMs: 3000 } });
    expect(created[0].aiLabSpec.techniques[0]).toMatchObject({ id: 'yeu-cau-json', pattern: '(json)', weight: 2 });
    expect(r.type).toBe('AI_LAB');
  });

  it('từ chối regex hỏng/lặp lồng nhau, thiếu kỹ thuật, evaluation set không tồn tại', async () => {
    expect(validatePattern('(json)')).toBeNull();
    expect(validatePattern('(')).toMatch(/không phải biểu thức/);
    expect(validatePattern('(a+)+')).toMatch(/lặp lồng nhau/);
    expect(validatePattern('x'.repeat(201))).toMatch(/tối đa/);
    await expect(build().svc.createAiLab({ ...ok, techniques: [] }, teacher)).rejects.toThrow(/kỹ thuật/);
    await expect(build().svc.createAiLab({ ...ok, techniques: [{ label: 'x', pattern: '(' }] }, teacher)).rejects.toThrow(/biểu thức/);
    await expect(build(false).svc.createAiLab(ok, teacher)).rejects.toThrow();
    await expect(build(true, true).svc.createAiLab(ok, teacher)).rejects.toThrow(ConflictException);
    await expect(build().svc.createAiLab({ ...ok, resource_id: '' }, teacher)).rejects.toThrow(/resource_id/);
  });

  it('endpoint chỉ cho TEACHER/ADMIN', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AiLabAuthoringController)).toEqual(['TEACHER', 'ADMIN']);
  });
});

describe('Giảng viên tạo bài Tester Lab', () => {
  const build = (taken = false) => {
    const created: any[] = [];
    const labs = {
      exists: jest.fn().mockResolvedValue(taken ? { _id: 'x' } : null),
      create: jest.fn(async (doc: any) => {
        created.push(doc);
        return { _id: 'tl1', ...doc };
      }),
    };
    return { svc: new TesterLabAuthoringService(labs as never), created };
  };
  const ok = {
    labCode: 'lab-13',
    title: 'Kiểm thử form thanh toán',
    description: 'Thiết kế test case cho form thanh toán',
    category: 'test_case_design',
    rubricCriteria: [
      { label: 'Độ bao phủ', maxScore: 6, kind: 'quality' },
      { label: 'Phân loại mức độ', maxScore: 4, kind: 'severity' },
    ],
  };

  it('tạo lab với mã chuẩn hóa HOA và rubric có khóa tự sinh', async () => {
    const { svc, created } = build();
    const r = await svc.createLab(ok, teacher);
    expect(created[0]).toMatchObject({ labCode: 'LAB-13', category: 'TEST_CASE_DESIGN' });
    expect(created[0].rubricCriteria.map((c: any) => c.key)).toEqual(['do-bao-phu', 'phan-loai-muc-do']);
    expect(r).toMatchObject({ labCode: 'LAB-13', criteriaCount: 2, maxScore: 10 });
  });

  it('từ chối mã sai, loại sai, rubric rỗng/trùng khóa/điểm sai, mã đã tồn tại', async () => {
    await expect(build().svc.createLab({ ...ok, labCode: 'x' }, teacher)).rejects.toThrow(/Mã lab/);
    await expect(build().svc.createLab({ ...ok, category: 'KHAC' }, teacher)).rejects.toThrow(/Loại lab/);
    await expect(build().svc.createLab({ ...ok, rubricCriteria: [] }, teacher)).rejects.toThrow(/Rubric/);
    await expect(build().svc.createLab({ ...ok, rubricCriteria: [{ label: 'A', maxScore: 5 }, { label: 'A', maxScore: 5 }] }, teacher)).rejects.toThrow(/trùng/);
    await expect(build().svc.createLab({ ...ok, rubricCriteria: [{ label: 'A', maxScore: 0 }] }, teacher)).rejects.toThrow(/điểm tối đa/);
    await expect(build(true).svc.createLab(ok, teacher)).rejects.toThrow(ConflictException);
  });

  it('endpoint chỉ cho TEACHER/ADMIN', () => {
    expect(Reflect.getMetadata(ROLES_KEY, TesterLabAuthoringController)).toEqual(['TEACHER', 'ADMIN']);
  });
});
