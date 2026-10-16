import { describe, expect, it } from 'vitest';
import { BIRD_HINTS, BIRD_LEVEL_COUNT, BIRD_MAPS, birdSlug, birdToolbox, startBlockType } from './birdLevels';
import { birdSprite, planBirdAnimation, runBird, runBirdLevel } from './birdEngine';

describe('Bird: bản đồ', () => {
  it('có 10 màn, đủ gợi ý, điểm nằm trong khung 0..100', () => {
    expect(BIRD_LEVEL_COUNT).toBe(10);
    expect(BIRD_MAPS).toHaveLength(10);
    expect(BIRD_HINTS).toHaveLength(10);
    for (const m of BIRD_MAPS) {
      for (const p of [m.start, m.nest, ...(m.worm ? [m.worm] : [])]) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(100);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(100);
      }
    }
    expect(birdSlug(2)).toBe('blockly-bird-level-2');
  });

  it('hộp công cụ và khối khởi đầu theo màn', () => {
    expect(startBlockType(1)).toBe('bird_heading');
    expect(startBlockType(3)).toBe('bird_ifElse');
    expect(startBlockType(6)).toBe('bird_if');
    expect(birdToolbox(1)).toEqual({ noWorm: false, compare: null, and: false });
    expect(birdToolbox(5).compare).toBe('xy');
    expect(birdToolbox(8).and).toBe(true);
  });
});

describe('Bird: chạy chương trình', () => {
  it('màn 1: bay 45 độ bắt sâu rồi về tổ', () => {
    expect(runBirdLevel(1, 'heading(45);').outcome).toBe('SUCCESS');
  });

  it('màn 2: đổi hướng sau khi bắt sâu', () => {
    expect(runBirdLevel(2, 'if (noWorm()) { heading(0); } else { heading(90); }').outcome).toBe('SUCCESS');
  });

  it('màn 4: đổi hướng theo toạ độ x', () => {
    expect(runBirdLevel(4, 'if (getX() < 80) { heading(0); } else { heading(270); }').outcome).toBe('SUCCESS');
  });

  it('đâm tường thì ERROR, bay quá lâu thì TIMEOUT', () => {
    expect(runBirdLevel(1, 'heading(180);').outcome).toBe('ERROR');
    expect(runBird(BIRD_MAPS[0], 'tick();', 500).outcome).toBe('TIMEOUT');
  });

  it('không thể gọi API trình duyệt', () => {
    expect(runBirdLevel(1, 'fetch("/x");').outcome).toBe('ERROR');
  });
});

describe('Bird: hoạt ảnh', () => {
  it('kế hoạch khung hình đi theo nhật ký và kết thúc bằng tư thế đậu', () => {
    const run = runBirdLevel(1, 'heading(45);');
    const plan = planBirdAnimation(BIRD_MAPS[0], run, 35);
    expect(plan.frames.length).toBe(run.log.length);
    expect(plan.duration).toBe(run.log.length * 35);
    expect(plan.frames.some((f) => f.wormEaten)).toBe(true);
    expect(plan.frames.at(-1)?.pose).toBe('SIT');
  });

  it('khung hình chim nằm trong lưới 12 cột x 4 hàng', () => {
    for (const a of [0, 45, 90, 180, 270, 359]) {
      const s = birdSprite(a, 'FLAP', 250);
      expect(s.col).toBeGreaterThanOrEqual(0);
      expect(s.col).toBeLessThan(12);
      expect(s.row).toBeLessThan(4);
    }
    expect(birdSprite(90, 'SIT', 0).row).toBe(3);
  });
});
