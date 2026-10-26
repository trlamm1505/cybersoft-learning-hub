import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ContestHistoryTable, EMPTY_CONTEST_HISTORY_TEXT, formatDuration, formatRank } from './ContestHistorySection';
import { BACK_TO_CLASS_LABEL, ClassResultModal } from '../ClassResultModal';

const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('ContestHistoryTable', () => {
  it('chưa thi: thông báo nhẹ nhàng và nút dẫn tới /contests', () => {
    const html = renderToString(
      <MemoryRouter>
        <ContestHistoryTable items={[]} />
      </MemoryRouter>,
    );
    expect(text(html)).toContain('Bạn chưa tham gia cuộc thi nào. Hãy thử sức tại mục Cuộc thi nhé!');
    expect(EMPTY_CONTEST_HISTORY_TEXT).toContain('Cuộc thi');
    expect(html).toContain('href="/contests"');
  });

  it('mỗi dòng: tên, ngày, điểm, thời gian làm bài, hạng / tổng thí sinh', () => {
    const html = renderToString(
      <MemoryRouter>
        <ContestHistoryTable
          items={[
            { contestId: 'c1', title: 'Thi giữa kỳ', joinedAt: '2026-10-01T01:00:00.000Z', score: 80, maxScore: 100, durationMinutes: 75, rank: 3, totalParticipants: 14, provisional: false },
          ]}
        />
      </MemoryRouter>,
    );
    const t = text(html);
    expect(t).toContain('Thi giữa kỳ');
    expect(t).toContain('01/10/2026');
    expect(t).toContain('80/100');
    expect(t).toContain('1 giờ 15 phút');
    expect(t).toContain('Hạng 3 / 14 thí sinh');
  });

  it('định dạng thời gian và hạng', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(42)).toBe('42 phút');
    expect(formatDuration(120)).toBe('2 giờ');
    expect(formatRank(null, 5, false)).toBe('—');
    expect(formatRank(1, 5, true)).toBe('Hạng 1 / 5 thí sinh (tạm thời)');
  });
});

describe('ClassResultModal', () => {
  it('hiện điểm rõ ràng và nút quay lại Lớp học của tôi', () => {
    const html = renderToString(<ClassResultModal title="Trắc nghiệm Python" scoreText="Điểm: 9/10" onBack={() => undefined} />);
    const t = text(html);
    expect(t).toContain('Điểm: 9/10');
    expect(t).toContain('Trắc nghiệm Python');
    expect(t).toContain(BACK_TO_CLASS_LABEL);
    expect(BACK_TO_CLASS_LABEL).toBe('⬅ Quay lại Lớp học của tôi');
  });
});

describe('ContestHistoryTable: kết quả bị không công nhận', () => {
  it('vẫn hiện điểm của học viên nhưng thay hạng bằng nhãn "Không công nhận kết quả"', () => {
    const html = renderToString(
      <MemoryRouter>
        <ContestHistoryTable
          items={[
            { contestId: 'c1', title: 'Thi cuối kỳ', joinedAt: '2026-10-01T01:00:00.000Z', score: 90, maxScore: 100, durationMinutes: 30, rank: null, totalParticipants: 10, provisional: false, disqualified: true, disqualifiedReason: 'Rời màn hình 3 lần' },
          ]}
        />
      </MemoryRouter>,
    );
    const t = text(html);
    expect(t).toContain('90/100');
    expect(t).toContain('Không công nhận kết quả');
    expect(t).not.toContain('Hạng');
  });
});
