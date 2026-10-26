import { DEFAULT_MIN_COMPLETION_SEC, isCleared, minCompletionTimeSec, minTotalSpanMs, rankStandings } from './block-puzzle-standings';
import { buildGameSlugs } from './block-puzzle-games';

const row = (userId: string, levels: number, first: string, last: string) => ({
  gameId: 'g',
  userId,
  levelsCompleted: levels,
  firstCompletedAt: new Date(first),
  lastCompletedAt: new Date(last),
});

describe('rankStandings (chỉ bé phá đảo 100% mới có hạng)', () => {
  it('bé chưa phá đảo có rank = null, dù đã chơi nhiều màn', () => {
    const ranked = rankStandings([row('a', 9, '2026-10-01', '2026-10-02'), row('b', 10, '2026-10-03', '2026-10-04')], 10);
    expect(ranked.find((r) => r.userId === 'b')?.rank).toBe(1);
    expect(ranked.find((r) => r.userId === 'a')?.rank).toBeNull();
  });

  it('tổng thời gian càng ngắn hạng càng cao, bằng nhau thì phá đảo sớm hơn xếp trước', () => {
    const ranked = rankStandings(
      [
        row('late', 3, '2026-10-05T00:00:00Z', '2026-10-06T00:00:00Z'),
        row('slow', 3, '2026-10-01T00:00:00Z', '2026-10-04T00:00:00Z'),
        row('fast', 3, '2026-10-04T00:00:00Z', '2026-10-04T00:00:00Z'),
      ],
      3,
    );
    // fast: 0 phút, late: 1 ngày, slow: 3 ngày
    expect(ranked.map((r) => [r.userId, r.rank])).toEqual([
      ['fast', 1],
      ['late', 2],
      ['slow', 3],
    ]);
  });

  it('bé phá đảo muộn hơn nhưng chơi nhanh hơn thì xếp trên bé phá đảo sớm nhưng chơi lâu', () => {
    const ranked = rankStandings(
      [
        row('early-slow', 10, '2026-10-01T08:00:00Z', '2026-10-01T08:50:00Z'), // 50 phút, xong sớm
        row('late-fast', 10, '2026-10-09T08:00:00Z', '2026-10-09T08:30:00Z'), // 30 phút, xong muộn
      ],
      10,
    );
    expect(ranked.map((r) => r.userId)).toEqual(['late-fast', 'early-slow']);
  });

  it('hai bé cùng tổng thời gian thì bé xong sớm hơn xếp trước', () => {
    const ranked = rankStandings(
      [
        row('b', 10, '2026-10-02T08:00:00Z', '2026-10-02T08:40:00Z'),
        row('a', 10, '2026-10-01T08:00:00Z', '2026-10-01T08:40:00Z'),
      ],
      10,
    );
    expect(ranked.map((r) => r.userId)).toEqual(['a', 'b']);
  });

  it('game không có màn nào (tổng 0) thì không ai có hạng; không đổi mảng đầu vào', () => {
    const input = [row('a', 1, '2026-10-01', '2026-10-01')];
    expect(rankStandings(input, 0)[0].rank).toBeNull();
    expect(input).toHaveLength(1);
  });

  it('isCleared', () => {
    expect(isCleared(10, 10)).toBe(true);
    expect(isCleared(9, 10)).toBe(false);
    expect(isCleared(1, 0)).toBe(false);
  });
});

describe('chống gian lận thời gian', () => {
  it('phá đảo nhanh hơn tổng thời gian sàn thì không có hạng, dù đủ màn', () => {
    const floor = minTotalSpanMs(10, 10); // 9 khoảng x 10s = 90s
    expect(floor).toBe(90_000);
    const ranked = rankStandings(
      [
        row('bot', 10, '2026-10-01T00:00:00Z', '2026-10-01T00:00:20Z'), // 20s: quá nhanh
        row('kid', 10, '2026-10-02T00:00:00Z', '2026-10-02T00:10:00Z'), // 10 phút
      ],
      10,
      floor,
    );
    expect(ranked.find((r) => r.userId === 'bot')?.rank).toBeNull();
    expect(ranked.find((r) => r.userId === 'kid')?.rank).toBe(1);
  });

  it('game 1 màn thì sàn bằng 0', () => {
    expect(minTotalSpanMs(1, 10)).toBe(0);
    expect(minTotalSpanMs(0, 10)).toBe(0);
  });

  it('minCompletionTimeSec mặc định 10, đọc được từ biến môi trường, giá trị sai thì về mặc định', () => {
    const old = process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC;
    try {
      delete process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC;
      expect(minCompletionTimeSec()).toBe(DEFAULT_MIN_COMPLETION_SEC);
      process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC = '15';
      expect(minCompletionTimeSec()).toBe(15);
      process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC = 'abc';
      expect(minCompletionTimeSec()).toBe(DEFAULT_MIN_COMPLETION_SEC);
      process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC = '-3';
      expect(minCompletionTimeSec()).toBe(DEFAULT_MIN_COMPLETION_SEC);
    } finally {
      if (old === undefined) delete process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC;
      else process.env.BLOCK_PUZZLE_MIN_LEVEL_SEC = old;
    }
  });
});

describe('buildGameSlugs', () => {
  it('gồm game dựng sẵn và game từ bài đã đăng; bỏ bản nháp, không ghi đè game dựng sẵn', () => {
    const map = buildGameSlugs([
      { slug: 'block-robot-ve-nha-1', status: 'published', blockPuzzle: { gameId: 'robot-ve-nha' } },
      { slug: 'block-robot-ve-nha-2', blockPuzzle: {} },
      { slug: 'nhap', status: 'draft', blockPuzzle: { gameId: 'robot-ve-nha' } },
      { slug: 'gia-mao', status: 'published', blockPuzzle: { gameId: 'blockly-maze' } },
    ]);
    expect(map.get('robot-ve-nha')).toEqual(new Set(['block-robot-ve-nha-1', 'block-robot-ve-nha-2']));
    expect(map.get('blockly-maze')?.size).toBe(10);
    expect(map.get('blockly-maze')?.has('gia-mao')).toBe(false);
    expect(map.get('blockly-puzzle')).toEqual(new Set(['blockly-puzzle']));
    expect(map.size).toBe(5);
  });
});
