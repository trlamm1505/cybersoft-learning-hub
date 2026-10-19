import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { bugHasContent, caseHasContent, emptyBug, emptyCase, PreliminaryFeedback, SUBMITTED_STATUS_LABEL, TesterFormPanel } from './TesterFormPanel';

const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('TesterFormPanel', () => {
  it('có form test case (mã, mô tả, input, expected) và form bug report', () => {
    const html = renderToString(<TesterFormPanel labCode="LAB-01" />);
    for (const label of ['Mã test 1', 'Mô tả test 1', 'Input test 1', 'Expected test 1', 'Tiêu đề bug 1', 'Các bước tái hiện 1', 'Kết quả mong đợi 1', 'Kết quả thực tế 1']) {
      expect(html).toContain(`aria-label="${label}"`);
    }
    expect(text(html)).toContain('Thêm test case');
    expect(text(html)).toContain('Nộp bài');
  });

  it('dòng chỉ có mã tự điền không tính là có nội dung', () => {
    expect(caseHasContent(emptyCase(1))).toBe(false);
    expect(caseHasContent({ ...emptyCase(1), description: 'Để trống email' })).toBe(true);
    expect(emptyCase(7).code).toBe('TC07');
    expect(bugHasContent(emptyBug())).toBe(false);
    expect(bugHasContent({ ...emptyBug(), title: 'Lỗi' })).toBe(true);
  });

  it('nhận xét sơ bộ phân biệt đạt / chưa đạt', () => {
    const html = renderToString(
      <PreliminaryFeedback
        results={[
          { check: 'a', passed: true, message: 'Có test tình huống biên: Dữ liệu rỗng' },
          { check: 'b', passed: false, message: 'Chưa thấy test tình huống biên: Dữ liệu trùng lặp' },
        ]}
      />,
    );
    expect(text(html)).toContain('Có test tình huống biên');
    expect(text(html)).toContain('Chưa thấy test tình huống biên');
    expect(SUBMITTED_STATUS_LABEL).toBe('Đã nộp bài - Chờ giảng viên chấm');
  });
});
