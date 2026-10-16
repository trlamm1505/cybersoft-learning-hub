import {
  ConcurrencyLimitExceededError,
  ConcurrencyLimiter,
} from './concurrency-limiter';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

describe('[H1] ConcurrencyLimiter', () => {
  it('không bao giờ chạy quá maxConcurrent tác vụ cùng lúc', async () => {
    const limiter = new ConcurrencyLimiter(2, 10);
    let running = 0;
    let peak = 0;
    const gates = Array.from({ length: 5 }, deferred);
    const tasks = gates.map((g) =>
      limiter.run(async () => {
        running++;
        peak = Math.max(peak, running);
        await g.promise;
        running--;
      }),
    );

    await Promise.resolve();
    expect(limiter.activeCount).toBe(2);
    expect(limiter.queuedCount).toBe(3);
    gates.forEach((g) => g.resolve());
    await Promise.all(tasks);

    expect(peak).toBe(2);
    expect(limiter.activeCount).toBe(0);
  });

  it('rejectWhenBusy: hàng đợi đầy thì từ chối ngay', async () => {
    const limiter = new ConcurrencyLimiter(1, 1);
    const gate = deferred();
    const first = limiter.run(() => gate.promise);
    const queued = limiter.run(() => Promise.resolve('ok'), {
      rejectWhenBusy: true,
    });

    await expect(
      limiter.run(() => Promise.resolve('x'), { rejectWhenBusy: true }),
    ).rejects.toBeInstanceOf(ConcurrencyLimitExceededError);

    gate.resolve();
    await first;
    await expect(queued).resolves.toBe('ok');
  });

  it('không bật rejectWhenBusy (judge, contest): luôn chờ tới lượt, không bị từ chối', async () => {
    const limiter = new ConcurrencyLimiter(1, 0);
    const gate = deferred();
    const first = limiter.run(() => gate.promise);
    const waiting = limiter.run(() => Promise.resolve('đã chạy'));

    gate.resolve();
    await first;
    await expect(waiting).resolves.toBe('đã chạy');
  });

  it('tác vụ lỗi vẫn trả suất chạy', async () => {
    const limiter = new ConcurrencyLimiter(1, 5);
    await expect(
      limiter.run(() => Promise.reject(new Error('x'))),
    ).rejects.toThrow('x');
    await expect(limiter.run(() => Promise.resolve(1))).resolves.toBe(1);
    expect(limiter.activeCount).toBe(0);
  });
});
