import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { GameProps } from './common/GameChrome';
import { MAZE_GAME_ID, MAZE_LEVEL_COUNT, mazeSlug } from './blocklyMaze/mazeLevels';
import { TURTLE_GAME_ID, TURTLE_LEVEL_COUNT, turtleSlug } from './blocklyTurtle/turtleLevels';
import { BIRD_GAME_ID, BIRD_LEVEL_COUNT, birdSlug } from './blocklyBird/birdLevels';
import { PUZZLE_GAME_ID, PUZZLE_SLUG } from './blocklyPuzzle/puzzleData';

/**
 * Các trò chơi Blockly dựng sẵn trong Block Puzzle (chuyển thể từ Blockly Games, Apache-2.0). Mỗi game được nạp
 * lười: thư viện Blockly nặng chỉ tải khi người chơi mở game.
 */
export interface BuiltinGame {
  id: string;
  title: string;
  tagline: string;
  levels: number;
  slug: (level: number) => string;
  /** Lớp màu của biểu tượng trên thẻ. */
  gradient: string;
  Component: LazyExoticComponent<ComponentType<GameProps>>;
}

export const BUILTIN_GAMES: BuiltinGame[] = [
  {
    id: MAZE_GAME_ID,
    title: 'Mê Cung Blockly',
    tagline: 'Đưa nhân vật tới cờ bằng khối lệnh, vòng lặp và điều kiện',
    levels: MAZE_LEVEL_COUNT,
    slug: mazeSlug,
    gradient: 'from-emerald-600 to-cyan-500',
    Component: lazy(() => import('./blocklyMaze/BlocklyMazeGame')),
  },
  {
    id: TURTLE_GAME_ID,
    title: 'Rùa Vẽ Hình',
    tagline: 'Điều khiển rùa vẽ hình vuông, ngôi sao, hình tròn và tác phẩm tự do',
    levels: TURTLE_LEVEL_COUNT,
    slug: turtleSlug,
    gradient: 'from-amber-500 to-rose-500',
    Component: lazy(() => import('./blocklyTurtle/TurtleGame')),
  },
  {
    id: BIRD_GAME_ID,
    title: 'Chim Tìm Tổ',
    tagline: 'Dùng góc, toạ độ và điều kiện để chim bắt sâu rồi về tổ',
    levels: BIRD_LEVEL_COUNT,
    slug: birdSlug,
    gradient: 'from-sky-500 to-indigo-500',
    Component: lazy(() => import('./blocklyBird/BirdGame')),
  },
  {
    id: PUZZLE_GAME_ID,
    title: 'Ghép Hình Con Vật',
    tagline: 'Ghép tên, hình, số chân và đặc điểm của từng con vật',
    levels: 1,
    slug: () => PUZZLE_SLUG,
    gradient: 'from-fuchsia-500 to-purple-600',
    Component: lazy(() => import('./blocklyPuzzle/PuzzleGame')),
  },
];

export const findBuiltinGame = (id: string | null): BuiltinGame | undefined => BUILTIN_GAMES.find((g) => g.id === id);

/** Số màn đã hoàn thành của một game. */
export const completedLevels = (game: BuiltinGame, done: Set<string>): number =>
  Array.from({ length: game.levels }, (_, i) => game.slug(i + 1)).filter((s) => done.has(s)).length;
