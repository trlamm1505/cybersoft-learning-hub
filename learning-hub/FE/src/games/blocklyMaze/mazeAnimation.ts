import { constrain16, constrain4, Direction, type LogEntry, type Outcome } from './mazeEngine';

/**
 * Kế hoạch hoạt ảnh từ nhật ký hành động (thuần, kiểm thử được). Dựa trên animate/schedule/scheduleFail/scheduleFinish
 * của blockly-games/appengine/maze/src/main.js, Copyright 2012 Google LLC, Apache-2.0.
 * Ảnh nhân vật có 21 khung: 0-15 là 4 khung mỗi hướng (Bắc, Đông, Nam, Tây), 16-20 là các tư thế nhảy thắng (dùng 16 và 18).
 */
export interface Frame {
  /** Thời điểm (ms) kể từ lúc bắt đầu chạy. */
  at: number;
  x: number;
  y: number;
  /** Khung ảnh 0..20. */
  d: number;
  /** Id khối cần tô sáng từ thời điểm này (undefined: giữ nguyên). */
  blockId?: string | null;
  sound?: 'step' | 'turn' | 'look' | 'win' | 'fail';
}

export const STEP_SUCCESS_MS = 100;
export const STEP_OTHER_MS = 150;
export const START_FRAME = (startDir: number = Direction.EAST) => startDir * 4;

const DELTA: Record<string, [number, number]> = {
  [Direction.NORTH]: [0, -1],
  [Direction.EAST]: [1, 0],
  [Direction.SOUTH]: [0, 1],
  [Direction.WEST]: [-1, 0],
};

export interface Plan {
  frames: Frame[];
  /** Thời điểm kết thúc hoạt ảnh (ms). */
  duration: number;
  /** Có hoạt ảnh thắng ở cuối không (kết quả SUCCESS). */
  finishAt: number | null;
}

export function planAnimation(
  log: LogEntry[],
  outcome: Outcome,
  start: { x: number; y: number },
  startDir: number = Direction.EAST,
): Plan {
  const speed = outcome === 'SUCCESS' ? STEP_SUCCESS_MS : STEP_OTHER_MS;
  const frames: Frame[] = [];
  let x = start.x;
  let y = start.y;
  let dir: number = startDir;
  let t = 0;

  /** Bốn khung nội suy từ (x0,y0,d0) tới (x1,y1,d1), như schedule() của bản gốc. */
  const glide = (x1: number, y1: number, d1: number, blockId: string | null, sound: Frame['sound']) => {
    const d0 = dir * 4;
    for (let i = 1; i <= 4; i++) {
      const k = i / 4;
      frames.push({
        at: t + (i - 1) * speed,
        x: x + (x1 - x) * k,
        y: y + (y1 - y) * k,
        d: constrain16(d0 + (d1 - d0) * k),
        ...(i === 1 ? { blockId, sound } : {}),
      });
    }
  };

  for (const entry of log) {
    const { action, blockId } = entry;
    switch (action) {
      case 'north':
      case 'east':
      case 'south':
      case 'west': {
        const [dx, dy] = DELTA[{ north: 0, east: 1, south: 2, west: 3 }[action]];
        glide(x + dx, y + dy, dir * 4, blockId, 'step');
        x += dx;
        y += dy;
        t += speed * 5;
        break;
      }
      case 'left':
      case 'right': {
        const delta = action === 'left' ? -1 : 1;
        glide(x, y, dir * 4 + delta * 4, blockId, 'turn');
        dir = constrain4(dir + delta);
        t += speed * 5;
        break;
      }
      case 'look_north':
      case 'look_east':
      case 'look_south':
      case 'look_west':
        // Nhìn đường: không đổi vị trí, chỉ tô sáng khối "nếu" và phát tiếng nhẹ.
        frames.push({ at: t, x, y, d: dir * 4, blockId, sound: 'look' });
        t += speed * 2;
        break;
      case 'fail_forward':
      case 'fail_backward': {
        // Va tường: nảy hai lần rồi đứng yên (kiểu "dừng" của bản gốc).
        const [ux, uy] = DELTA[dir];
        const sign = action === 'fail_forward' ? 1 : -1;
        const bx = (ux * sign) / 4;
        const by = (uy * sign) / 4;
        const d16 = constrain16(dir * 4);
        frames.push({ at: t, x: x + bx, y: y + by, d: d16, blockId, sound: 'fail' });
        frames.push({ at: t + speed, x, y, d: d16 });
        frames.push({ at: t + speed * 2, x: x + bx, y: y + by, d: d16, sound: 'fail' });
        frames.push({ at: t + speed * 3, x, y, d: d16 });
        t += speed * 5;
        break;
      }
    }
  }

  let finishAt: number | null = null;
  if (outcome === 'SUCCESS') {
    // Điệu nhảy thắng: khung 16, 18 (bản gốc), 16 rồi đứng nghiêm theo hướng cuối.
    finishAt = t;
    const dance = 150;
    frames.push({ at: t, x, y, d: 16, blockId: null, sound: 'win' });
    frames.push({ at: t + dance, x, y, d: 18 });
    frames.push({ at: t + dance * 2, x, y, d: 16 });
    frames.push({ at: t + dance * 3, x, y, d: constrain16(dir * 4) });
    t += dance * 4;
  } else {
    frames.push({ at: t, x, y, d: constrain16(dir * 4), blockId: null });
  }
  return { frames, duration: t, finishAt };
}
