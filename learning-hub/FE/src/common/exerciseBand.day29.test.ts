import { describe, expect, it } from 'vitest';
import { bandOfExercise, bandOfStudent } from './exerciseMatrix';

/** Day 29 (M6): '9-12' và '10-12' là cùng một khối, không bài nào rơi khỏi Playground. */
describe('nhãn khối 10-12', () => {
  it("bài chỉ có gradeBand '10-12' (không targetGroup) vào đúng nhóm của học viên 10-12", () => {
    expect(bandOfExercise({ gradeBand: '10-12' })).toBe(bandOfStudent('10-12'));
    expect(bandOfExercise({ gradeBand: '9-12' })).toBe(bandOfStudent('10-12'));
    expect(bandOfExercise({ targetGroup: 'K10_12' })).toBe(bandOfStudent('10-12'));
  });
});
