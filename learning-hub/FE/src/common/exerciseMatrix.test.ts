import { describe, expect, it } from 'vitest';
import { bandOfExercise, bandOfStudent, labTypeAfterGroupChange, labTypesFor, UNGRADED } from './exerciseMatrix';

describe('exerciseMatrix', () => {
  it('mỗi nhóm lọc đúng loại lab', () => {
    expect(labTypesFor('K3_5')).toEqual(['PUZZLE_BLOCK']);
    expect(labTypesFor('K6_9')).toEqual(['PYTHON_CODE']);
    expect(labTypesFor('K10_12')).toEqual(['ALGO_JUDGE']);
    expect(labTypesFor('CAREER_ADULT')).toEqual(['DATA_SQL', 'AI_PROMPT', 'TESTER_QA']);
    expect(labTypesFor('')).toEqual([]);
  });

  it('đổi nhóm: tự chọn lab duy nhất, giữ lab còn hợp lệ, bỏ lab không hợp lệ', () => {
    expect(labTypeAfterGroupChange('K6_9', '')).toBe('PYTHON_CODE');
    expect(labTypeAfterGroupChange('CAREER_ADULT', '')).toBe('');
    expect(labTypeAfterGroupChange('CAREER_ADULT', 'AI_PROMPT')).toBe('AI_PROMPT');
    expect(labTypeAfterGroupChange('CAREER_ADULT', 'PYTHON_CODE')).toBe('');
    expect(labTypeAfterGroupChange('K10_12', 'PYTHON_CODE')).toBe('ALGO_JUDGE');
  });

  it('bandOfExercise ưu tiên targetGroup, rồi gradeBand cũ, rồi chưa phân lớp', () => {
    expect(bandOfExercise({ targetGroup: 'K10_12', gradeBand: '6-9' })).toBe('9-12');
    expect(bandOfExercise({ gradeBand: '6-9' })).toBe('6-9');
    expect(bandOfExercise({})).toBe(UNGRADED);
  });

  it('bandOfStudent', () => {
    expect(bandOfStudent('10-12')).toBe('9-12');
    expect(bandOfStudent('3-5')).toBe('3-5');
    expect(bandOfStudent(undefined)).toBe('CAREER_ADULT');
  });
});
