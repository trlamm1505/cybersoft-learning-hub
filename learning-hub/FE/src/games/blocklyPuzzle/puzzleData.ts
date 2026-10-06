/**
 * Dữ liệu và luật chấm của Puzzle (Blockly Games), Copyright 2012 Google LLC, Apache-2.0.
 * Thay đổi: tên và đặc điểm bằng tiếng Việt; hình con vật là biểu tượng cảm xúc vẽ thành ảnh SVG (không dùng ảnh gốc).
 */
export const PUZZLE_GAME_ID = 'blockly-puzzle';
export const PUZZLE_SLUG = 'blockly-puzzle';

export interface Animal {
  name: string;
  /** Biểu tượng dùng làm hình. */
  emoji: string;
  /** Màu nền ô hình. */
  bg: string;
  legs: number;
  traits: [string, string];
  helpUrl: string;
}

export const ANIMALS: Animal[] = [
  { name: 'Vịt', emoji: '🦆', bg: '#e0f2fe', legs: 2, traits: ['Lông vũ', 'Mỏ'], helpUrl: 'https://vi.wikipedia.org/wiki/V%E1%BB%8Bt' },
  { name: 'Mèo', emoji: '🐱', bg: '#fef3c7', legs: 4, traits: ['Ria mép', 'Bộ lông'], helpUrl: 'https://vi.wikipedia.org/wiki/M%C3%A8o' },
  { name: 'Ong', emoji: '🐝', bg: '#fef9c3', legs: 6, traits: ['Mật ong', 'Ngòi chích'], helpUrl: 'https://vi.wikipedia.org/wiki/Ong' },
  { name: 'Ốc sên', emoji: '🐌', bg: '#dcfce7', legs: 0, traits: ['Vỏ', 'Chất nhầy'], helpUrl: 'https://vi.wikipedia.org/wiki/%E1%BB%90c_s%C3%AAn' },
];

/** Ảnh SVG (data URI) vẽ biểu tượng con vật trên nền màu, kích thước 100x70 như bản gốc. */
export function animalPicture(n: number): string {
  const a = ANIMALS[n - 1];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="70" viewBox="0 0 100 70">` +
    `<rect width="100" height="70" rx="6" fill="${a.bg}"/>` +
    `<text x="50" y="50" font-size="44" text-anchor="middle">${a.emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Số chân hợp lệ trong danh sách chọn (đã sắp tăng dần), kèm lựa chọn "chọn...". */
export function legsOptions(): Array<[string, string]> {
  const pad = '  ';
  const list: Array<{ legs: number; id: string }> = ANIMALS.map((a, i) => ({ legs: a.legs, id: String(i + 1) }));
  list.sort((x, y) => x.legs - y.legs);
  return [['chọn...', '0'], ...list.map((l): [string, string] => [`${pad}${l.legs}${pad}`, l.id])];
}

export type PuzzleBlock =
  | { kind: 'animal'; animal: number; /** Giá trị đang chọn trong ô số chân (0: chưa chọn). */ legs: number }
  | { kind: 'picture'; animal: number; parentAnimal: number | null }
  | { kind: 'trait'; animal: number; parentAnimal: number | null };

/** Khối đã đặt đúng chỗ chưa: con vật chọn đúng số chân, hình và đặc điểm nằm trong đúng con vật. */
export function isBlockCorrect(b: PuzzleBlock): boolean {
  if (b.kind === 'animal') return b.legs === b.animal;
  return b.parentAnimal !== null && b.parentAnimal === b.animal;
}

export interface PuzzleResult {
  total: number;
  errors: number;
  message: string[];
}

export function checkPuzzle(blocks: PuzzleBlock[]): PuzzleResult {
  const errors = blocks.filter((b) => !isBlockCorrect(b)).length;
  const total = blocks.length;
  const message =
    errors === 0
      ? [`Hoàn hảo! Cả ${total} khối đều đúng.`]
      : errors === 1
        ? ['Gần đúng rồi! Còn một khối sai.', 'Khối được tô sáng chưa đúng. Hãy thử lại.']
        : [`Còn ${errors} khối sai.`, 'Khối được tô sáng chưa đúng. Hãy thử lại.'];
  return { total, errors, message };
}

/** Xáo trộn Fisher-Yates tại chỗ; `random` truyền vào để kiểm thử xác định được. */
export function shuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Số khối của bài: mỗi con vật một khối tên, một khối hình và hai khối đặc điểm. */
export const PUZZLE_BLOCK_COUNT = ANIMALS.length * 4;
