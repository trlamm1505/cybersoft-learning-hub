/** Hàng đợi đã đầy: từ chối ngay thay vì xếp hàng vô hạn. */
export class ConcurrencyLimitExceededError extends Error {}

/**
 * Semaphore đơn giản: tối đa `maxConcurrent` tác vụ chạy cùng lúc, tối đa
 * `maxQueue` tác vụ chờ. Dùng để chặn việc bắn hàng loạt request sinh ra
 * hàng loạt container/tiến trình Python trên host.
 */
export class ConcurrencyLimiter {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueue: number,
  ) {}

  get activeCount() {
    return this.active;
  }

  get queuedCount() {
    return this.waiting.length;
  }

  /**
   * `rejectWhenBusy`: hàng đợi đầy thì ném lỗi ngay (dùng cho request tương
   * tác của người dùng). Không bật: luôn chờ tới lượt (judge, contest).
   */
  async run<T>(
    task: () => Promise<T>,
    { rejectWhenBusy = false }: { rejectWhenBusy?: boolean } = {},
  ): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      if (rejectWhenBusy && this.waiting.length >= this.maxQueue) {
        throw new ConcurrencyLimitExceededError(
          'Hệ thống chạy code đang quá tải, vui lòng thử lại sau ít phút.',
        );
      }
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    } else {
      this.active++;
    }
    try {
      return await task();
    } finally {
      const next = this.waiting.shift();
      // Chuyển thẳng suất chạy cho tác vụ đang chờ (giữ nguyên active).
      if (next) next();
      else this.active--;
    }
  }
}

const positiveInt = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

let runnerLimiter: ConcurrencyLimiter | undefined;

/** Bộ giới hạn dùng chung cho mọi lần chạy/kiểm tra code Python. */
export function getCodeRunnerLimiter(): ConcurrencyLimiter {
  runnerLimiter ??= new ConcurrencyLimiter(
    positiveInt(process.env.CODE_RUNNER_MAX_CONCURRENCY, 4),
    positiveInt(process.env.CODE_RUNNER_MAX_QUEUE, 50),
  );
  return runnerLimiter;
}
