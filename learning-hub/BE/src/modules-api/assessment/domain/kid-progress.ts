/**
 * Tiến độ khối 3-5 cho GIẢNG VIÊN: được SUY RA từ chính collection `block_puzzle_progress` mà trang hồ sơ của bé (/profile) đọc,
 * không có bảng tiến độ nào chạy song song. Công thức khớp 100% FE/src/common/kidProgress.ts (summarizeKidProgress):
 *   ⭐ sao = số màn HỢP LỆ bé đã hoàn thành  (mỗi màn 1 sao, màn của game không tồn tại bị bỏ qua)
 *   Ải = cứ 3 sao lên một ải (Ải 1 khi chưa có sao).
 */
export const STARS_PER_LEVEL_STEP = 3;
/** Bé có tiến độ nhưng chưa phá đảo mà ngừng chơi quá 3 ngày -> cờ STUCK_ALERT để giảng viên hỗ trợ ở buổi học sau. */
export const STUCK_AFTER_MS = 3 * 24 * 3600 * 1000;

export interface CompletedLevel {
  gameId: string;
  slug: string;
  completedAt: Date | string;
}

export interface StuckAlert {
  active: boolean;
  level: number | null;
  since: Date | null;
}

export interface DerivedKidProgress {
  starsEarned: number;
  levelsDone: number;
  levelsTotal: number;
  currentLevel: number;
  lastActiveAt: Date | null;
  stuckAlert: StuckAlert;
}

export const kidLevelOf = (stars: number): number => Math.floor(Math.max(0, stars) / STARS_PER_LEVEL_STEP) + 1;

/** Tổng số màn hợp lệ của mọi game (mẫu số "x/46 màn" trên hồ sơ của bé). */
export const totalLevels = (validSlugsByGame: Map<string, Set<string>>): number => [...validSlugsByGame.values()].reduce((n, s) => n + s.size, 0);

/**
 * @param completed mọi bản ghi block_puzzle_progress của bé (có thể lẫn slug lạ/trùng)
 * @param validSlugsByGame gameId -> tập slug màn hợp lệ (BE: buildGameSlugs)
 */
export function deriveKidProgress(completed: CompletedLevel[], validSlugsByGame: Map<string, Set<string>>, now: Date): DerivedKidProgress {
  const seen = new Set<string>();
  let last: Date | null = null;
  for (const c of completed) {
    if (!validSlugsByGame.get(c.gameId)?.has(c.slug) || seen.has(`${c.gameId}\u0000${c.slug}`)) continue;
    seen.add(`${c.gameId}\u0000${c.slug}`);
    const at = new Date(c.completedAt);
    if (Number.isFinite(at.getTime()) && (!last || at > last)) last = at;
  }
  const levelsDone = seen.size;
  const levelsTotal = totalLevels(validSlugsByGame);
  const currentLevel = kidLevelOf(levelsDone);
  const stuck = levelsDone > 0 && levelsDone < levelsTotal && last !== null && now.getTime() - last.getTime() > STUCK_AFTER_MS;
  return {
    starsEarned: levelsDone,
    levelsDone,
    levelsTotal,
    currentLevel,
    lastActiveAt: last,
    stuckAlert: stuck && last ? { active: true, level: currentLevel, since: new Date(last.getTime() + STUCK_AFTER_MS) } : { active: false, level: null, since: null },
  };
}
