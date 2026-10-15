/**
 * Biến tiến độ Block Puzzle thành chỉ số dễ hiểu cho học sinh lớp 3-5: sao, số màn đã phá đảo, huy hiệu,
 * kỷ lục cá nhân. Hàm thuần (không gọi mạng) để kiểm thử độc lập.
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

/** Id game Robot về nhà (bài Block Puzzle do giảng viên đăng, gameId mặc định khi bài không khai báo). */
export const ROBOT_GAME_ID = 'robot-ve-nha';

/** Huy hiệu theo game: id game -> huy hiệu nhận khi phá đảo toàn bộ game đó (đủ 5 game). */
const GAME_BADGES: Record<string, { title: string; emoji: string }> = {
  'blockly-maze': { title: 'Dũng sĩ Mê Cung', emoji: '🛡️' },
  'blockly-turtle': { title: 'Họa sĩ rùa', emoji: '🐢' },
  'blockly-bird': { title: 'Chú chim thông thái', emoji: '🐦' },
  'blockly-puzzle': { title: 'Nhà sinh vật nhí', emoji: '🦁' },
  [ROBOT_GAME_ID]: { title: 'Kỹ sư Robot nhí', emoji: '🤖' },
};

interface LessonLike {
  slug: string;
  status?: string;
  type?: string;
  blockPuzzle?: { gameId?: string; gameTitle?: string; order?: number };
}

/**
 * Gom bài Block Puzzle do giảng viên đăng thành các game (mặc định "Robot Về Nhà"), cùng cách
 * BlockPuzzlePage nhóm thẻ game. Mỗi game có số màn = số bài, slug màn n = bài thứ n theo `order`.
 */
export function lessonGamesFromLessons(lessons: LessonLike[]): KidGameInfo[] {
  const map = new Map<string, { title: string; items: Array<{ slug: string; order: number }> }>();
  for (const l of lessons) {
    if (!(l.status === 'published' || !l.status) || l.type !== 'block' || !l.blockPuzzle) continue;
    const id = l.blockPuzzle.gameId || ROBOT_GAME_ID;
    const entry = map.get(id) ?? { title: l.blockPuzzle.gameTitle || 'Robot Về Nhà', items: [] };
    entry.items.push({ slug: l.slug, order: l.blockPuzzle.order ?? 0 });
    map.set(id, entry);
  }
  return Array.from(map, ([id, { title, items }]) => {
    const slugs = items.sort((a, b) => a.order - b.order).map((i) => i.slug);
    return { id, title, levels: slugs.length, slug: (n: number) => slugs[n - 1] };
  });
}

/** Danh sách đủ các game (dựng sẵn + của giảng viên), loại trùng id. */
export function allKidGames(builtin: KidGameInfo[], lessonGames: KidGameInfo[]): KidGameInfo[] {
  const ids = new Set(builtin.map((g) => g.id));
  return [...builtin, ...lessonGames.filter((g) => !ids.has(g.id))];
}

/** Game đã được phá đảo 100% với tập slug `done` chưa. */
export function isGameCleared(games: KidGameInfo[], gameId: string, done: Set<string>): boolean {
  const g = games.find((x) => x.id === gameId);
  if (!g || g.levels <= 0) return false;
  return Array.from({ length: g.levels }, (_, i) => g.slug(i + 1)).every((s) => done.has(s));
}

/** @param done tập slug màn đã hoàn thành  @param games mọi game (xem allKidGames) */
export function summarizeKidProgress(done: Set<string>, games: KidGameInfo[]): KidProgressSummary {
  const gameProgress: KidGameProgress[] = games.map((g) => {
    const count = Array.from({ length: g.levels }, (_, i) => g.slug(i + 1)).filter((s) => done.has(s)).length;
    return { id: g.id, title: g.title, done: count, total: g.levels, cleared: g.levels > 0 && count === g.levels };
  });
  const levelsDone = gameProgress.reduce((n, g) => n + g.done, 0);
  const levelsTotal = gameProgress.reduce((n, g) => n + g.total, 0);

  const badges: KidBadge[] = [
    { id: 'explorer', title: 'Nhà thám hiểm nhí', emoji: '🧭', hint: 'Phá đảo màn chơi đầu tiên', earned: levelsDone >= 1 },
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

/** Danh hiệu cao nhất đang có: Vô địch > huy hiệu phá đảo game (nhiều nhất thì vẫn là một tên) > Thám hiểm > bé tập sự. */
export function topTitle(badges: KidBadge[]): { title: string; emoji: string } {
  const earned = badges.filter((b) => b.earned);
  const champion = earned.find((b) => b.id === 'champion');
  if (champion) return champion;
  const gameBadge = earned.filter((b) => b.id !== 'explorer').pop();
  if (gameBadge) return gameBadge;
  const explorer = earned.find((b) => b.id === 'explorer');
  return explorer ?? { title: 'Bé tập sự', emoji: '🌱' };
}

export interface ServerRecord {
  gameId: string;
  /** Null khi bé chưa phá đảo 100% game đó (chưa có hạng). */
  rank: number | null;
  levelsCompleted: number;
  totalLevels?: number;
  firstCompletedAt: string;
  lastCompletedAt: string;
}

export interface KidRecord {
  id: string;
  title: string;
  /** ISO date của mốc đạt được. */
  date: string;
  emoji: string;
}

/** Phá đảo "Thần tốc": trung bình không quá 3 phút cho mỗi màn (tính từ màn đầu tới màn cuối). */
export const FAST_MS_PER_LEVEL = 3 * 60 * 1000;

/**
 * Kỷ lục cá nhân từ dữ liệu server: Hạng 1 / Top 3 của từng game, Phá đảo, Phá đảo Thần tốc
 * (phá đảo trọn game, trung bình không quá 3 phút mỗi màn; game 1 màn không có). Mới nhất xếp trước.
 */
export function buildKidRecords(records: ServerRecord[], games: KidGameInfo[]): KidRecord[] {
  const out: KidRecord[] = [];
  for (const r of records) {
    const game = games.find((g) => g.id === r.gameId);
    if (!game) continue;
    if (r.rank === null) continue; // chưa phá đảo 100% thì chưa có kỷ lục
    if (r.rank === 1) out.push({ id: `${r.gameId}-rank1`, title: `Đạt Hạng 1 ${game.title}`, date: r.lastCompletedAt, emoji: '🥇' });
    else if (r.rank <= 3) out.push({ id: `${r.gameId}-top3`, title: `Lọt Top 3 ${game.title}`, date: r.lastCompletedAt, emoji: r.rank === 2 ? '🥈' : '🥉' });
    if (game.levels > 0 && r.levelsCompleted >= game.levels) {
      out.push({ id: `${r.gameId}-clear`, title: `Phá đảo ${game.title}`, date: r.lastCompletedAt, emoji: '🎉' });
      const span = new Date(r.lastCompletedAt).getTime() - new Date(r.firstCompletedAt).getTime();
      if (game.levels > 1 && span <= game.levels * FAST_MS_PER_LEVEL) out.push({ id: `${r.gameId}-fast`, title: `Phá đảo Thần tốc ${game.title}`, date: r.lastCompletedAt, emoji: '⚡' });
    }
  }
  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** "2 giờ 5 phút", "3 ngày", "dưới 1 phút": thời gian từ màn đầu tới màn cuối. */
export function formatKidDuration(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'dưới 1 phút';
  if (min < 60) return `${min} phút`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return min % 60 ? `${hours} giờ ${min % 60} phút` : `${hours} giờ`;
  return `${Math.floor(hours / 24)} ngày`;
}

/** Nhãn khối lớp của học sinh (ageGroup trong hồ sơ). */
export function ageGroupLabel(ageGroup: string | null | undefined): string {
  return ageGroup === '3-5' ? 'Lớp 3–5' : ageGroup === '6-9' ? 'Lớp 6–9' : ageGroup === '10-12' ? 'Lớp 10–12' : 'Học sinh';
}

/** dd/mm/yyyy theo ngày của máy người xem. */
export function formatKidDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
