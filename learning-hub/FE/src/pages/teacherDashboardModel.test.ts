import { describe, expect, it } from 'vitest';
import {
  dashboardState,
  difficultyLabel,
  EMPTY,
  formatAvg,
  formatDate,
  formatPercent,
  sortRows,
} from './teacherDashboardModel';

describe('định dạng số liệu Teacher Dashboard', () => {
  it('tỷ lệ: làm tròn phần trăm, null thành gạch ngang (không phải 0%)', () => {
    expect(formatPercent(0.3125)).toBe('31%');
    expect(formatPercent(0.6667)).toBe('67%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(null)).toBe(EMPTY);
    expect(formatPercent(undefined)).toBe(EMPTY);
  });

  it('trung bình: dấu phẩy kiểu Việt, tối đa 2 chữ số, null thành gạch ngang', () => {
    expect(formatAvg(2)).toBe('2');
    expect(formatAvg(2.13)).toBe('2,13');
    expect(formatAvg(null)).toBe(EMPTY);
  });

  it('ngày: null thành gạch ngang', () => {
    expect(formatDate(null)).toBe(EMPTY);
    expect(formatDate('2026-09-05T03:00:00.000Z')).toMatch(/2026/);
  });

  it('nhãn độ khó theo ngưỡng 25 và 50; null thành gạch ngang', () => {
    expect(difficultyLabel(71)).toBe('Khó');
    expect(difficultyLabel(50)).toBe('Khó');
    expect(difficultyLabel(27)).toBe('Vừa');
    expect(difficultyLabel(24)).toBe('Dễ');
    expect(difficultyLabel(0)).toBe('Dễ');
    expect(difficultyLabel(null)).toBe(EMPTY);
  });
});

describe('trạng thái dữ liệu trống', () => {
  const s = (students: number, exercises: number, attemptedPairs: number) => ({ students, exercises, attemptedPairs });

  it('thiếu học viên được ưu tiên báo trước, rồi thiếu bài, rồi chưa ai làm', () => {
    expect(dashboardState(s(0, 0, 0))).toBe('NO_STUDENTS');
    expect(dashboardState(s(0, 3, 0))).toBe('NO_STUDENTS');
    expect(dashboardState(s(4, 0, 0))).toBe('NO_EXERCISES');
    expect(dashboardState(s(4, 3, 0))).toBe('NO_ATTEMPTS');
    expect(dashboardState(s(4, 3, 8))).toBe('READY');
  });
});

describe('sortRows', () => {
  const rows = [
    { n: 'b', v: 2 as number | null },
    { n: 'a', v: null },
    { n: 'c', v: 9 },
    { n: 'd', v: 2 },
  ];

  it('số tăng/giảm, null luôn cuối, phần tử bằng nhau giữ thứ tự gốc', () => {
    expect(sortRows(rows, (r) => r.v, 'asc').map((r) => r.n)).toEqual(['b', 'd', 'c', 'a']);
    expect(sortRows(rows, (r) => r.v, 'desc').map((r) => r.n)).toEqual(['c', 'b', 'd', 'a']);
  });

  it('chuỗi theo bảng chữ cái tiếng Việt và không làm đổi mảng gốc', () => {
    const copy = [...rows];
    expect(sortRows(rows, (r) => r.n, 'asc').map((r) => r.n)).toEqual(['a', 'b', 'c', 'd']);
    expect(rows).toEqual(copy);
  });
});
