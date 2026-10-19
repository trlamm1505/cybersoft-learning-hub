import { describe, expect, it } from 'vitest';
import { rubricTotal, validateGrades } from './teacherGradingModel';

const criteria = [
  { key: 'a', label: 'Phạm vi', maxScore: 2, kind: 'quality' as const },
  { key: 'b', label: 'Bằng chứng', maxScore: 3, kind: 'severity' as const },
];

describe('teacherGradingModel', () => {
  it('tổng điểm bỏ qua ô trống và chặn vượt tối đa', () => {
    expect(rubricTotal(criteria, { a: '2', b: '' })).toEqual({ score: 2, max: 5 });
    expect(rubricTotal(criteria, { a: '9', b: '3' })).toEqual({ score: 5, max: 5 });
  });
  it('bắt buộc chấm đủ tiêu chí', () => {
    expect(validateGrades(criteria, { a: '1' })).toMatchObject({ ok: false });
  });
  it('điểm ngoài khoảng bị từ chối', () => {
    expect(validateGrades(criteria, { a: '1', b: '4' })).toMatchObject({ ok: false });
    expect(validateGrades(criteria, { a: '-1', b: '1' })).toMatchObject({ ok: false });
  });
  it('hợp lệ trả danh sách điểm', () => {
    expect(validateGrades(criteria, { a: '1', b: '3' })).toEqual({ ok: true, grades: [{ key: 'a', score: 1 }, { key: 'b', score: 3 }] });
  });
});

import { rubricHint, rubricTitle } from './teacherGradingModel';

describe('nhãn rubric chuẩn', () => {
  it('tách tên tiêu chí và gợi ý', () => {
    expect(rubricTitle('Test Coverage: bao phủ ca biên và kịch bản lỗi')).toBe('Test Coverage');
    expect(rubricHint('Test Coverage: bao phủ ca biên và kịch bản lỗi')).toBe('bao phủ ca biên và kịch bản lỗi');
    expect(rubricHint('Không có gợi ý')).toBe('');
  });
});
