/**
 * 10 màn của Bird (Blockly Games), Copyright 2012 Google LLC, Apache-2.0.
 * Toạ độ trong khoảng 0..100, trục y hướng lên. Góc 0 là sang phải, 90 là lên trên.
 */
export const BIRD_LEVEL_COUNT = 10;
export const BIRD_GAME_ID = 'blockly-bird';
export const birdSlug = (level: number): string => `blockly-bird-level-${level}`;

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface BirdMap {
  start: Point;
  startAngle: number;
  worm: Point | null;
  nest: Point;
  walls: Wall[];
}

const P = (x: number, y: number): Point => ({ x, y });
const W = (x0: number, y0: number, x1: number, y1: number): Wall => ({ x0, y0, x1, y1 });

export const BIRD_MAPS: BirdMap[] = [
  // Màn 1
  { start: P(20, 20), startAngle: 90, worm: P(50, 50), nest: P(80, 80), walls: [] },
  // Màn 2
  { start: P(20, 20), startAngle: 0, worm: P(80, 20), nest: P(80, 80), walls: [W(0, 50, 60, 50)] },
  // Màn 3
  { start: P(20, 70), startAngle: 270, worm: P(50, 20), nest: P(80, 70), walls: [W(50, 50, 50, 100)] },
  // Màn 4
  { start: P(20, 80), startAngle: 0, worm: null, nest: P(80, 20), walls: [W(0, 0, 65, 65)] },
  // Màn 5
  { start: P(80, 80), startAngle: 270, worm: null, nest: P(20, 20), walls: [W(0, 100, 65, 35)] },
  // Màn 6
  { start: P(20, 40), startAngle: 0, worm: P(80, 20), nest: P(20, 80), walls: [W(0, 59, 50, 59)] },
  // Màn 7
  { start: P(80, 80), startAngle: 180, worm: P(80, 20), nest: P(20, 20), walls: [W(0, 70, 40, 70), W(70, 50, 100, 50)] },
  // Màn 8
  {
    start: P(20, 25),
    startAngle: 90,
    worm: P(80, 25),
    nest: P(80, 75),
    walls: [W(50, 0, 50, 25), W(75, 50, 100, 50), W(50, 100, 50, 75), W(0, 50, 25, 50)],
  },
  // Màn 9
  {
    start: P(80, 70),
    startAngle: 180,
    worm: P(20, 20),
    nest: P(80, 20),
    walls: [W(0, 69, 31, 100), W(40, 50, 71, 0), W(80, 50, 100, 50)],
  },
  // Màn 10
  {
    start: P(20, 20),
    startAngle: 90,
    worm: P(80, 50),
    nest: P(20, 20),
    walls: [W(40, 60, 60, 60), W(40, 60, 60, 30), W(60, 30, 100, 30)],
  },
];

export const BIRD_HINTS: string[] = [
  'Chọn góc bay (0° sang phải, 90° lên trên) để chim bắt sâu rồi bay tới tổ. Kéo mũi tên trong khối để đổi góc.',
  'Có tường chắn đường. Dùng khối «nếu chưa có sâu thì... nếu không thì...» để đổi hướng sau khi bắt sâu.',
  'Chim bay xuống rồi cần vòng qua tường. Mỗi nhánh của «nếu» có một hướng bay riêng.',
  'Không có sâu, chỉ có tổ sau một bức tường chéo. Dùng khối so sánh toạ độ x để đổi hướng giữa đường.',
  'Thêm trục y: so sánh toạ độ y của chim. Bấm biểu tượng bánh răng trên khối «nếu» để thêm nhánh «nếu không».',
  'Cần nhiều điều kiện: thêm nhánh «nếu không thì nếu» bằng bánh răng của khối «nếu».',
  'Hai bức tường nằm ngang: kết hợp «nếu chưa có sâu» với so sánh toạ độ.',
  'Dùng khối «và» để ghép hai điều kiện trong cùng một nhánh.',
  'Tường chéo: chọn điều kiện thật chính xác để chim không đâm vào tường.',
  'Màn cuối: chim phải bắt sâu rồi quay về đúng chỗ xuất phát. Bạn tự quyết định cách bay.',
];

export interface BirdToolbox {
  noWorm: boolean;
  /** 'x' từ màn 4, 'xy' từ màn 5, null trước đó. */
  compare: null | 'x' | 'xy';
  and: boolean;
}

export function birdToolbox(level: number): BirdToolbox {
  return { noWorm: level >= 2 && level !== 4 && level !== 5, compare: level >= 5 ? 'xy' : level >= 4 ? 'x' : null, and: level >= 8 };
}

/** Khối khởi đầu của mỗi màn: màn 1 là "bay theo góc", 2-4 là "nếu/nếu không", từ 5 là khối "nếu" có bánh răng. */
export function startBlockType(level: number): 'bird_heading' | 'bird_ifElse' | 'bird_if' {
  return level === 1 ? 'bird_heading' : level < 5 ? 'bird_ifElse' : 'bird_if';
}
