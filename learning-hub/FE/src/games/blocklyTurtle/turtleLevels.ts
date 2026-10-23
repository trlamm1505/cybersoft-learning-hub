import type { Cmd } from './turtleEngine';

/**
 * 10 màn của Turtle: màn 1-9 vẽ lại hình mẫu, màn 10 vẽ tự do.
 * Dựa trên blockly-games/appengine/turtle/src/main.js, Copyright 2012 Google LLC, Apache-2.0.
 */
export const TURTLE_LEVEL_COUNT = 10;
export const FREE_LEVEL = 10;
export const TURTLE_GAME_ID = 'blockly-turtle';
export const turtleSlug = (level: number): string => `blockly-turtle-level-${level}`;

class Builder {
  cmds: Cmd[] = [];
  move(d: number) {
    this.cmds.push({ t: 'move', d });
  }
  turn(a: number) {
    this.cmds.push({ t: 'turn', a });
  }
  penDown(down: boolean) {
    this.cmds.push({ t: 'pen', down });
  }
  penColour(c: string) {
    this.cmds.push({ t: 'colour', c });
  }
  star(length: number) {
    for (let i = 0; i < 5; i++) {
      this.move(length);
      this.turn(144);
    }
  }
  /** Ba ngôi sao quanh tâm rồi dời tới vị trí vẽ phần còn lại (màn 6-9). */
  threeStars() {
    this.penColour('#ffff00');
    for (let i = 0; i < 3; i++) {
      this.star(50);
      this.penDown(false);
      this.move(150);
      this.turn(120);
      this.penDown(true);
    }
    this.penDown(false);
    this.turn(-90);
    this.move(100);
    this.penDown(true);
    this.penColour('#ffffff');
  }
  /** Hình tròn đặc: 360 nan hoa dài 50. */
  disc() {
    for (let i = 0; i < 360; i++) {
      this.move(50);
      this.move(-50);
      this.turn(1);
    }
  }
}

/** Lệnh vẽ hình mẫu của một màn (màn 10 không có hình mẫu). */
export function answerCommands(level: number): Cmd[] {
  const b = new Builder();
  switch (level) {
    case 1: // Hình vuông
      for (let i = 0; i < 4; i++) {
        b.move(100);
        b.turn(90);
      }
      break;
    case 2: // Ngũ giác
      for (let i = 0; i < 5; i++) {
        b.move(100);
        b.turn(72);
      }
      break;
    case 3: // Ngôi sao
      b.penColour('#ffff00');
      b.star(100);
      break;
    case 4: // Nhấc và hạ bút
      b.penColour('#ffff00');
      b.star(50);
      b.penDown(false);
      b.move(150);
      b.penDown(true);
      b.move(20);
      break;
    case 5: // Bốn ngôi sao
      b.penColour('#ffff00');
      for (let i = 0; i < 4; i++) {
        b.star(50);
        b.penDown(false);
        b.move(150);
        b.turn(90);
        b.penDown(true);
      }
      break;
    case 6: // Ba ngôi sao và một đường
      b.threeStars();
      b.move(50);
      break;
    case 7: // Ba ngôi sao và bốn đường
      b.threeStars();
      for (let i = 0; i < 4; i++) {
        b.move(50);
        b.move(-50);
        b.turn(45);
      }
      break;
    case 8: // Ba ngôi sao và một hình tròn
      b.threeStars();
      b.disc();
      break;
    case 9: // Ba ngôi sao và trăng khuyết
      b.threeStars();
      b.disc();
      b.turn(120);
      b.move(20);
      b.penColour('#000000');
      b.disc();
      break;
  }
  return b.cmds;
}

/** Số điểm ảnh khác nhau tối đa vẫn tính là đúng (màn 8 và 9 cho phép lệch nhiều hơn như bản gốc). */
export function maxPixelErrors(level: number): number {
  return level === 9 ? 600 : level === 8 ? 350 : 100;
}

/** Màn có giới hạn số khối để buộc người chơi dùng vòng lặp. Trả về null nếu không giới hạn. */
export function blockLimit(level: number): number | null {
  if (level <= 2) return 3;
  if (level === 3) return 4;
  if (level === 5) return 10;
  return null;
}

export type Verdict = 'PASS' | 'WRONG' | 'USE_LOOP';

/** Quyết định cuối: đúng, sai hình, hoặc đúng hình nhưng dùng quá nhiều khối. */
export function judge(level: number, pixelErrors: number, blockCount: number): Verdict {
  if (level === FREE_LEVEL) return blockCount > 1 ? 'PASS' : 'WRONG';
  if (pixelErrors > maxPixelErrors(level)) return 'WRONG';
  const limit = blockLimit(level);
  return limit !== null && blockCount > limit ? 'USE_LOOP' : 'PASS';
}

export interface TurtleToolbox {
  /** Màn 10 dùng hộp công cụ đầy đủ (khối chuẩn của Blockly). */
  full: boolean;
  colour: boolean;
  pen: boolean;
}

export function toolboxSpec(level: number): TurtleToolbox {
  return { full: level === FREE_LEVEL, colour: level > 2, pen: level > 3 };
}

export const TURTLE_HINTS: string[] = [
  'Vẽ một hình vuông: dùng khối «tiến» và «rẽ» rồi lặp lại thay vì ghép nhiều khối giống nhau.',
  'Vẽ ngũ giác đều: mỗi lần rẽ 72 độ, lặp lại 5 lần.',
  'Vẽ ngôi sao màu vàng: đổi màu bút, rồi tiến 100 và rẽ 144 độ, lặp lại 5 lần.',
  'Dùng khối «nhấc bút» để di chuyển mà không vẽ, rồi «hạ bút» vẽ tiếp.',
  'Bốn ngôi sao nhỏ: lặp lại việc vẽ sao, nhấc bút, đi tới chỗ mới rồi hạ bút.',
  'Ba ngôi sao và một đường thẳng trắng. Hình mẫu mờ cho bạn biết vị trí cần vẽ.',
  'Thêm 4 đường tỏa ra: tiến 50, lùi 50, rồi quay 45 độ, lặp lại 4 lần.',
  'Vẽ hình tròn đặc: lặp lại 360 lần việc tiến 50, lùi 50 và quay 1 độ.',
  'Vẽ trăng khuyết: vẽ một hình tròn trắng, dịch đi một chút rồi phủ hình tròn đen lên.',
  'Vẽ tự do. Thử biến, hàm, màu ngẫu nhiên và vòng lặp lồng nhau. Cần hơn 1 khối để hoàn thành.',
];
