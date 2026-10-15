import 'reflect-metadata';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { buildCareerCourses, careerCoursesToEnrollments, CAREER_COURSES, type CareerLabItemInput } from './career-courses';
import { CareerCoursesController } from './career-courses.controller';
import { CareerCoursesService } from './career-courses.service';

const at = (iso: string) => new Date(iso);
const item = (courseKey: CareerLabItemInput['courseKey'], ref: string, order: number, latest: CareerLabItemInput['latest'] = null, maxScore = 10): CareerLabItemInput => ({
  courseKey,
  ref,
  title: `Bài ${ref}`,
  maxScore,
  order,
  latest,
});
const done = (score: number, iso: string, extra: object = {}) => ({ state: 'DONE' as const, score, maxScore: 10, submittedAt: at(iso), feedback: null, feedbackBy: null, attempts: 1, ...extra });

describe('buildCareerCourses', () => {
  it('luôn trả đúng 3 khóa theo thứ tự Tester, Data, AI', () => {
    const r = buildCareerCourses({ items: [], userId: 'u1', studentName: 'An', teacherNames: {} });
    expect(r.map((c) => c.key)).toEqual(['tester-qa', 'data-sql', 'ai-prompt']);
    expect(r.map((c) => c.title)).toEqual(CAREER_COURSES.map((c) => c.title));
    expect(r.every((c) => c.status === 'IN_PROGRESS' && c.totalItems === 0 && c.percent === 0)).toBe(true);
  });

  it('tiến độ: đếm bài đã làm, đã xong, % và đường dẫn vào từng bài', () => {
    const [tester] = buildCareerCourses({
      items: [
        item('tester-qa', 'LAB-01', 0, done(8, '2026-10-10T00:00:00Z', { feedback: 'Bao phủ tốt', feedbackBy: 'TEACHER' })),
        item('tester-qa', 'LAB-02', 1, { state: 'PENDING', score: 0, submittedAt: at('2026-10-11T00:00:00Z'), feedback: null, feedbackBy: null, attempts: 1 }),
        item('tester-qa', 'LAB-03', 2),
        item('tester-qa', 'LAB-04', 3, { state: 'IN_PROGRESS', score: 0, submittedAt: at('2026-10-12T00:00:00Z'), feedback: null, feedbackBy: null, attempts: 2 }),
      ],
      userId: 'u1',
      studentName: 'An',
      teacherNames: { 'tester-qa': 'Cô Lan' },
    });
    expect(tester).toMatchObject({ totalItems: 4, attemptedItems: 3, doneItems: 1, percent: 25, status: 'IN_PROGRESS', teacherName: 'Cô Lan', certificate: null });
    expect(tester.items.map((i) => i.state)).toEqual(['DONE', 'PENDING', 'NOT_STARTED', 'IN_PROGRESS']);
    expect(tester.items[0]).toMatchObject({ path: '/tester-labs/LAB-01', score: 8, feedback: 'Bao phủ tốt', feedbackBy: 'TEACHER' });
    expect(tester.items[1].score).toBeNull();
    expect(tester.items[2]).toMatchObject({ lastSubmittedAt: null, feedback: null, attempts: 0 });
  });

  it('xong hết và điểm đủ: Đã hoàn thành kèm chứng chỉ (điểm, xếp loại, ngày muộn nhất, mã)', () => {
    const [, data] = buildCareerCourses({
      items: [item('data-sql', 'sql-1', 0, done(10, '2026-10-01T00:00:00Z')), item('data-sql', 'sql-2', 1, done(9, '2026-10-05T00:00:00Z'))],
      userId: 'u1',
      studentName: 'Nguyễn An',
      teacherNames: { 'data-sql': 'Thầy Bình' },
    });
    expect(data.status).toBe('COMPLETED');
    expect(data.certificate).toMatchObject({ studentName: 'Nguyễn An', className: data.title, teacherName: 'Thầy Bình', finalScore: 95, earned: 19, max: 20, grade: 'Xuất sắc' });
    expect(data.certificate!.completedAt).toEqual(at('2026-10-05T00:00:00Z'));
    expect(data.certificate!.code).toMatch(/^CSH-2026-DATASQL-[0-9A-F]{8}$/);
  });

  it('xong hết nhưng điểm thấp: Đã kết thúc, không có chứng chỉ', () => {
    const [, data] = buildCareerCourses({
      items: [item('data-sql', 'sql-1', 0, done(3, '2026-10-01T00:00:00Z'))],
      userId: 'u1',
      studentName: 'An',
      teacherNames: {},
    });
    expect(data).toMatchObject({ status: 'ENDED', certificate: null });
  });

  it('chuyển sang dạng MyEnrollment cho trang Hồ sơ', () => {
    const courses = buildCareerCourses({ items: [item('ai-prompt', 'ai-lab-01', 0, done(9, '2026-10-02T00:00:00Z'))], userId: 'u1', studentName: 'An', teacherNames: {} });
    const enr = careerCoursesToEnrollments(courses);
    expect(enr).toHaveLength(3);
    const ai = enr.find((e) => e.classId === 'ai-prompt')!;
    expect(ai).toMatchObject({ status: 'COMPLETED', totalAssignments: 1, doneCount: 1, percent: 100 });
    expect(ai.certificate).not.toBeNull();
    expect(enr.find((e) => e.classId === 'tester-qa')!.status).toBe('IN_PROGRESS');
  });
});

const chain = (value: unknown) => {
  const c: any = {};
  for (const m of ['select', 'sort']) c[m] = jest.fn(() => c);
  c.lean = jest.fn().mockResolvedValue(value);
  return c;
};

describe('CareerCoursesService.myCourses', () => {
  it('gom dữ liệu thật của 3 phòng lab và chỉ truy vấn bài nộp của chính học viên', async () => {
    const exercises = {
      find: jest.fn((f: any) =>
        chain(
          f.topic === 'da-lab-pack'
            ? [{ _id: 'e1', slug: 'da-sql-01', title: 'Đơn hàng', type: 'SQL_LAB', points: 10 }]
            : [{ _id: 'a1', slug: 'ai-lab-01', title: 'Zero-shot', points: 10 }],
        ),
      ),
    };
    const daSubs = { find: jest.fn(() => chain([{ type: 'SQL', exerciseId: 'e1', status: 'GRADED', score: 10, bestScore: 10, maxScore: 10, aiExplanation: 'ACCEPTED: đúng', attemptCount: 2, updatedAt: at('2026-10-03T00:00:00Z') }])) };
    const aiSubs = { find: jest.fn(() => chain([{ exerciseId: 'a1', status: 'FAILED', score: 4, maxScore: 10, qualityScore: 40, totalAttempts: 3, updatedAt: at('2026-10-04T00:00:00Z') }])) };
    const testerLabs = { find: jest.fn(() => chain([{ _id: 't1', labCode: 'LAB-01', title: 'Bug hunt', rubricCriteria: [{ maxScore: 6 }, { maxScore: 4 }] }])) };
    const testerSubs = { find: jest.fn(() => chain([{ labId: 't1', status: 'REVIEWED', rubricGrades: [{ score: 5 }, { score: 3 }], reviewerNotes: 'Tốt', reviewerId: '64b000000000000000000001', createdAt: at('2026-10-02T00:00:00Z') }])) };
    const users = {
      findById: jest.fn(() => chain({ fullName: 'Người Đi Làm' })),
      find: jest.fn(() => chain([{ _id: '64b000000000000000000001', fullName: 'Cô Lan' }])),
    };
    const svc = new CareerCoursesService(exercises as never, daSubs as never, aiSubs as never, testerLabs as never, testerSubs as never, users as never);
    const [tester, data, ai] = await svc.myCourses('u1');

    expect(daSubs.find).toHaveBeenCalledWith({ userId: 'u1', exerciseId: { $in: ['e1'] } });
    expect(aiSubs.find).toHaveBeenCalledWith({ userId: 'u1', exerciseId: { $in: ['a1'] } });
    expect(testerSubs.find).toHaveBeenCalledWith({ userId: 'u1' });

    expect(tester.items[0]).toMatchObject({ state: 'DONE', score: 8, maxScore: 10, feedback: 'Tốt', feedbackBy: 'TEACHER' });
    expect(tester.teacherName).toBe('Cô Lan');
    expect(data.items[0]).toMatchObject({ state: 'DONE', score: 10, feedbackBy: 'SYSTEM', attempts: 2 });
    expect(ai.items[0]).toMatchObject({ state: 'IN_PROGRESS', attempts: 3 });
    expect(ai.items[0].feedback).toContain('Chưa đạt');
  });
});

describe('CareerCoursesController', () => {
  it('chỉ STUDENT', () => {
    expect(Reflect.getMetadata(ROLES_KEY, CareerCoursesController)).toEqual(['STUDENT']);
  });
});
