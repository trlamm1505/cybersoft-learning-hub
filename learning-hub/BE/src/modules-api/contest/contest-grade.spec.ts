import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { assertGradeAccess, normalizeContestGradeBand } from './contest-grade';

describe('normalizeContestGradeBand', () => {
  it('thiếu thì ALL, hợp lệ thì giữ nguyên, sai thì 400', () => {
    expect(normalizeContestGradeBand(undefined)).toBe('ALL');
    expect(normalizeContestGradeBand('')).toBe('ALL');
    expect(normalizeContestGradeBand('6-9')).toBe('6-9');
    expect(normalizeContestGradeBand('10-12')).toBe('10-12');
    expect(() => normalizeContestGradeBand('3-5')).toThrow(BadRequestException);
  });
});

describe('assertGradeAccess', () => {
  const student = (ageGroup?: string) => ({ role: 'STUDENT', ageGroup });

  it('cuộc thi ALL (hoặc cũ chưa có gradeBand) mở cho mọi học sinh', () => {
    expect(() => assertGradeAccess({ gradeBand: 'ALL' }, student('6-9'))).not.toThrow();
    expect(() => assertGradeAccess({}, student(undefined))).not.toThrow();
  });

  it('đúng khối thì vào được', () => {
    expect(() => assertGradeAccess({ gradeBand: '6-9' }, student('6-9'))).not.toThrow();
    expect(() => assertGradeAccess({ gradeBand: '10-12' }, student('10-12'))).not.toThrow();
  });

  it('học sinh 6-9 vào cuộc thi 10-12 -> 403 kèm thông báo rõ khối', () => {
    expect(() => assertGradeAccess({ gradeBand: '10-12' }, student('6-9'))).toThrow(ForbiddenException);
    expect(() => assertGradeAccess({ gradeBand: '10-12' }, student('6-9'))).toThrow('Cuộc thi dành riêng cho học sinh Khối 10–12.');
    expect(() => assertGradeAccess({ gradeBand: '6-9' }, student('10-12'))).toThrow('Khối 6–9');
  });

  it('học sinh chưa chọn nhóm tuổi hoặc nhóm 3-5 không vào cuộc thi riêng một khối', () => {
    expect(() => assertGradeAccess({ gradeBand: '6-9' }, student(undefined))).toThrow(ForbiddenException);
    expect(() => assertGradeAccess({ gradeBand: '6-9' }, student('3-5'))).toThrow(ForbiddenException);
  });

  it('giảng viên/quản trị viên và người chưa xác định không bị chặn', () => {
    expect(() => assertGradeAccess({ gradeBand: '10-12' }, { role: 'TEACHER' })).not.toThrow();
    expect(() => assertGradeAccess({ gradeBand: '10-12' }, { role: 'ADMIN' })).not.toThrow();
    expect(() => assertGradeAccess({ gradeBand: '10-12' }, undefined)).not.toThrow();
  });
});
