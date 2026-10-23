/**
 * Xếp hạng Block Puzzle theo từng game. Chỉ bé ĐÃ PHÁ ĐẢO 100% các màn của game đó mới có hạng.
 * Giữa các bé đã phá đảo: TỔNG THỜI GIAN chơi (từ lúc xong màn đầu tới lúc xong màn cuối) càng NGẮN thì hạng càng CAO;
 * bằng nhau thì bé phá đảo sớm hơn (thời điểm xong màn cuối nhỏ hơn) xếp trước.
 * Hàm thuần để dễ kiểm thử.
 */
export interface StandingInput {
  gameId: string;
  userId: string;
  /** Số màn HỢP LỆ (đúng slug của game) bé đã hoàn thành. */
  levelsCompleted: number;
  firstCompletedAt: Date;
  lastCompletedAt: Date;
}

export interface Standing extends StandingInput {
  /** Hạng 1..n nếu đã phá đảo; null nếu chưa phá đảo 100% (không được lên bảng). */
  rank: number | null;
}

export const isCleared = (levelsCompleted: number, totalLevels: number): boolean =>
  totalLevels > 0 && levelsCompleted >= totalLevels;

const span = (r: StandingInput) => r.lastCompletedAt.getTime() - r.firstCompletedAt.getTime();

/**
 * Thời gian tối thiểu (giây) giữa 2 màn liên tiếp (minCompletionTimeSec). Giải một màn Blockly thật cần hơn thế nhiều;
 * ngưỡng này chỉ nhằm chặn script gọi API liên tục. Đặt lại bằng biến môi trường BLOCK_PUZZLE_MIN_LEVEL_SEC.
 */
export const DEFAULT_MIN_COMPLETION_SEC = 10;

export const minCompletionTimeSec = (): number => {
  const raw = process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC;
  if (raw === undefined || raw.trim() === '') return DEFAULT_MIN_COMPLETION_SEC;
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : DEFAULT_MIN_COMPLETION_SEC;
};

/** Tổng thời gian sàn để phá đảo cả game: (số màn - 1) khoảng cách tối thiểu giữa các màn. */
export const minTotalSpanMs = (totalLevels: number, minSecPerLevel = minCompletionTimeSec()): number =>
  Math.max(0, totalLevels - 1) * minSecPerLevel * 1000;

/**
 * Trả về TẤT CẢ các dòng; bé đã phá đảo được đánh hạng theo thứ tự, bé chưa phá đảo có rank = null.
 * Bé phá đảo nhanh hơn tổng thời gian sàn (minSpanMs) cũng không có hạng (nghi gửi tự động).
 */
export function rankStandings(rows: StandingInput[], totalLevels: number, minSpanMs = 0): Standing[] {
  const eligible = (r: StandingInput) => isCleared(r.levelsCompleted, totalLevels) && span(r) >= minSpanMs;
  const cleared = rows
    .filter(eligible)
    .sort(
      (a, b) =>
        span(a) - span(b) ||
        a.lastCompletedAt.getTime() - b.lastCompletedAt.getTime() ||
        a.userId.localeCompare(b.userId),
    )
    .map((r, i): Standing => ({ ...r, rank: i + 1 }));
  const rest = rows
    .filter((r) => !eligible(r))
    .map((r): Standing => ({ ...r, rank: null }));
  return [...cleared, ...rest];
}
