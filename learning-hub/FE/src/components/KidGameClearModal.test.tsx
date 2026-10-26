import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { KidGameClearModal } from './KidGameClearModal';

const base = { gameTitle: 'Rùa Vẽ Hình', stars: 12, badge: { title: 'Họa sĩ rùa', emoji: '🐢' }, onGoToLeaderboard: vi.fn() };

describe('KidGameClearModal', () => {
  it('chúc mừng, nêu thành tích (sao + huy hiệu) và hẹn sang Bảng Vinh Danh khi đã lưu xong', () => {
    // renderToString chèn <!-- --> giữa các đoạn text; bỏ đi để so khớp câu.
    const html = renderToString(<KidGameClearModal {...base} saved />).replace(/<!-- -->/g, '');
    expect(html).toContain('Chúc mừng bé!');
    expect(html).toContain('Rùa Vẽ Hình');
    expect(html).toContain('Tổng 12 sao');
    expect(html).toContain('Họa sĩ rùa');
    expect(html).toContain('Mình sang Bảng Vinh Danh sau 8 giây');
    expect(html).not.toContain('disabled=""');
  });

  it('chưa lưu xong thì báo đang ghi nhận và khóa nút, chưa đếm ngược', () => {
    const html = renderToString(<KidGameClearModal {...base} saved={false} />).replace(/<!-- -->/g, '');
    expect(html).toContain('Đang ghi nhận thành tích');
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('sau 8 giây');
  });
});
