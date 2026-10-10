import { describe, expect, it } from 'vitest';
import { ANIMALS, PUZZLE_BLOCK_COUNT, animalPicture, checkPuzzle, isBlockCorrect, legsOptions, shuffle, type PuzzleBlock } from './puzzleData';
import { BUILTIN_GAMES, completedLevels, findBuiltinGame } from '../registry';

const allRight = (): PuzzleBlock[] =>
  ANIMALS.flatMap((_, i): PuzzleBlock[] => {
    const n = i + 1;
    return [
      { kind: 'animal', animal: n, legs: n },
      { kind: 'picture', animal: n, parentAnimal: n },
      { kind: 'trait', animal: n, parentAnimal: n },
      { kind: 'trait', animal: n, parentAnimal: n },
    ];
  });

describe('Puzzle', () => {
  it('có 16 khối và số chân khác nhau', () => {
    expect(PUZZLE_BLOCK_COUNT).toBe(16);
    expect(new Set(ANIMALS.map((a) => a.legs)).size).toBe(ANIMALS.length);
  });

  it('chấm đúng khi mọi khối ở đúng chỗ', () => {
    const r = checkPuzzle(allRight());
    expect(r.errors).toBe(0);
    expect(r.total).toBe(16);
  });

  it('đếm khối sai: chưa chọn chân, sai con vật, chưa đặt vào đâu', () => {
    expect(isBlockCorrect({ kind: 'animal', animal: 2, legs: 0 })).toBe(false);
    expect(isBlockCorrect({ kind: 'picture', animal: 1, parentAnimal: 2 })).toBe(false);
    expect(isBlockCorrect({ kind: 'trait', animal: 1, parentAnimal: null })).toBe(false);
    const blocks = allRight();
    blocks[0] = { kind: 'animal', animal: 1, legs: 4 };
    blocks[1] = { kind: 'picture', animal: 1, parentAnimal: null };
    expect(checkPuzzle(blocks).errors).toBe(2);
  });

  it('danh sách số chân sắp tăng dần và bắt đầu bằng "chọn..."', () => {
    const o = legsOptions();
    expect(o[0]).toEqual(['chọn...', '0']);
    const legs = o.slice(1).map(([label]) => Number(label.trim()));
    expect(legs).toEqual([...legs].sort((a, b) => a - b));
  });

  it('xáo trộn giữ nguyên phần tử, hình là SVG hợp lệ', () => {
    const s = shuffle([1, 2, 3, 4, 5], () => 0.3);
    expect([...s].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(animalPicture(1)).toMatch(/^data:image\/svg\+xml/);
  });
});

describe('Registry game dựng sẵn', () => {
  it('có 4 game, id và slug duy nhất', () => {
    expect(BUILTIN_GAMES).toHaveLength(4);
    expect(new Set(BUILTIN_GAMES.map((g) => g.id)).size).toBe(4);
    const slugs = BUILTIN_GAMES.flatMap((g) => Array.from({ length: g.levels }, (_, i) => g.slug(i + 1)));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(findBuiltinGame('blockly-puzzle')?.levels).toBe(1);
    expect(findBuiltinGame('nope')).toBeUndefined();
    expect(findBuiltinGame(null)).toBeUndefined();
  });

  it('đếm số màn đã xong', () => {
    const bird = findBuiltinGame('blockly-bird')!;
    expect(completedLevels(bird, new Set(['blockly-bird-level-1', 'blockly-bird-level-3', 'x']))).toBe(2);
  });
});
