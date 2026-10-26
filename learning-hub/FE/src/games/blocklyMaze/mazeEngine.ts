/**
 * Luật chơi của Maze (Blockly Games), chuyển sang TypeScript thuần.
 * Dựa trên blockly-games/appengine/maze/src/main.js, Copyright 2012 Google LLC, Apache-2.0.
 * Thay đổi: bỏ JS-Interpreter; chạy mã sinh từ khối trong hàm có giới hạn số lượt (chống vòng lặp vô hạn).
 */

export const SquareType = { WALL: 0, OPEN: 1, START: 2, FINISH: 3 } as const;
export type Square = 0 | 1 | 2 | 3;
export type MazeMap = Square[][];

/** Hướng: 0 Bắc, 1 Đông, 2 Nam, 3 Tây. */
export const Direction = { NORTH: 0, EAST: 1, SOUTH: 2, WEST: 3 } as const;

export type Outcome = 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'ERROR';

export type Action =
  | 'north'
  | 'east'
  | 'south'
  | 'west'
  | 'left'
  | 'right'
  | 'look_north'
  | 'look_east'
  | 'look_south'
  | 'look_west'
  | 'fail_forward'
  | 'fail_backward';

export interface LogEntry {
  action: Action;
  /** Id khối Blockly gây ra hành động, để tô sáng khi chạy; null nếu không có. */
  blockId: string | null;
}

export interface RunResult {
  outcome: Outcome;
  log: LogEntry[];
  /** Vị trí và hướng cuối khi chương trình dừng. */
  final: { x: number; y: number; d: number };
}

/** Tên toàn cục bị che khi chạy mã người chơi. */
const SHADOWED = [
  'window',
  'self',
  'globalThis',
  'document',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'localStorage',
  'sessionStorage',
  'navigator',
  'location',
  'Function',
];

/** Số bước tối đa của một lần chạy (mỗi lần gọi hàm của người chơi và mỗi vòng lặp tính một bước). */
export const MAX_TICKS = 10000;

export const constrain4 = (d: number): number => {
  const m = Math.round(d) % 4;
  return m < 0 ? m + 4 : m;
};

export const constrain16 = (d: number): number => {
  const m = Math.round(d) % 16;
  return m < 0 ? m + 16 : m;
};

export function findSquare(map: MazeMap, type: Square): { x: number; y: number } {
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === type) return { x, y };
    }
  }
  throw new Error(`Bản đồ thiếu ô loại ${type}`);
}

/** Dấu 'TIMEOUT' hoặc 'CRASH' được ném để dừng chương trình người chơi ngay lập tức. */
class Stop extends Error {
  kind: 'TIMEOUT' | 'CRASH';
  constructor(kind: 'TIMEOUT' | 'CRASH') {
    super(kind);
    this.kind = kind;
  }
}

export interface MazeApi {
  moveForward: (id?: string) => void;
  moveBackward: (id?: string) => void;
  turnLeft: (id?: string) => void;
  turnRight: (id?: string) => void;
  isPathForward: (id?: string) => boolean;
  isPathRight: (id?: string) => boolean;
  isPathBackward: (id?: string) => boolean;
  isPathLeft: (id?: string) => boolean;
  notDone: () => boolean;
  /** Gọi trong mỗi vòng lặp (INFINITE_LOOP_TRAP) để dừng chương trình chạy quá lâu. */
  tick: () => void;
}

/** Mô phỏng một lượt chạy: giữ vị trí, hướng, nhật ký hành động. */
export function createSimulation(map: MazeMap, maxTicks = MAX_TICKS) {
  const start = findSquare(map, SquareType.START);
  const finish = findSquare(map, SquareType.FINISH);
  let x = start.x;
  let y = start.y;
  let d: number = Direction.EAST;
  let ticks = 0;
  const log: LogEntry[] = [];

  const tick = () => {
    if (++ticks > maxTicks) throw new Stop('TIMEOUT');
  };

  const squareAt = (px: number, py: number): Square | undefined => map[py]?.[px];

  /** Direction: 0 phía trước, 1 bên phải, 2 phía sau, 3 bên trái (so với hướng hiện tại). */
  const isPath = (direction: number, id: string | null): boolean => {
    tick();
    const dir = constrain4(d + direction);
    let square: Square | undefined;
    let action: Action;
    switch (dir) {
      case Direction.NORTH:
        square = squareAt(x, y - 1);
        action = 'look_north';
        break;
      case Direction.EAST:
        square = squareAt(x + 1, y);
        action = 'look_east';
        break;
      case Direction.SOUTH:
        square = squareAt(x, y + 1);
        action = 'look_south';
        break;
      default:
        square = squareAt(x - 1, y);
        action = 'look_west';
    }
    if (id) log.push({ action, blockId: id });
    return square !== undefined && square !== SquareType.WALL;
  };

  const move = (direction: number, id: string | null) => {
    tick();
    if (!isPath(direction, null)) {
      log.push({ action: direction ? 'fail_backward' : 'fail_forward', blockId: id });
      throw new Stop('CRASH');
    }
    switch (constrain4(d + direction)) {
      case Direction.NORTH:
        y--;
        log.push({ action: 'north', blockId: id });
        break;
      case Direction.EAST:
        x++;
        log.push({ action: 'east', blockId: id });
        break;
      case Direction.SOUTH:
        y++;
        log.push({ action: 'south', blockId: id });
        break;
      default:
        x--;
        log.push({ action: 'west', blockId: id });
    }
  };

  const turn = (direction: number, id: string | null) => {
    tick();
    d = constrain4(d + (direction ? 1 : -1));
    log.push({ action: direction ? 'right' : 'left', blockId: id });
  };

  const notDone = () => x !== finish.x || y !== finish.y;

  const api: MazeApi = {
    moveForward: (id) => move(0, id ?? null),
    moveBackward: (id) => move(2, id ?? null),
    turnLeft: (id) => turn(0, id ?? null),
    turnRight: (id) => turn(1, id ?? null),
    isPathForward: (id) => isPath(0, id ?? null),
    isPathRight: (id) => isPath(1, id ?? null),
    isPathBackward: (id) => isPath(2, id ?? null),
    isPathLeft: (id) => isPath(3, id ?? null),
    notDone,
    tick,
  };

  return { api, log, notDone, state: () => ({ x, y, d }) };
}

/**
 * Chạy mã JavaScript do Blockly sinh ra. Chỉ có các hàm trong MazeApi được truyền vào; mã chỉ do bộ khối cố định
 * của trò chơi sinh ra. Kết quả: SUCCESS khi chạm đích, FAILURE khi hết chương trình mà chưa tới đích,
 * ERROR khi đâm vào tường, TIMEOUT khi chạy quá MAX_TICKS bước.
 */
export function runProgram(map: MazeMap, code: string, maxTicks = MAX_TICKS): RunResult {
  const sim = createSimulation(map, maxTicks);
  const names = Object.keys(sim.api) as Array<keyof MazeApi>;
  let outcome: Outcome;
  try {
    // Che các API trình duyệt khỏi mã người chơi (tham số cùng tên nhận undefined): lớp bảo vệ thứ hai, ngoài
    // việc mã chỉ do bộ khối cố định sinh ra.
    const fn = new Function(...names, ...SHADOWED, `"use strict";\n${code}`);
    fn(...names.map((n) => sim.api[n]), ...SHADOWED.map(() => undefined));
    outcome = sim.notDone() ? 'FAILURE' : 'SUCCESS';
  } catch (e) {
    if (e instanceof Stop) outcome = e.kind === 'TIMEOUT' ? 'TIMEOUT' : 'ERROR';
    else outcome = 'ERROR'; // lỗi cú pháp hoặc lỗi khác: coi là chương trình hỏng
  }
  return { outcome, log: sim.log, final: sim.state() };
}
