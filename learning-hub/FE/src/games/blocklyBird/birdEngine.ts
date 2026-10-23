import { BIRD_MAPS, type BirdMap, type Point, type Wall } from './birdLevels';

/**
 * Luật bay của Bird, thuần TypeScript. Dựa trên blockly-games/appengine/bird/src/main.js,
 * Copyright 2012 Google LLC, Apache-2.0. Thay đổi: bỏ JS-Interpreter, mỗi lệnh `heading` đi đúng 1 đơn vị.
 */
export const MAP_SIZE = 400;
export const BIRD_ICON = 120;
export const WALL_THICKNESS = 10;
/** Khoảng cách chạm tổ/sâu (tính theo toạ độ 0..100). */
export const NEST_RADIUS = ((0.5 * BIRD_ICON) / MAP_SIZE) * 100;
export const WALL_RADIUS = ((0.2 * BIRD_ICON) / MAP_SIZE) * 100;
export const MAX_TICKS = 100_000;

export type Outcome = 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'ERROR';

export type BirdAction =
  | { a: 'move'; x: number; y: number; angle: number; id: string | null }
  | { a: 'goto'; x: number; y: number; angle: number }
  | { a: 'worm' }
  | { a: 'finish' }
  | { a: 'play'; sound: 'quack' | 'whack' | 'worm' };

export interface BirdRun {
  outcome: Outcome;
  log: BirdAction[];
}

export const normalizeAngle = (a: number): number => {
  a %= 360;
  return a < 0 ? a + 360 : a;
};

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Khoảng cách từ điểm tới đoạn tường (kể cả đầu mút). */
export function distanceToWall(w: Wall, p: Point): number {
  const a = p.x - w.x0;
  const b = p.y - w.y0;
  const c = w.x1 - w.x0;
  const d = w.y1 - w.y0;
  const lenSq = c * c + d * d;
  const param = lenSq ? (a * c + b * d) / lenSq : -1;
  const closest: Point =
    param < 0 ? { x: w.x0, y: w.y0 } : param > 1 ? { x: w.x1, y: w.y1 } : { x: w.x0 + param * c, y: w.y0 + param * d };
  return dist(p, closest);
}

/** Bốn bức tường bao quanh bản đồ. */
export function borderWalls(): Wall[] {
  const e0 = -WALL_THICKNESS / 2;
  const e1 = 100 + WALL_THICKNESS / 2;
  return [
    { x0: e0, y0: e0, x1: e0, y1: e1 },
    { x0: e0, y0: e1, x1: e1, y1: e1 },
    { x0: e1, y0: e1, x1: e1, y1: e0 },
    { x0: e1, y0: e0, x1: e0, y1: e0 },
  ];
}

export function pointsToAngle(x1: number, y1: number, x2: number, y2: number): number {
  return normalizeAngle((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
}

class Stop extends Error {
  kind: 'SUCCESS' | 'CRASH' | 'TIMEOUT';
  constructor(kind: 'SUCCESS' | 'CRASH' | 'TIMEOUT') {
    super(kind);
    this.kind = kind;
  }
}

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

/** Một lượt chạy trên bản đồ `map`. `code` là mã Blockly sinh ra (đã nằm trong while(true)). */
export function runBird(map: BirdMap, code: string, maxTicks = MAX_TICKS): BirdRun {
  const walls = [...map.walls, ...borderWalls()];
  const pos: Point = { ...map.start };
  let hasWorm = !map.worm;
  let ticks = 0;
  const log: BirdAction[] = [];

  const tick = () => {
    if (++ticks > maxTicks) throw new Stop('TIMEOUT');
  };
  const gotoPoint = (p: Point) => {
    const steps = Math.round(dist(pos, p));
    const angle = pointsToAngle(pos.x, pos.y, p.x, p.y);
    const rad = (angle * Math.PI) / 180;
    for (let i = 0; i < steps; i++) {
      pos.x += Math.cos(rad);
      pos.y += Math.sin(rad);
      log.push({ a: 'goto', x: pos.x, y: pos.y, angle });
    }
  };
  const heading = (angleDeg: unknown, id?: string) => {
    tick();
    const angle = Number(angleDeg);
    const rad = ((Number.isFinite(angle) ? angle : 0) * Math.PI) / 180;
    pos.x += Math.cos(rad);
    pos.y += Math.sin(rad);
    log.push({ a: 'move', x: pos.x, y: pos.y, angle: Number.isFinite(angle) ? angle : 0, id: id ?? null });
    if (hasWorm && dist(pos, map.nest) < NEST_RADIUS) {
      log.push({ a: 'play', sound: 'quack' });
      gotoPoint(map.nest);
      log.push({ a: 'finish' });
      throw new Stop('SUCCESS');
    }
    if (!hasWorm && map.worm && dist(pos, map.worm) < NEST_RADIUS) {
      gotoPoint(map.worm);
      log.push({ a: 'worm' });
      log.push({ a: 'play', sound: 'worm' });
      hasWorm = true;
    }
    if (walls.some((w) => distanceToWall(w, pos) < WALL_RADIUS)) {
      log.push({ a: 'play', sound: 'whack' });
      throw new Stop('CRASH');
    }
  };
  const api = {
    heading,
    noWorm: () => {
      tick();
      return !hasWorm;
    },
    getX: () => {
      tick();
      return pos.x;
    },
    getY: () => {
      tick();
      return pos.y;
    },
    tick,
  };
  const names = Object.keys(api);
  let outcome: Outcome = 'FAILURE';
  try {
    const fn = new Function(...names, ...SHADOWED, `"use strict";\nwhile (true) {\n${code}\n}`);
    fn(...names.map((n) => api[n as keyof typeof api]), ...SHADOWED.map(() => undefined));
  } catch (e) {
    outcome = e instanceof Stop ? (e.kind === 'SUCCESS' ? 'SUCCESS' : e.kind === 'TIMEOUT' ? 'TIMEOUT' : 'ERROR') : 'ERROR';
  }
  return { outcome, log };
}

export const runBirdLevel = (level: number, code: string): BirdRun => runBird(BIRD_MAPS[level - 1], code);

// ---- Hoạt ảnh ----

export type Pose = 'SOAR' | 'FLAP' | 'SIT';

export interface BirdFrame {
  at: number;
  x: number;
  y: number;
  /** Góc đã làm mượt (tối đa 10 độ mỗi khung), dùng để chọn khung hình quay đầu. */
  angle: number;
  pose: Pose;
  blockId?: string | null;
  sound?: 'quack' | 'whack' | 'worm';
  /** Sâu bị ăn từ khung này. */
  wormEaten?: boolean;
}

/** Kế hoạch hoạt ảnh từ nhật ký (thuần): mỗi hành động cách nhau `interval` ms. */
export function planBirdAnimation(map: BirdMap, run: BirdRun, interval: number): { frames: BirdFrame[]; duration: number } {
  const frames: BirdFrame[] = [];
  let x = map.start.x;
  let y = map.start.y;
  let target = map.startAngle;
  let current = map.startAngle;
  let t = 0;
  const smooth = () => {
    let diff = normalizeAngle(current - target);
    if (diff > 180) diff -= 360;
    current = Math.abs(diff) <= 10 ? target : normalizeAngle(current + (diff < 0 ? 10 : -10));
  };
  for (const act of run.log) {
    switch (act.a) {
      case 'move':
      case 'goto':
        x = act.x;
        y = act.y;
        target = act.angle;
        smooth();
        frames.push({ at: t, x, y, angle: current, pose: act.a === 'move' ? 'FLAP' : 'SOAR', blockId: act.a === 'move' ? act.id : undefined });
        break;
      case 'worm':
        frames.push({ at: t, x, y, angle: current, pose: 'SOAR', wormEaten: true });
        break;
      case 'finish':
        frames.push({ at: t, x, y, angle: current, pose: 'SIT', blockId: null });
        break;
      case 'play':
        frames.push({ at: t, x, y, angle: current, pose: 'SOAR', sound: act.sound });
        break;
    }
    t += interval;
  }
  return { frames, duration: t };
}

/** Khung hình trong ảnh birds-120.png (12 cột x 4 hàng) và góc xoay nhỏ cho từng trạng thái. */
export function birdSprite(angle: number, pose: Pose, at: number): { col: number; row: number; rotate: number } {
  const quad = (((14 - Math.round((angle / 360) * 12)) % 12) + 12) % 12;
  const quadAngle = 30;
  let remainder = angle % quadAngle;
  if (remainder >= quadAngle / 2) remainder -= quadAngle;
  const row = pose === 'SOAR' ? 0 : pose === 'SIT' ? 3 : Math.floor(at / 100) % 3;
  return { col: quad, row, rotate: -remainder };
}
