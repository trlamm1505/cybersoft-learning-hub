import { certificateCode, gradeOf, summarizeEnrollment, type EnrollmentAssignment } from './class-completion';

const NOW = new Date('2026-10-15T00:00:00Z');
const past = new Date('2026-10-01T00:00:00Z');
const future = new Date('2026-12-01T00:00:00Z');

const a = (over: Partial<EnrollmentAssignment>): EnrollmentAssignment => ({
  maxPoints: 10,
  dueAt: past,
  done: false,
  score: 0,
  completedAt: null,
  ...over,
});

describe('gradeOf', () => {
  it('chỉ có 3 loại Xuất sắc / Giỏi / Khá, dưới ngưỡng thì không xếp loại', () => {
    expect(gradeOf(100)).toBe('Xuất sắc');
    expect(gradeOf(90)).toBe('Xuất sắc');
    expect(gradeOf(89.9)).toBe('Giỏi');
    expect(gradeOf(80)).toBe('Giỏi');
    expect(gradeOf(79.9)).toBe('Khá');
    expect(gradeOf(65)).toBe('Khá');
    expect(gradeOf(64.9)).toBeNull();
  });
});

describe('summarizeEnrollment', () => {
  it('còn bài chưa xong và chưa quá hạn: Đang học, chưa xếp loại', () => {
    const r = summarizeEnrollment([a({ done: true, score: 10, completedAt: past }), a({ dueAt: future })], NOW);
    expect(r).toMatchObject({ status: 'IN_PROGRESS', doneCount: 1, earned: 10, max: 20, percent: 50, grade: null, completedAt: null });
  });

  it('mọi bài đã khép lại và đủ điểm: Đã hoàn thành kèm xếp loại và ngày hoàn thành muộn nhất', () => {
    const t1 = new Date('2026-09-20T03:00:00Z');
    const t2 = new Date('2026-09-25T03:00:00Z');
    const r = summarizeEnrollment(
      [a({ done: true, score: 10, completedAt: t1 }), a({ done: true, score: 9, completedAt: t2 })],
      NOW,
    );
    expect(r).toMatchObject({ status: 'COMPLETED', earned: 19, max: 20, percent: 95, grade: 'Xuất sắc' });
    expect(r.completedAt).toEqual(t2);
  });

  it('bài quá hạn không làm tính 0 điểm và ngày khép lại là hạn chót', () => {
    const r = summarizeEnrollment([a({ done: true, score: 10, completedAt: new Date('2026-09-01T00:00:00Z') }), a({ dueAt: past })], NOW);
    expect(r.percent).toBe(50);
    expect(r.status).toBe('ENDED');
    expect(r.grade).toBeNull();
    expect(r.completedAt).toEqual(past);
  });

  it('lớp chưa có bài nào: vẫn Đang học (không cấp chứng chỉ rỗng)', () => {
    expect(summarizeEnrollment([], NOW)).toMatchObject({ status: 'IN_PROGRESS', percent: 0, grade: null });
  });
});

describe('certificateCode', () => {
  it('ổn định, có năm và mã lớp, khác nhau giữa các học viên', () => {
    const d = new Date('2026-09-25T03:00:00Z');
    const c1 = certificateCode('CL-69PY01', 'cls1', 'u1', d);
    expect(c1).toMatch(/^CSH-2026-69PY01-[0-9A-F]{8}$/);
    expect(certificateCode('CL-69PY01', 'cls1', 'u1', d)).toBe(c1);
    expect(certificateCode('CL-69PY01', 'cls1', 'u2', d)).not.toBe(c1);
  });

  it('lớp cũ chưa có mã thì dùng đuôi id lớp', () => {
    expect(certificateCode('', '64b000000000000000000abc', 'u1', new Date('2026-01-01T00:00:00Z'))).toMatch(/^CSH-2026-000ABC-/);
  });
});
