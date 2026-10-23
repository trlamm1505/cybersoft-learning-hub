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

import { formatFileSize, isFileSubmission, submissionSummary } from './teacherGradingModel';

describe('bài nộp file trong hàng chờ chấm', () => {
  it('bài nộp file hiển thị loại và dung lượng thay vì 0 test case / 0 bug', () => {
    const item = { kind: 'FILE' as const, formData: null, file: { fileType: 'xlsx', fileSize: 18603 } };
    expect(isFileSubmission(item)).toBe(true);
    expect(submissionSummary(item)).toBe('📎 File .xlsx · 18 KB');
  });
  it('bài biểu mẫu đếm test case và bug', () => {
    const item = {
      kind: 'FORM' as const,
      file: null,
      formData: { testCases: [{ code: 'TC01', description: '', input: '', expected: '' }], bugReports: [] },
    };
    expect(isFileSubmission(item)).toBe(false);
    expect(submissionSummary(item)).toBe('1 test case · 0 bug');
  });
  it('định dạng dung lượng', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
