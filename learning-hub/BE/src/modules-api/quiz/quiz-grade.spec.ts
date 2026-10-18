import { gradeBandsForDifficulty, gradeBandsForQuestion, isPublicDeck, quizBandOfStudent } from './quiz-grade';

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

describe('bộ đề công khai của /quiz', () => {
  it('Python / HTML5 / CSS3 là bộ đề công khai; chủ đề khác và rỗng thì không', () => {
    expect(['Python', 'HTML5', 'CSS3'].every((c) => isPublicDeck(c))).toBe(true);
    expect([isPublicDeck('Algorithm'), isPublicDeck('Thuật toán'), isPublicDeck(''), isPublicDeck(undefined)]).toEqual([false, false, false, false]);
  });
  it('câu gốc của bộ đề công khai dùng cho cả hai khối bất kể độ khó; câu khác theo độ khó', () => {
    for (const d of ['EASY', 'MEDIUM', 'HARD']) expect(gradeBandsForQuestion('Python', d)).toEqual(['6-9', '10-12']);
    expect(gradeBandsForQuestion('Algorithm', 'HARD')).toEqual(['10-12']);
    expect(gradeBandsForQuestion('Algorithm', 'EASY')).toEqual(['6-9']);
  });
});
