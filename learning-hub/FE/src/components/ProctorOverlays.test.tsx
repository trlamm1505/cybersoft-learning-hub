import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LeaveDetector } from '../common/leaveDetector';
import { CheatLockOverlay, LeaveWarningBanner, CHEAT_LOCK_CONTACT, CHEAT_LOCK_TITLE } from './ProctorOverlays';

const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('LeaveDetector', () => {
  it('một lần rời (visibilitychange + blur) chỉ tính một lần', () => {
    const d = new LeaveDetector();
    expect(d.onLeave()).toBe(true);
    expect(d.onLeave()).toBe(false);
    expect(d.count).toBe(1);
  });

  it('quay lại rồi rời tiếp mới tính lần mới', () => {
    const d = new LeaveDetector();
    d.onLeave();
    d.onReturn();
    expect(d.onLeave()).toBe(true);
    d.onReturn();
    expect(d.onLeave()).toBe(true);
    expect(d.count).toBe(3);
  });

  it('reset đưa bộ đếm về 0', () => {
    const d = new LeaveDetector();
    d.onLeave();
    d.reset();
    expect(d.count).toBe(0);
    expect(d.onLeave()).toBe(true);
  });
});

describe('CheatLockOverlay', () => {
  it('toàn màn hình đỏ với đúng thông điệp gian lận và hướng dẫn liên hệ giảng viên', () => {
    const html = renderToString(<CheatLockOverlay onClose={() => undefined} />);
    expect(html).toContain('bg-red-700');
    expect(html).toContain('fixed inset-0');
    const t = text(html);
    expect(t).toContain('Phát hiện gian lận: Bạn đã rời khỏi màn hình thi 3 lần!');
    expect(t).toContain('Mọi thắc mắc và giải trình, vui lòng liên hệ trực tiếp với Giảng viên phụ trách cuộc thi.');
    expect(CHEAT_LOCK_TITLE).toBe('Phát hiện gian lận: Bạn đã rời khỏi màn hình thi 3 lần!');
    expect(CHEAT_LOCK_CONTACT).toContain('Giảng viên phụ trách cuộc thi');
    expect(t).toContain('Đóng phòng thi');
  });
});

describe('LeaveWarningBanner', () => {
  it('cuộc thi: nêu số lần và ngưỡng khóa', () => {
    const t = text(renderToString(<LeaveWarningBanner count={1} limit={3} teacherNotified />));
    expect(t).toContain('lần 1/3');
    expect(t).toContain('Giảng viên đã được thông báo');
    expect(t).toContain('khóa và nộp tự động');
  });

  it('bài lớp: nhắc ngưỡng 2 lần khi giảng viên chưa được báo', () => {
    const t = text(renderToString(<LeaveWarningBanner count={2} notifyAfter={2} />));
    expect(t).toContain('Rời quá 2 lần giảng viên sẽ được thông báo');
    const notified = text(renderToString(<LeaveWarningBanner count={3} notifyAfter={2} teacherNotified />));
    expect(notified).toContain('Giảng viên đã được thông báo');
    expect(notified).not.toContain('Rời quá 2 lần');
  });
});
