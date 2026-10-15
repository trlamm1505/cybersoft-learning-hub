import { describe, expect, it } from 'vitest';
import {
  allKidGames,
  buildKidRecords,
  ageGroupLabel,
  formatKidDate,
  formatKidDuration,
  isGameCleared,
  lessonGamesFromLessons,
  summarizeKidProgress,
  topTitle,
  type KidGameInfo,
} from './kidProgress';

const game = (id: string, levels: number): KidGameInfo => ({ id, title: id, levels, slug: (n) => `${id}-${n}` });
const games = [game('blockly-maze', 3), game('blockly-turtle', 2)];

describe('summarizeKidProgress', () => {
  it('chưa chơi: 0 sao, chưa có huy hiệu nào', () => {
    const s = summarizeKidProgress(new Set(), games);
    expect(s.stars).toBe(0);
    expect(s.levelsTotal).toBe(5);
    expect(s.badges.every((b) => !b.earned)).toBe(true);
  });

  it('mỗi màn xong = 1 sao; màn đầu tiên cấp "Nhà thám hiểm nhí"', () => {
    const s = summarizeKidProgress(new Set(['blockly-maze-1']), games);
    expect(s.stars).toBe(1);
    expect(s.badges.find((b) => b.id === 'explorer')?.earned).toBe(true);
    expect(s.badges.find((b) => b.id === 'blockly-maze')?.earned).toBe(false);
  });

  it('phá đảo hết một game thì có huy hiệu game đó; hết tất cả thì có Nhà vô địch', () => {
    const half = summarizeKidProgress(new Set(['blockly-turtle-1', 'blockly-turtle-2']), games);
    expect(half.badges.find((b) => b.id === 'blockly-turtle')?.earned).toBe(true);
    expect(half.badges.find((b) => b.id === 'champion')?.earned).toBe(false);
    const all = summarizeKidProgress(
      new Set(['blockly-maze-1', 'blockly-maze-2', 'blockly-maze-3', 'blockly-turtle-1', 'blockly-turtle-2']),
      games,
    );
    expect(all.badges.find((b) => b.id === 'champion')?.earned).toBe(true);
  });
});

describe('đủ 5 game (gồm Robot về nhà)', () => {
  const lessons = [
    { slug: 'r2', status: 'published', type: 'block', blockPuzzle: { gameId: 'robot-ve-nha', gameTitle: 'Robot Về Nhà', order: 2 } },
    { slug: 'r1', status: 'published', type: 'block', blockPuzzle: { gameId: 'robot-ve-nha', gameTitle: 'Robot Về Nhà', order: 1 } },
    { slug: 'draft', status: 'draft', type: 'block', blockPuzzle: { gameId: 'robot-ve-nha', order: 3 } },
    { slug: 'khac', status: 'published', type: 'coding' },
  ];

  it('gom bài đã đăng thành game Robot, đúng thứ tự order, bỏ bản nháp và bài không phải block', () => {
    const [robot] = lessonGamesFromLessons(lessons);
    expect(robot).toMatchObject({ id: 'robot-ve-nha', title: 'Robot Về Nhà', levels: 2 });
    expect([robot.slug(1), robot.slug(2)]).toEqual(['r1', 'r2']);
  });

  it('có thêm game thứ 5 trong tiến độ và huy hiệu "Kỹ sư Robot nhí"', () => {
    const builtin = ['blockly-maze', 'blockly-turtle', 'blockly-bird', 'blockly-puzzle'].map((id) => game(id, 1));
    const list = allKidGames(builtin, lessonGamesFromLessons(lessons));
    expect(list).toHaveLength(5);
    const s = summarizeKidProgress(new Set(['r1', 'r2']), list);
    expect(s.games).toHaveLength(5);
    expect(s.levelsTotal).toBe(6);
    const robotBadge = s.badges.find((b) => b.id === 'robot-ve-nha');
    expect(robotBadge).toMatchObject({ title: 'Kỹ sư Robot nhí', earned: true });
    expect(s.badges.filter((b) => b.id !== 'explorer' && b.id !== 'champion')).toHaveLength(5);
  });

  it('không trùng id khi game đã có sẵn', () => {
    expect(allKidGames([game('a', 1)], [game('a', 2), game('b', 1)]).map((g) => g.id)).toEqual(['a', 'b']);
  });
});

describe('isGameCleared', () => {
  it('chỉ true khi có đủ mọi màn của game đó', () => {
    expect(isGameCleared(games, 'blockly-turtle', new Set(['blockly-turtle-1']))).toBe(false);
    expect(isGameCleared(games, 'blockly-turtle', new Set(['blockly-turtle-1', 'blockly-turtle-2']))).toBe(true);
    expect(isGameCleared(games, 'khong-co', new Set(['x']))).toBe(false);
  });
});

describe('topTitle', () => {
  it('chưa có gì là Bé tập sự; có huy hiệu thì lấy huy hiệu cao nhất', () => {
    expect(topTitle(summarizeKidProgress(new Set(), games).badges).title).toBe('Bé tập sự');
    expect(topTitle(summarizeKidProgress(new Set(['blockly-maze-1']), games).badges).title).toBe('Nhà thám hiểm nhí');
    expect(topTitle(summarizeKidProgress(new Set(['blockly-turtle-1', 'blockly-turtle-2']), games).badges).title).toBe('Họa sĩ rùa');
  });
});

describe('buildKidRecords', () => {
  const rec = (gameId: string, rank: number, levels: number, first: string, last: string) => ({
    gameId,
    rank,
    levelsCompleted: levels,
    firstCompletedAt: first,
    lastCompletedAt: last,
  });

  it('Hạng 1, Top 3, Phá đảo và Phá đảo Thần tốc, mới nhất trước', () => {
    const out = buildKidRecords(
      [
        rec('blockly-maze', 1, 3, '2026-10-10T08:00:00Z', '2026-10-10T08:07:00Z'), // 7 phút cho 3 màn (<= 9 phút)
        rec('blockly-turtle', 3, 1, '2026-10-12T08:00:00Z', '2026-10-12T08:00:00Z'),
      ],
      games,
    );
    expect(out[0].title).toBe('Lọt Top 3 blockly-turtle'); // mới nhất trước
    expect(out.map((r) => r.title).sort()).toEqual(
      ['Lọt Top 3 blockly-turtle', 'Đạt Hạng 1 blockly-maze', 'Phá đảo blockly-maze', 'Phá đảo Thần tốc blockly-maze'].sort(),
    );
  });

  it('phá đảo chậm hơn 3 phút mỗi màn thì không có Thần tốc; game lạ bị bỏ qua', () => {
    const out = buildKidRecords(
      [rec('blockly-maze', 5, 3, '2026-10-01T00:00:00Z', '2026-10-01T00:30:00Z'), rec('khong-co', 1, 1, '2026-10-01', '2026-10-01')],
      games,
    );
    expect(out.map((r) => r.id)).toEqual(['blockly-maze-clear']);
  });
});

describe('bản ghi chưa phá đảo', () => {
  it('rank null thì không tạo kỷ lục nào', () => {
    const out = buildKidRecords(
      [{ gameId: 'blockly-maze', rank: null, levelsCompleted: 2, firstCompletedAt: '2026-10-01', lastCompletedAt: '2026-10-02' }],
      games,
    );
    expect(out).toEqual([]);
  });
});

describe('formatKidDuration / ageGroupLabel', () => {
  it('định dạng thời gian dễ đọc', () => {
    expect(formatKidDuration(20_000)).toBe('dưới 1 phút');
    expect(formatKidDuration(5 * 60_000)).toBe('5 phút');
    expect(formatKidDuration(125 * 60_000)).toBe('2 giờ 5 phút');
    expect(formatKidDuration(3 * 24 * 3600_000)).toBe('3 ngày');
  });
  it('nhãn khối lớp', () => {
    expect(ageGroupLabel('3-5')).toBe('Lớp 3–5');
    expect(ageGroupLabel('10-12')).toBe('Lớp 10–12');
    expect(ageGroupLabel(null)).toBe('Học sinh');
  });
});

describe('formatKidDate', () => {
  it('dd/mm/yyyy', () => {
    expect(formatKidDate('2026-10-15T05:00:00Z')).toMatch(/^\d{2}\/10\/2026$/);
  });
});
