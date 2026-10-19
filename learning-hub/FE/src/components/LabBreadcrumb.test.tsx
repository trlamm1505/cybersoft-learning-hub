import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { BACK_TO_LAB_LIST_LABEL, LabBreadcrumb, LAB_GROUPS } from './LabBreadcrumb';
import { formatSubmittedAt, SubmissionHistory } from './SubmissionHistory';

const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('LabBreadcrumb', () => {
  it('có nút "⬅ Quay lại danh sách bài Lab" và breadcrumb Phòng thực hành > Lab > Bài', () => {
    const html = renderToString(
      <MemoryRouter>
        <LabBreadcrumb group="DATA" title="Đơn hàng giá trị cao" />
      </MemoryRouter>,
    );
    const t = text(html);
    expect(BACK_TO_LAB_LIST_LABEL).toBe('⬅ Quay lại danh sách bài Lab');
    expect(t).toContain('⬅ Quay lại danh sách bài Lab');
    expect(t).toContain('Phòng thực hành chuyên ngành');
    expect(t).toContain('Data Lab (SQL)');
    expect(t).toContain('Đơn hàng giá trị cao');
    expect(html).toContain('href="/career-labs"');
    expect(html).toContain('href="/da-labs"');
    expect(html).toContain('aria-current="page"');
  });

  it('mỗi nhóm lab trỏ về đúng danh sách', () => {
    expect(LAB_GROUPS.DATA.listPath).toBe('/da-labs');
    expect(LAB_GROUPS.AI.listPath).toBe('/ai-labs');
    expect(LAB_GROUPS.TESTER.listPath).toBe('/tester-labs');
  });
});

describe('SubmissionHistory', () => {
  it('chưa nộp: thông báo rỗng', () => {
    expect(text(renderToString(<SubmissionHistory items={[]} />))).toContain('Bạn chưa nộp bài nào');
  });

  it('liệt kê các lần nộp (giờ Việt Nam, kết quả, điểm)', () => {
    const html = renderToString(
      <SubmissionHistory
        items={[
          { id: '1', submittedAt: '2026-10-15T01:05:00.000Z', resultLabel: 'Đạt (AC)', passed: true, scoreText: '10/10', content: 'SELECT 1', feedback: 'Đúng' },
          { id: '2', submittedAt: '2026-10-14T23:30:00.000Z', resultLabel: 'Sai kết quả', passed: false, scoreText: '0/10', content: 'SELECT 2' },
        ]}
        onReuse={() => undefined}
      />,
    );
    const t = text(html);
    expect(t).toContain('2 lần nộp');
    expect(t).toContain('15/10/2026 08:05');
    expect(t).toContain('15/10/2026 06:30');
    expect(t).toContain('Đạt (AC)');
    expect(t).toContain('10/10');
    expect(formatSubmittedAt('không hợp lệ')).toBe('');
  });
});
