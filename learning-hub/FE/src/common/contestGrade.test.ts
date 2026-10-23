import { describe, expect, it } from 'vitest';
import { contestBandLabel, contestGradeDenied, isUnlimitedContest, matchesGradeFilter } from './contestGrade';

describe('contestGrade', () => {
  it('tab lọc: Tất cả thấy hết; tab khối thấy cuộc thi của khối đó và cuộc thi mở cho mọi khối', () => {
    expect(matchesGradeFilter('10-12', 'all')).toBe(true);
    expect(matchesGradeFilter('6-9', '6-9')).toBe(true);
    expect(matchesGradeFilter('10-12', '6-9')).toBe(false);
    expect(matchesGradeFilter('ALL', '10-12')).toBe(true);
    expect(matchesGradeFilter(undefined, '6-9')).toBe(true);
  });

  it('học sinh 6-9 vào cuộc thi 10-12 bị từ chối với thông báo rõ khối', () => {
    expect(contestGradeDenied('10-12', { role: 'STUDENT', ageGroup: '6-9' })).toBe('Cuộc thi dành riêng cho học sinh Khối 10–12.');
    expect(contestGradeDenied('6-9', { role: 'STUDENT', ageGroup: '10-12' })).toBe('Cuộc thi dành riêng cho học sinh Khối 6–9.');
  });

  it('đúng khối, cuộc thi mở cho mọi khối, hoặc giảng viên thì không bị chặn', () => {
    expect(contestGradeDenied('6-9', { role: 'STUDENT', ageGroup: '6-9' })).toBeUndefined();
    expect(contestGradeDenied('ALL', { role: 'STUDENT', ageGroup: '6-9' })).toBeUndefined();
    expect(contestGradeDenied('10-12', { role: 'TEACHER' })).toBeUndefined();
    expect(contestGradeDenied('10-12', null)).toBeUndefined();
  });

  it('cuộc thi mở không giới hạn: đóng sau hơn 1 năm', () => {
    const now = new Date('2026-10-15T00:00:00Z');
    expect(isUnlimitedContest('2099-12-31T23:59:59Z', now)).toBe(true);
    expect(isUnlimitedContest('2026-12-31T00:00:00Z', now)).toBe(false);
  });

  it('nhãn khối', () => {
    expect(contestBandLabel('6-9')).toBe('Khối 6–9');
    expect(contestBandLabel('10-12')).toBe('Khối 10–12');
    expect(contestBandLabel('ALL')).toBe('Mở cho mọi khối');
    expect(contestBandLabel(undefined)).toBe('Mở cho mọi khối');
  });
});
