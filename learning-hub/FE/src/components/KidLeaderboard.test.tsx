import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { KidLeaderboard } from './KidLeaderboard';
import type { KidGameInfo } from '../common/kidProgress';

const game = (id: string, title: string): KidGameInfo => ({ id, title, levels: 3, slug: (n) => `${id}-${n}` });
const games = [
  game('blockly-maze', 'Mê Cung Blockly'),
  game('blockly-turtle', 'Rùa Vẽ Hình'),
  game('blockly-bird', 'Chim Tìm Tổ'),
  game('blockly-puzzle', 'Ghép Hình Con Vật'),
  game('robot-ve-nha', 'Robot Về Nhà'),
];

describe('KidLeaderboard', () => {
  it('cột trái liệt kê đủ 5 trò chơi, game đầu tiên đang được chọn', () => {
    const html = renderToString(<KidLeaderboard games={games} />);
    for (const g of games) expect(html).toContain(g.title);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain('Top 10');
    expect(html).toContain('phá đảo hết');
  });
});
