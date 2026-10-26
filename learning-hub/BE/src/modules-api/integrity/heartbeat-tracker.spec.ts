import { HeartbeatTracker, SUSPICIOUS_GAP_MS } from './heartbeat-tracker';

describe('HeartbeatTracker', () => {
  it('nhịp đều 5 giây không nghi vấn', () => {
    const t = new HeartbeatTracker();
    t.beat('k', false, 0);
    expect(t.beat('k', false, 5000).suspicious).toBe(false);
    expect(t.beat('k', false, 10_000).suspicious).toBe(false);
  });

  it('mất liên tục 2 nhịp không do offline -> nghi vấn', () => {
    const t = new HeartbeatTracker();
    t.beat('k', false, 0);
    const r = t.beat('k', false, SUSPICIOUS_GAP_MS + 1);
    expect(r.suspicious).toBe(true);
  });

  it('mất do offline cục bộ thì không tính', () => {
    const t = new HeartbeatTracker();
    t.beat('k', false, 0);
    expect(t.beat('k', true, 60_000).suspicious).toBe(false);
  });

  it('mất 1 nhịp (trễ nhẹ) vẫn trong dung sai', () => {
    const t = new HeartbeatTracker();
    t.beat('k', false, 0);
    expect(t.beat('k', false, 9000).suspicious).toBe(false);
  });

  it('mỗi học viên/bài một khóa riêng', () => {
    const t = new HeartbeatTracker();
    t.beat('a', false, 0);
    expect(t.beat('b', false, 100_000).suspicious).toBe(false);
  });
});
