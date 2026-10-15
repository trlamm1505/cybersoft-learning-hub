/**
 * Biến tiến độ Block Puzzle thành chỉ số dễ hiểu cho học sinh lớp 3-5: sao, số màn đã phá đảo, huy hiệu.
 * Hàm thuần (không gọi mạng) để kiểm thử độc lập.
 */
export interface KidGameInfo {
  id: string;
  title: string;
  levels: number;
  slug: (level: number) => string;
}

export interface KidGameProgress {
  id: string;
  title: string;
  done: number;
  total: number;
  cleared: boolean;
}

export interface KidBadge {
  id: string;
  title: string;
  emoji: string;
  /** Gợi ý cách nhận huy hiệu (hiện khi chưa đạt). */
  hint: string;
  earned: boolean;
}

export interface KidProgressSummary {
  stars: number;
  levelsDone: number;
  levelsTotal: number;
  games: KidGameProgress[];
  badges: KidBadge[];
}

/** Huy hiệu theo game: id game trong BUILTIN_GAMES -> huy hiệu nhận khi phá đảo toàn bộ game đó. */
const GAME_BADGES: Record<string, { title: string; emoji: string }> = {
  'blockly-maze': { title: 'Dũng sĩ Mê Cung', emoji: '🛡️' },
  'blockly-turtle': { title: 'Họa sĩ rùa', emoji: '🐢' },
  'blockly-bird': { title: 'Chú chim thông thái', emoji: '🐦' },
  'blockly-puzzle': { title: 'Nhà sinh vật nhí', emoji: '🦁' },
};

/**
 * @param done        tập slug màn đã hoàn thành (builtin + bài Block Puzzle do giảng viên đăng)
 * @param games       các game dựng sẵn
 * @param extraLevels slug các màn khác (bài Block Puzzle của giảng viên) tính vào tổng
 */
export function summarizeKidProgress(done: Set<string>, games: KidGameInfo[], extraLevels: string[] = []): KidProgressSummary {
  const gameProgress: KidGameProgress[] = games.map((g) => {
    const slugs = Array.from({ length: g.levels }, (_, i) => g.slug(i + 1));
    const count = slugs.filter((s) => done.has(s)).length;
    return { id: g.id, title: g.title, done: count, total: g.levels, cleared: g.levels > 0 && count === g.levels };
  });
  const extraDone = extraLevels.filter((s) => done.has(s)).length;
  const levelsDone = gameProgress.reduce((n, g) => n + g.done, 0) + extraDone;
  const levelsTotal = gameProgress.reduce((n, g) => n + g.total, 0) + extraLevels.length;

  const badges: KidBadge[] = [
    {
      id: 'explorer',
      title: 'Nhà thám hiểm nhí',
      emoji: '🧭',
      hint: 'Phá đảo màn chơi đầu tiên',
      earned: levelsDone >= 1,
    },
    ...gameProgress
      .filter((g) => GAME_BADGES[g.id])
      .map((g) => ({
        id: g.id,
        title: GAME_BADGES[g.id].title,
        emoji: GAME_BADGES[g.id].emoji,
        hint: `Phá đảo hết trò ${g.title}`,
        earned: g.cleared,
      })),
    {
      id: 'champion',
      title: 'Nhà vô địch nhí',
      emoji: '👑',
      hint: 'Phá đảo tất cả các màn chơi',
      earned: levelsTotal > 0 && levelsDone === levelsTotal,
    },
  ];

  return { stars: levelsDone, levelsDone, levelsTotal, games: gameProgress, badges };
}
