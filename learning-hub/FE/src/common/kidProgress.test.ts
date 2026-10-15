import { describe, expect, it } from 'vitest';
import { summarizeKidProgress, type KidGameInfo } from './kidProgress';

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
    expect(s.levelsDone).toBe(1);
    expect(s.badges.find((b) => b.id === 'explorer')?.earned).toBe(true);
    expect(s.badges.find((b) => b.id === 'blockly-maze')?.earned).toBe(false);
  });

  it('phá đảo hết một game thì có huy hiệu của game đó; hết tất cả thì có Nhà vô địch', () => {
    const half = summarizeKidProgress(new Set(['blockly-turtle-1', 'blockly-turtle-2']), games);
    expect(half.badges.find((b) => b.id === 'blockly-turtle')?.earned).toBe(true);
    expect(half.badges.find((b) => b.id === 'champion')?.earned).toBe(false);

    const all = summarizeKidProgress(
      new Set(['blockly-maze-1', 'blockly-maze-2', 'blockly-maze-3', 'blockly-turtle-1', 'blockly-turtle-2']),
      games,
    );
    expect(all.badges.find((b) => b.id === 'champion')?.earned).toBe(true);
  });

  it('màn của giảng viên được tính vào tổng, slug lạ không làm tăng sao', () => {
    const s = summarizeKidProgress(new Set(['robot-1', 'khong-co']), games, ['robot-1', 'robot-2']);
    expect(s.levelsTotal).toBe(7);
    expect(s.stars).toBe(1);
  });
});
