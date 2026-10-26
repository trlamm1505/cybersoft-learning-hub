import { describe, expect, it } from 'vitest';
import { secondsLeft } from './quizTimer';

describe('secondsLeft', () => {
  it('làm tròn lên: còn 0,4 giây vẫn hiện 1, chỉ về 0 khi đã tới mốc', () => {
    expect(secondsLeft(10_000, 9_600)).toBe(1);
    expect(secondsLeft(10_000, 10_000)).toBe(0);
  });

  it('quá mốc (máy ngủ đông, tab bị làm chậm) không âm: về 0', () => {
    expect(secondsLeft(10_000, 4_000_000)).toBe(0);
  });

  it('đầu giờ hiện đủ thời lượng', () => {
    expect(secondsLeft(1_800_000, 0)).toBe(1800);
  });
});
