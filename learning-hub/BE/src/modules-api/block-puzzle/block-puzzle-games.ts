/**
 * Danh sách màn hợp lệ của từng game Block Puzzle, dùng để xác định "phá đảo 100%".
 * Game dựng sẵn khai báo ở đây (phải khớp FE/src/games/*: MAZE/TURTLE/BIRD_LEVEL_COUNT = 10, Ghép hình = 1 màn);
 * game của giảng viên (mặc định "robot-ve-nha") lấy từ các bài Block Puzzle đã đăng trong CSDL.
 */
export const BUILTIN_GAME_SLUGS: Record<string, string[]> = {
  'blockly-maze': Array.from({ length: 10 }, (_, i) => `blockly-maze-level-${i + 1}`),
  'blockly-turtle': Array.from({ length: 10 }, (_, i) => `blockly-turtle-level-${i + 1}`),
  'blockly-bird': Array.from({ length: 10 }, (_, i) => `blockly-bird-level-${i + 1}`),
  'blockly-puzzle': ['blockly-puzzle'],
};

export const DEFAULT_LESSON_GAME_ID = 'robot-ve-nha';

interface LessonRow {
  slug: string;
  status?: string;
  blockPuzzle?: { gameId?: string };
}

/** Gộp game dựng sẵn và game từ bài Block Puzzle đã đăng: gameId -> tập slug màn hợp lệ. */
export function buildGameSlugs(lessons: LessonRow[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>(
    Object.entries(BUILTIN_GAME_SLUGS).map(([id, slugs]) => [id, new Set(slugs)]),
  );
  for (const l of lessons) {
    if (!(l.status === 'published' || !l.status) || !l.blockPuzzle) continue;
    const id = l.blockPuzzle.gameId || DEFAULT_LESSON_GAME_ID;
    if (BUILTIN_GAME_SLUGS[id]) continue; // game dựng sẵn không bị ghi đè bởi bài của giảng viên
    const set = map.get(id) ?? new Set<string>();
    set.add(l.slug);
    map.set(id, set);
  }
  return map;
}
