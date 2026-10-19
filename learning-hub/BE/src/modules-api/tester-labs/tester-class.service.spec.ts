import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { fakeModel } from '../teacher-analytics/fake-model';
import { TesterClassService } from './tester-class.service';
import { isTesterClass, summarizeTesterStudent, submissionTotal, testerRating } from '../assessment/domain/tester-progress';
import { TeacherAnalyticsService } from '../teacher-analytics/teacher-analytics.service';
import { AssessmentService } from '../assessment/assessment.service';
import { ProctorService, isUnmonitored } from '../integrity/proctor.service';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const TEST_CLASS = OID(1);
const OTHER_CLASS = OID(2);
const T1: JwtPayload = { sub: OID(90), email: 't1@x', role: 'TEACHER' };
const T2: JwtPayload = { sub: OID(91), email: 't2@x', role: 'TEACHER' };
const LAB1 = OID(501);
const LAB2 = OID(502);
const LAB3 = OID(503);

const grades = (a: number, b: number, c: number) => [
  { key: 'test-coverage', score: a },
  { key: 'bug-report-clarity', score: b },
  { key: 'severity-classification', score: c },
];

describe('tester-progress: xếp loại và tổng hợp từ bài nộp', () => {
  it('bài chấm theo rubric 10 điểm đời đầu vẫn được tính, quy về thang 100', () => {
    const legacy = ['scope-design', 'actual-expected', 'evidence', 'severity-result', 'cleanup'].map((key) => ({ key, score: 2 }));
    expect(submissionTotal(legacy)).toBe(100);
    expect(submissionTotal(legacy.map((g, i) => ({ ...g, score: i < 3 ? 2 : 1 })))).toBe(80);
    expect(submissionTotal(legacy.slice(0, 3))).toBeNull();
  });

  it('xếp loại theo điểm trung bình', () => {
    expect([95, 85, 84.9, 70, 69.9, 50, 49.9, null].map((v) => testerRating(v as number | null))).toEqual([
      'EXCELLENT', 'EXCELLENT', 'GOOD', 'GOOD', 'PASS', 'PASS', 'NEEDS_WORK', 'NONE',
    ]);
  });

  it('tổng điểm bài = tổng 3 tiêu chí; thiếu tiêu chí thì chưa có điểm', () => {
    expect(submissionTotal(grades(37, 28, 27))).toBe(92);
    expect(submissionTotal(grades(37, 28, 27).slice(0, 2))).toBeNull();
    expect(submissionTotal([])).toBeNull();
  });

  it('một Lab hoàn thành khi có bài đã chấm; điểm Lab là điểm cao nhất; bài chờ chấm/bị hủy không tính điểm', () => {
    const s = summarizeTesterStudent(
      [
        { labId: 'a', status: 'REVIEWED', rubricGrades: grades(30, 20, 20) }, // 70
        { labId: 'a', status: 'REVIEWED', rubricGrades: grades(35, 25, 25) }, // 85 -> điểm Lab a
        { labId: 'b', status: 'REVIEWED', rubricGrades: grades(20, 20, 20) }, // 60
        { labId: 'c', status: 'SUBMITTED' },
        { labId: 'd', status: 'REVIEWED', invalidated: true, rubricGrades: grades(40, 30, 30) },
      ],
      12,
    );
    expect(s).toMatchObject({ labsCompleted: 2, labsTotal: 12, avgScore: 72.5, rating: 'GOOD', pending: 1 });
  });

  it('chưa chấm bài nào: không có điểm, chưa xếp loại', () => {
    expect(summarizeTesterStudent([{ labId: 'a', status: 'SUBMITTED' }], 12)).toMatchObject({ avgScore: null, rating: 'NONE', labsCompleted: 0, pending: 1 });
  });

  it('nhận diện lớp Tester theo courseKey hoặc mã lớp', () => {
    expect(isTesterClass({ courseKey: 'tester-qa' })).toBe(true);
    expect(isTesterClass({ code: 'CL-CAREER-TESTER' })).toBe(true);
    expect(isTesterClass({ courseKey: 'data-sql', code: 'CL-CAREER-DATA' })).toBe(false);
    expect(isTesterClass({ ageGroup: '10-12' } as never)).toBe(false);
  });
});

function build() {
  const classes = fakeModel([
    { _id: TEST_CLASS, name: 'Tester QA', code: 'CL-CAREER-TESTER', courseKey: 'tester-qa', teacherId: T1.sub, teacherIds: [T1.sub], studentIds: [] },
    { _id: OTHER_CLASS, name: 'K10-12', code: 'CL-1012A1', ageGroup: '10-12', teacherId: T1.sub, teacherIds: [T1.sub], studentIds: [] },
  ]);
  const users = fakeModel([
    { _id: OID(11), fullName: 'Lê Hoàng Long', email: 'long@x', role: 'STUDENT', ageGroup: 'CAREER_ADULT' },
    { _id: OID(12), fullName: 'Trần Mai Anh', email: 'anh@x', role: 'STUDENT', ageGroup: 'CAREER_ADULT' },
    { _id: OID(13), fullName: 'Đỗ Quốc Huy', email: 'huy@x', role: 'STUDENT', ageGroup: 'CAREER_ADULT' },
    { _id: OID(14), fullName: 'Học sinh phổ thông', email: 'k@x', role: 'STUDENT', ageGroup: '10-12' },
  ]);
  (users as any).findOne = jest.fn((f: any) => {
    const row = (users as any).rows.find((r: any) => String(r._id) === String(f._id) && r.ageGroup === f.ageGroup);
    const q: any = { select: () => q, lean: async () => row ?? null };
    return q;
  });
  const labs = fakeModel([
    { _id: LAB1, labCode: 'LAB-01', title: 'Đăng ký / Đăng nhập' },
    { _id: LAB2, labCode: 'LAB-02', title: 'Đặt vé' },
    { _id: LAB3, labCode: 'LAB-03', title: 'Thanh toán' },
  ]);
  const submissions = fakeModel([
    { _id: OID(701), userId: OID(11), labId: LAB1, status: 'REVIEWED', rubricGrades: grades(37, 28, 27), reviewerNotes: 'Bao phủ tốt ca biên, bug rõ ràng.', createdAt: '2026-10-10T00:00:00.000Z' },
    { _id: OID(702), userId: OID(11), labId: LAB2, status: 'REVIEWED', rubricGrades: grades(35, 27, 26), reviewerNotes: 'Severity phân loại chuẩn.', createdAt: '2026-10-11T00:00:00.000Z' },
    { _id: OID(703), userId: OID(12), labId: LAB1, status: 'REVIEWED', rubricGrades: grades(34, 26, 25), reviewerNotes: 'Cần thêm ca lỗi.', createdAt: '2026-10-12T00:00:00.000Z' },
    { _id: OID(704), userId: OID(13), labId: LAB3, status: 'SUBMITTED', kind: 'FORM', formData: { testCases: [{ code: 'TC01' }], bugReports: [] }, createdAt: '2026-10-13T00:00:00.000Z' },
  ]);
  return { service: new TesterClassService(classes as any, users as any, labs as any, submissions as any) };
}

describe('TesterClassService: bảng xếp hạng & tiến độ', () => {
  it('xếp theo điểm TB giảm dần, kèm số Lab hoàn thành, xếp loại và bài chờ chấm; học viên phổ thông không lọt vào', async () => {
    const { service } = build();
    const r = await service.rosterWithProgress(T1, TEST_CLASS);
    expect(r.labsTotal).toBe(3);
    expect(r.students.map((s) => [s.fullName, s.rank, s.labsCompleted, s.avgScore, s.rating, s.pending])).toEqual([
      ['Lê Hoàng Long', 1, 2, 90, 'EXCELLENT', 0],
      ['Trần Mai Anh', 2, 1, 85, 'EXCELLENT', 0],
      ['Đỗ Quốc Huy', null, 0, null, 'NONE', 1],
    ]);
    expect(r.students.some((s) => s.fullName === 'Học sinh phổ thông')).toBe(false);
  });

  it('hồ sơ học viên: từng Lab, điểm từng tiêu chí rubric và nhận xét', async () => {
    const { service } = build();
    const d = await service.studentDetail(T1, TEST_CLASS, OID(11));
    expect(d.student.fullName).toBe('Lê Hoàng Long');
    expect(d.submissions.map((s) => [s.lab.labCode, s.total])).toEqual([['LAB-01', 92], ['LAB-02', 88]]);
    expect(d.submissions[0].criteria.map((c) => [c.max, c.score])).toEqual([[40, 37], [30, 28], [30, 27]]);
    expect(d.submissions[0].feedback).toContain('Bao phủ tốt');
    expect(d.summary).toMatchObject({ labsCompleted: 2, avgScore: 90 });
  });

  it('hồ sơ học viên không thuộc khóa (học sinh phổ thông) -> 404', async () => {
    const { service } = build();
    await expect(service.studentDetail(T1, TEST_CLASS, OID(14))).rejects.toThrow(/không thuộc lớp/);
  });

  it('hàng chờ chấm của lớp: chỉ bài chờ chấm của học viên khóa, kèm rubric chuẩn 40/30/30', async () => {
    const { service } = build();
    const q = await service.queue(T1, TEST_CLASS);
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ id: OID(704), student: { fullName: 'Đỗ Quốc Huy' }, lab: { labCode: 'LAB-03' } });
    expect(q[0].lab.rubricCriteria.map((c) => c.maxScore)).toEqual([40, 30, 30]);
  });

  it('giảng viên không phụ trách lớp -> 403; lớp không phải Tester QA -> 400', async () => {
    const { service } = build();
    await expect(service.rosterWithProgress(T2, TEST_CLASS)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.queue(T2, TEST_CLASS)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.rosterWithProgress(T1, OTHER_CLASS)).rejects.toMatchObject({ response: { code: 'E400_NOT_TESTER_CLASS' } });
  });
});

describe('Chặn nghiệp vụ lớp Tester QA', () => {
  const classes = (extra: any) => ({ findById: () => ({ lean: async () => extra }) });

  it('giao bài tập code cho lớp Tester QA -> 400', async () => {
    const svc = new TeacherAnalyticsService(
      classes({ _id: TEST_CLASS, name: 'Tester', code: 'CL-CAREER-TESTER', courseKey: 'tester-qa', teacherId: T1.sub, teacherIds: [T1.sub], studentIds: [] }) as any,
      { find: () => ({ select: () => ({ lean: async () => [] }) }), exists: async () => null } as any,
      { countDocuments: async () => 0 } as any, {} as any, {} as any, {} as any, {} as any,
    );
    await expect(svc.setExercises(T1, TEST_CLASS, ['py-1'])).rejects.toMatchObject({ response: { code: 'E400_TESTER_CLASS_NO_ASSIGNMENT' } });
    await expect(svc.setExercises(T1, TEST_CLASS, ['py-1'])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('tạo bài đánh giá cho lớp Tester QA -> 400', async () => {
    const svc = new AssessmentService({} as any, {} as any, classes({ _id: TEST_CLASS, courseKey: 'tester-qa', teacherId: T1.sub, teacherIds: [T1.sub] }) as any, {} as any);
    await expect(svc.createAssessment(T1, TEST_CLASS, { assessmentType: 'ASSIGNMENT', title: 'Bài tuần', dueDate: new Date(Date.now() + 5 * 3600_000).toISOString() })).rejects.toMatchObject({
      response: { code: 'E400_TESTER_CLASS_NO_ASSIGNMENT' },
    });
  });

  it('học viên Career Adult không bị đo out-tab: không ghi cảnh báo, không tra CSDL', async () => {
    const alerts = { findOneAndUpdate: jest.fn(), updateOne: jest.fn() };
    const proctor = new ProctorService(alerts as any, {} as any, {} as any, {} as any, {} as any, {} as any);
    const career = { sub: OID(11), email: 'c@x', role: 'STUDENT', ageGroup: 'CAREER_ADULT' } as JwtPayload;
    expect(isUnmonitored(career)).toBe(true);
    expect(await proctor.recordLeave('CONTEST', 'x', career)).toEqual({ count: 0, locked: false, closed: false, teacherNotified: false });
    expect(await proctor.heartbeat('CONTEST', 'x', career)).toEqual({ ok: true, suspicious: false });
    expect(alerts.findOneAndUpdate).not.toHaveBeenCalled();
    expect(alerts.updateOne).not.toHaveBeenCalled();
    expect(isUnmonitored({ ageGroup: '10-12' })).toBe(false);
  });
});

describe('Giảng viên đọc bài nộp Tester Lab (không đụng endpoint nộp bài của học viên)', () => {
  it('giảng viên phụ trách lớp Tester QA đọc được test case, bug report, điểm từng tiêu chí và nhận xét', async () => {
    const { service } = build();
    const d = await service.submissionDetail(T1, OID(701));
    expect(d).toMatchObject({ id: OID(701), status: 'REVIEWED', total: 92, student: { fullName: 'Lê Hoàng Long' }, lab: { labCode: 'LAB-01' } });
    expect(d.criteria.map((c) => [c.max, c.score])).toEqual([[40, 37], [30, 28], [30, 27]]);
    expect(d.feedback).toContain('Bao phủ tốt');
  });

  it('bài chờ chấm: trả nội dung nộp, chưa có điểm', async () => {
    const { service } = build();
    const d = await service.submissionDetail(T1, OID(704));
    expect(d).toMatchObject({ status: 'SUBMITTED', total: null, criteria: [] });
    expect(d.formData?.testCases).toHaveLength(1);
  });

  it('giảng viên không phụ trách lớp Tester QA -> 403; học viên -> 403', async () => {
    const { service } = build();
    await expect(service.submissionDetail(T2, OID(701))).rejects.toMatchObject({ response: { code: 'E403_CLASS_NOT_OWNED' } });
    await expect(service.submissionDetail({ sub: OID(11), email: 'x', role: 'STUDENT' }, OID(701))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('id không tồn tại -> 404', async () => {
    const { service } = build();
    await expect(service.submissionDetail(T1, OID(799))).rejects.toThrow(/Không tìm thấy bài nộp/);
  });
});
