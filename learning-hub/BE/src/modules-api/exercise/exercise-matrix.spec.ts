import { matrixError, targetGroupOfStudent } from './exercise-matrix';

describe('exercise-matrix', () => {
  it.each([
    ['K3_5', 'PUZZLE_BLOCK'],
    ['K6_9', 'PYTHON_CODE'],
    ['K10_12', 'ALGO_JUDGE'],
    ['CAREER_ADULT', 'DATA_SQL'],
    ['CAREER_ADULT', 'AI_PROMPT'],
    ['CAREER_ADULT', 'TESTER_QA'],
  ])('%s + %s hợp lệ', (g, l) => expect(matrixError(g, l)).toBeUndefined());

  it.each([
    ['K3_5', 'PYTHON_CODE'],
    ['K6_9', 'ALGO_JUDGE'],
    ['K10_12', 'DATA_SQL'],
    ['CAREER_ADULT', 'PUZZLE_BLOCK'],
    ['K99', 'PYTHON_CODE'],
    ['K6_9', 'NOPE'],
    [undefined, 'PYTHON_CODE'],
  ])('%s + %s bị từ chối', (g, l) => expect(matrixError(g, l)).toBeDefined());

  it('map ageGroup của học viên sang targetGroup', () => {
    expect(targetGroupOfStudent('3-5')).toBe('K3_5');
    expect(targetGroupOfStudent('6-9')).toBe('K6_9');
    expect(targetGroupOfStudent('10-12')).toBe('K10_12');
    expect(targetGroupOfStudent(undefined)).toBe('CAREER_ADULT');
  });
});
