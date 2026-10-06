import { describe, expect, it } from 'vitest';
import { adminOverview, portalHome } from './adminDashboardModel';
import type { AdminClassSummary } from '../types/teacherAnalytics';

const cls = (id: string, over: Partial<AdminClassSummary> = {}): AdminClassSummary => ({
  id,
  name: `Lớp ${id}`,
  teacherId: 't1',
  description: '',
  archived: false,
  studentCount: 2,
  exerciseCount: 1,
  teacher: { id: 't1', name: 'GV', email: 'gv@x.com' },
  ...over,
});

describe('adminOverview', () => {
  it('không có lớp: mọi số bằng 0, không có mục cần chú ý', () => {
    expect(adminOverview([])).toEqual({
      totalClasses: 0,
      activeClasses: 0,
      archivedClasses: 0,
      teachers: 0,
      studentSeats: 0,
      attention: [],
    });
  });

  it('đếm lớp, lưu trữ, giảng viên khác nhau và tổng chỗ học viên', () => {
    const o = adminOverview([
      cls('a'),
      cls('b', { teacher: { id: 't2', name: 'GV2', email: 'g2@x.com' }, studentCount: 5 }),
      cls('c', { archived: true, studentCount: 3 }),
    ]);
    expect(o).toMatchObject({ totalClasses: 3, activeClasses: 2, archivedClasses: 1, teachers: 2, studentSeats: 10 });
    expect(o.attention).toEqual([]);
  });

  it('lớp hoạt động thiếu giảng viên/học viên/bài vào danh sách cần chú ý; lớp lưu trữ thì không', () => {
    const o = adminOverview([
      cls('a', { teacher: null, studentCount: 0, exerciseCount: 0 }),
      cls('b', { exerciseCount: 0 }),
      cls('c', { archived: true, studentCount: 0 }),
      cls('d'),
    ]);
    expect(o.attention.map((x) => [x.cls.id, x.reasons])).toEqual([
      ['a', ['chưa gán giảng viên', 'chưa có học viên', 'chưa giao bài']],
      ['b', ['chưa giao bài']],
    ]);
    expect(o.teachers).toBe(1);
  });
});

describe('portalHome', () => {
  it('Admin vào Admin Portal; giảng viên và học viên không bao giờ được trả về đường dẫn /admin', () => {
    expect(portalHome('ADMIN')).toBe('/admin/dashboard');
    expect(portalHome('TEACHER')).toBe('/authoring');
    expect(portalHome('STUDENT')).toBe('/catalog');
    expect(portalHome(undefined)).toBe('/catalog');
    for (const r of ['TEACHER', 'STUDENT', undefined, 'admin', '']) expect(portalHome(r)).not.toMatch(/^\/admin/);
  });
});
