import type { MazeMap } from './mazeEngine';

/**
 * 10 màn của Maze (Blockly Games), Copyright 2012 Google LLC, Apache-2.0.
 * 0 tường, 1 đường đi, 2 điểm xuất phát, 3 đích.
 */
export const MAZE_LEVELS: MazeMap[] = [
  // Màn 1
  [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 2, 1, 3, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 2
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 3, 0, 0, 0],
    [0, 0, 2, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 3
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 1, 1, 1, 1, 3, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 4: đường kéo dài qua cả điểm đầu và đích để người chơi hiểu mục tiêu là tới đích.
  [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 3, 1, 0],
    [0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0],
    [0, 2, 1, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 5
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 2, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 6
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 0],
    [0, 1, 1, 3, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0],
    [0, 2, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 7
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0],
    [0, 2, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0],
    [0, 1, 1, 3, 0, 1, 0, 0],
    [0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 8
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 0, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0],
    [0, 2, 1, 1, 0, 3, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 9
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0],
    [3, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 2, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  // Màn 10
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 3, 0, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 1, 0],
    [0, 2, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
] as MazeMap[];

export const MAZE_LEVEL_COUNT = MAZE_LEVELS.length;

/** Số khối tối đa mỗi màn (Infinity: không giới hạn). */
export const MAX_BLOCKS = [Infinity, Infinity, 2, 5, 5, 5, 5, 10, 7, 10];

export const maxBlocksFor = (level: number): number => MAX_BLOCKS[level - 1] ?? Infinity;

/** Id lưu tiến độ trên server (cùng API với các bài Block Puzzle khác). */
export const MAZE_GAME_ID = 'blockly-maze';
export const mazeSlug = (level: number): string => `blockly-maze-level-${level}`;

/** Bộ khối mỗi màn: màn 3 trở lên có vòng lặp, màn 6 có "nếu", màn 9 có "nếu... ngược lại". */
export interface ToolboxSpec {
  forever: boolean;
  /** 'left' = khối "nếu" mặc định kiểm tra bên trái (màn 6); 'ahead' = mặc định phía trước. */
  ifBlock: 'none' | 'left' | 'ahead';
  ifElse: boolean;
}

export function toolboxSpec(level: number): ToolboxSpec {
  return {
    forever: level > 2,
    ifBlock: level === 6 ? 'left' : level > 6 ? 'ahead' : 'none',
    ifElse: level > 8,
  };
}

// ---- Vẽ bản đồ ----

/**
 * Chọn mảnh ghép cho mỗi ô theo hàng xóm (Bắc, Đông, Nam, Tây): chuỗi 5 ký tự (ô giữa + 4 hướng),
 * giá trị là tọa độ [cột, hàng] trong ảnh tiles_pegman.png (5 cột x 4 hàng, mỗi mảnh 50px).
 */
const TILE_SHAPES: Record<string, [number, number]> = {
  '10010': [4, 0],
  '10001': [3, 3],
  '11000': [0, 1],
  '10100': [0, 2],
  '11010': [4, 1],
  '10101': [3, 2],
  '10110': [0, 0],
  '10011': [2, 0],
  '11001': [4, 2],
  '11100': [2, 3],
  '11110': [1, 1],
  '10111': [1, 0],
  '11011': [2, 1],
  '11101': [1, 2],
  '11111': [2, 2],
  null0: [4, 3],
  null1: [3, 0],
  null2: [3, 1],
  null3: [0, 3],
  null4: [1, 3],
};

export interface TileSprite {
  x: number;
  y: number;
  /** Vị trí mảnh trong ảnh tiles (cột, hàng). */
  col: number;
  row: number;
}

/**
 * Tính mảnh ghép cho cả bản đồ. `random` mặc định cố định theo vị trí để không nhấp nháy mỗi lần vẽ lại
 * (bản gốc dùng Math.random).
 */
export function tileSprites(map: MazeMap, random: (x: number, y: number) => number = hash01): TileSprite[] {
  const rows = map.length;
  const cols = map[0].length;
  const open = (x: number, y: number) => (x < 0 || x >= cols || y < 0 || y >= rows || map[y][x] === 0 ? '0' : '1');
  const out: TileSprite[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let shape = open(x, y) + open(x, y - 1) + open(x + 1, y) + open(x, y + 1) + open(x - 1, y);
      if (!TILE_SHAPES[shape]) {
        shape = shape === '00000' && random(x, y) > 0.3 ? 'null0' : `null${1 + Math.floor(random(y, x) * 4)}`;
      }
      const [col, row] = TILE_SHAPES[shape];
      out.push({ x, y, col, row });
    }
  }
  return out;
}

/** Số giả ngẫu nhiên 0..1 xác định theo (x, y). */
function hash01(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + 7.7) * 43758.5453;
  return n - Math.floor(n);
}
