/**
 * Luật vẽ của Turtle (Blockly Games), thuần TypeScript.
 * Dựa trên blockly-games/appengine/turtle/src/main.js, Copyright 2012 Google LLC, Apache-2.0.
 * Thay đổi: bỏ JS-Interpreter (chạy mã sinh từ khối trong hàm có giới hạn bước), tách "lệnh" khỏi "nét vẽ"
 * để kiểm thử mà không cần canvas.
 */

export const CANVAS_SIZE = 400;
export const MAX_TICKS = 200_000;
export const MAX_COMMANDS = 30_000;

export type Cmd =
  | { t: 'move'; d: number; id?: string | null }
  | { t: 'turn'; a: number; id?: string | null }
  | { t: 'pen'; down: boolean; id?: string | null }
  | { t: 'width'; w: number; id?: string | null }
  | { t: 'colour'; c: string; id?: string | null }
  | { t: 'visible'; v: boolean; id?: string | null }
  | { t: 'print'; text: string; id?: string | null }
  | { t: 'font'; font: string; size: number; style: string; id?: string | null };

/** Nét vẽ sinh ra từ một lệnh (null nếu lệnh chỉ đổi trạng thái). */
export type Op =
  | { k: 'line'; x0: number; y0: number; x1: number; y1: number; width: number; colour: string }
  | { k: 'text'; x: number; y: number; angle: number; text: string; font: string; colour: string };

export interface TurtleState {
  x: number;
  y: number;
  heading: number;
  penDown: boolean;
  width: number;
  colour: string;
  visible: boolean;
  font: string;
}

export const INITIAL_STATE = (): TurtleState => ({
  x: CANVAS_SIZE / 2,
  y: CANVAS_SIZE / 2,
  heading: 0,
  penDown: true,
  width: 5,
  colour: '#ffffff',
  visible: true,
  font: 'normal 18pt Arial',
});

export const normalizeAngle = (a: number): number => {
  a %= 360;
  return a < 0 ? a + 360 : a;
};

const toRadians = (deg: number) => (deg * Math.PI) / 180;

/** Áp dụng một lệnh lên trạng thái, trả về nét vẽ (nếu có). Hàm thuần: không đổi `state` đầu vào. */
export function applyCommand(state: TurtleState, cmd: Cmd): { state: TurtleState; op: Op | null } {
  const s = { ...state };
  switch (cmd.t) {
    case 'move': {
      const x0 = s.x;
      const y0 = s.y;
      const r = toRadians(s.heading);
      s.x += cmd.d * Math.sin(r);
      s.y -= cmd.d * Math.cos(r);
      // Lệnh đi 0 bước vẫn chấm một điểm (bản gốc cộng 0,1 để WebKit vẽ được nét dài 0).
      const bump = cmd.d ? 0 : 0.1;
      return {
        state: s,
        op: s.penDown ? { k: 'line', x0, y0, x1: s.x, y1: s.y + bump, width: s.width, colour: s.colour } : null,
      };
    }
    case 'turn':
      s.heading = normalizeAngle(s.heading + cmd.a);
      return { state: s, op: null };
    case 'pen':
      s.penDown = cmd.down;
      return { state: s, op: null };
    case 'width':
      s.width = cmd.w;
      return { state: s, op: null };
    case 'colour':
      s.colour = cmd.c;
      return { state: s, op: null };
    case 'visible':
      s.visible = cmd.v;
      return { state: s, op: null };
    case 'print':
      return {
        state: s,
        op: { k: 'text', x: s.x, y: s.y, angle: s.heading - 90, text: cmd.text, font: s.font, colour: s.colour },
      };
    case 'font':
      s.font = `${cmd.style} ${cmd.size}pt ${cmd.font}`;
      return { state: s, op: null };
  }
}

/** Chạy một danh sách lệnh, trả về các nét vẽ và trạng thái cuối. */
export function simulate(cmds: Cmd[]): { ops: Op[]; final: TurtleState } {
  let state = INITIAL_STATE();
  const ops: Op[] = [];
  for (const c of cmds) {
    const r = applyCommand(state, c);
    state = r.state;
    if (r.op) ops.push(r.op);
  }
  return { ops, final: state };
}

/**
 * Chữ ký hình vẽ: danh sách nét đã làm tròn và sắp xếp, để so hai hình theo hình học (kiểm thử và so sánh nhanh)
 * mà không cần canvas.
 */
export function signature(ops: Op[]): string[] {
  const r = (n: number) => Math.round(n * 100) / 100;
  return ops
    .map((o) =>
      o.k === 'line'
        ? `L ${r(o.x0)},${r(o.y0)} ${r(o.x1)},${r(o.y1)} w${o.width} ${o.colour}`
        : `T ${r(o.x)},${r(o.y)} ${r(o.angle)} ${o.text} ${o.font} ${o.colour}`,
    )
    .sort();
}

/**
 * So sánh hai ảnh theo kênh alpha (RGBA, 4 byte một điểm ảnh): đếm điểm khác nhau quá `tolerance`.
 * Cùng quy tắc với checkAnswer của bản gốc (ngưỡng 64).
 */
export function alphaDelta(a: Uint8ClampedArray | number[], b: Uint8ClampedArray | number[], tolerance = 64): number {
  const len = Math.min(a.length, b.length);
  let delta = 0;
  for (let i = 3; i < len; i += 4) {
    if (Math.abs(a[i] - b[i]) > tolerance) delta++;
  }
  return delta;
}

export type RunStatus = 'OK' | 'TIMEOUT' | 'ERROR';

export interface TurtleRun {
  cmds: Cmd[];
  status: RunStatus;
}

class Stop extends Error {
  kind: 'TIMEOUT' | 'LIMIT';
  constructor(kind: 'TIMEOUT' | 'LIMIT') {
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

/**
 * Chạy mã JavaScript do Blockly sinh ra (bộ khối cố định của Turtle) và thu danh sách lệnh vẽ. Vượt MAX_TICKS bước
 * hoặc MAX_COMMANDS lệnh thì dừng với TIMEOUT. Lệnh đã thu trước đó vẫn được giữ để người chơi thấy hình vẽ dang dở.
 */
export function runTurtleProgram(code: string): TurtleRun {
  const cmds: Cmd[] = [];
  let ticks = 0;
  const tick = () => {
    if (++ticks > MAX_TICKS) throw new Stop('TIMEOUT');
  };
  const push = (c: Cmd) => {
    tick();
    if (cmds.length >= MAX_COMMANDS) throw new Stop('LIMIT');
    cmds.push(c);
  };
  const num = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const api = {
    moveForward: (d: unknown, id?: string) => push({ t: 'move', d: num(d), id }),
    moveBackward: (d: unknown, id?: string) => push({ t: 'move', d: -num(d), id }),
    turnRight: (a: unknown, id?: string) => push({ t: 'turn', a: num(a), id }),
    turnLeft: (a: unknown, id?: string) => push({ t: 'turn', a: -num(a), id }),
    penUp: (id?: string) => push({ t: 'pen', down: false, id }),
    penDown: (id?: string) => push({ t: 'pen', down: true, id }),
    penWidth: (w: unknown, id?: string) => push({ t: 'width', w: Math.max(0, num(w)), id }),
    penColour: (c: unknown, id?: string) => push({ t: 'colour', c: safeColour(c), id }),
    hideTurtle: (id?: string) => push({ t: 'visible', v: false, id }),
    showTurtle: (id?: string) => push({ t: 'visible', v: true, id }),
    print: (text: unknown, id?: string) => push({ t: 'print', text: String(text).slice(0, 200), id }),
    font: (font: unknown, size: unknown, style: unknown, id?: string) =>
      push({ t: 'font', font: safeFont(font), size: Math.min(1000, Math.max(1, num(size))), style: safeStyle(style), id }),
    tick,
  };
  const names = Object.keys(api);
  let status: RunStatus = 'OK';
  try {
    const fn = new Function(...names, ...SHADOWED, `"use strict";\n${code}`);
    fn(...names.map((n) => api[n as keyof typeof api]), ...SHADOWED.map(() => undefined));
  } catch (e) {
    status = e instanceof Stop ? 'TIMEOUT' : 'ERROR';
  }
  return { cmds, status };
}

/** Chỉ nhận màu dạng #rgb/#rrggbb/rgb()/hsl() hoặc tên màu đơn giản; còn lại về đen. Chặn giá trị lạ đi vào canvas. */
export function safeColour(c: unknown): string {
  const s = String(c).trim();
  return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|[a-z]{3,20})$/i.test(s) ? s : '#000000';
}

const FONTS = ['Arial', 'Courier New', 'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana'];
const STYLES = ['normal', 'italic', 'bold'];
export const safeFont = (f: unknown): string => (FONTS.includes(String(f)) ? String(f) : 'Arial');
export const safeStyle = (s: unknown): string => (STYLES.includes(String(s)) ? String(s) : 'normal');
