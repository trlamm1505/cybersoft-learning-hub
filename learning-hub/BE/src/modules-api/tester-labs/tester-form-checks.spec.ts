import { BadRequestException } from '@nestjs/common';
import { runFormChecks, sanitizeTesterForm } from './tester-form-checks';
import { TesterLabsService } from './tester-labs.service';

const tc = (code: string, description: string, input = 'x', expected = 'y') => ({ code, description, input, expected });
const bug = { title: 'Đăng nhập sai vẫn vào được', steps: '1. Mở trang đăng nhập\n2. Nhập sai mật khẩu\n3. Bấm Đăng nhập', expected: 'Báo lỗi', actual: 'Vào trang chủ', severity: 'HIGH' };

describe('sanitizeTesterForm', () => {
  it('cắt độ dài, bỏ dòng rỗng, ép severity hợp lệ', () => {
    const f = sanitizeTesterForm({
      testCases: [tc('TC1', 'a'.repeat(5000)), { code: '', description: '', input: '', expected: '' }],
      bugReports: [{ ...bug, severity: 'HACK' }],
    });
    expect(f.testCases).toHaveLength(1);
    expect(f.testCases[0].description.length).toBe(1000);
    expect(f.bugReports[0].severity).toBe('MEDIUM');
  });

  it('không nhận dữ liệu rỗng hoặc quá số lượng', () => {
    expect(() => sanitizeTesterForm({})).toThrow(BadRequestException);
    expect(() => sanitizeTesterForm({ testCases: Array.from({ length: 101 }, (_, i) => tc(`T${i}`, 'd')) })).toThrow(/Tối đa/);
    expect(() => sanitizeTesterForm({ testCases: 'x', bugReports: 5 })).toThrow(BadRequestException);
  });
});

describe('runFormChecks (nhận xét sơ bộ)', () => {
  const byId = (r: ReturnType<typeof runFormChecks>) => Object.fromEntries(r.map((c) => [c.check, c]));

  it('đủ số test case + bắt được các từ khóa tình huống biên', () => {
    const form = sanitizeTesterForm({
      testCases: [
        tc('TC01', 'Để trống email', '', 'Báo lỗi'),
        tc('TC02', 'Mật khẩu dài nhất 32 ký tự (giá trị biên)'),
        tc('TC03', 'Email sai định dạng'),
        tc('TC04', 'Nhập <script> vào họ tên (ký tự đặc biệt)'),
        tc('TC05', 'Đăng ký email đã tồn tại (trùng)'),
      ].map((t) => ({ ...t, input: t.input || '(trống)' })),
      bugReports: [bug],
    });
    const r = byId(runFormChecks(form));
    expect(r['test-case-count'].passed).toBe(true);
    for (const id of ['edge-empty', 'edge-boundary', 'edge-invalid', 'edge-special', 'edge-duplicate']) expect(r[id].passed).toBe(true);
    expect(r['edge-long'].passed).toBe(true); // "dài nhất" cũng là chuỗi dài
    const none = byId(runFormChecks(sanitizeTesterForm({ testCases: [tc('T1', 'Đăng nhập đúng')] })));
    expect(none['edge-empty'].passed).toBe(false);
    expect(none['edge-special'].message).toContain('Chưa thấy');
    expect(r['bug-report-1'].passed).toBe(true);
  });

  it('thiếu test case, thiếu trường, trùng mã và bug report thiếu bước tái hiện', () => {
    const form = sanitizeTesterForm({
      testCases: [tc('TC01', 'Đăng nhập đúng'), tc('tc01', 'Đăng nhập sai'), { code: 'TC03', description: 'Thiếu expected', input: 'a', expected: '' }],
      bugReports: [{ title: 'Lỗi', steps: 'bấm nút', expected: '', actual: 'treo', severity: 'LOW' }],
    });
    const r = byId(runFormChecks(form));
    expect(r['test-case-count'].passed).toBe(false);
    expect(r['test-case-complete'].message).toContain('1 test case');
    expect(r['test-case-unique'].message).toContain('tc01');
    expect(r['bug-report-1'].passed).toBe(false);
    expect(r['bug-report-1'].message).toContain('các bước tái hiện');
    expect(r['bug-report-1'].message).toContain('kết quả mong đợi');
  });

  it('chưa có bug report thì báo thiếu', () => {
    const r = byId(runFormChecks(sanitizeTesterForm({ testCases: [tc('T1', 'a')] })));
    expect(r['bug-report'].passed).toBe(false);
  });
});

describe('TesterLabsService.submitForm', () => {
  it('lưu trạng thái SUBMITTED (chờ giảng viên chấm) kèm nhận xét sơ bộ ngay', async () => {
    const labModel = { findOne: jest.fn(() => ({ lean: async () => ({ _id: 'lab1', labCode: 'LAB-01' }) })) };
    const created: any[] = [];
    const submissionModel = {
      create: jest.fn(async (doc: any) => {
        created.push(doc);
        return { _id: 'sub1', status: doc.status };
      }),
    };
    const service = new TesterLabsService(labModel as any, submissionModel as any, {} as any);
    const out = await service.submitForm('LAB-01', 'stu1', { testCases: [tc('T1', 'Để trống email')], bugReports: [bug] });
    expect(created[0]).toMatchObject({ labId: 'lab1', userId: 'stu1', kind: 'FORM', status: 'SUBMITTED', fileType: 'form' });
    expect(created[0].formData.testCases).toHaveLength(1);
    expect(out).toMatchObject({ id: 'sub1', status: 'SUBMITTED', statusLabel: 'Đã nộp bài - Chờ giảng viên chấm', testCaseCount: 1, bugReportCount: 1 });
    expect(out.autoCheckResults.length).toBeGreaterThan(3);
    await expect(service.submitForm('LAB-01', 'stu1', {})).rejects.toThrow(BadRequestException);
  });
});
