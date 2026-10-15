import { gradeBandsForDifficulty, quizBandOfStudent } from './quiz-grade';

describe('quiz-grade', () => {
  it('EASY -> 6-9, MEDIUM -> cả hai khối, HARD -> 10-12', () => {
    expect(gradeBandsForDifficulty('EASY')).toEqual(['6-9']);
    expect(gradeBandsForDifficulty('MEDIUM')).toEqual(['6-9', '10-12']);
    expect(gradeBandsForDifficulty('HARD')).toEqual(['10-12']);
    expect(gradeBandsForDifficulty(undefined)).toEqual(['6-9', '10-12']);
  });

  it('khối ôn tập theo ageGroup; 3-5 và người lớn không lọc', () => {
    expect(quizBandOfStudent('6-9')).toBe('6-9');
    expect(quizBandOfStudent('10-12')).toBe('10-12');
    expect(quizBandOfStudent('3-5')).toBeUndefined();
    expect(quizBandOfStudent(undefined)).toBeUndefined();
  });
});
