import { describe, expect, it } from 'vitest';
import { actionLabel, exercisePath, passedPercent, sortAssignments, STATUS_LABEL } from './studentClassesModel';
import type { MyClassExercise } from '../types/studentClasses';

const ex = (slug: string, status: MyClassExercise['status']): MyClassExercise => ({
  slug,
  title: slug,
  type: null,
  difficulty: null,
  tags: [],
  status,
  attempts: 0,
  lastAt: null,
});

describe('studentClassesModel', () => {
  it('nhãn trạng thái đúng ba trạng thái yêu cầu', () => {
    expect(STATUS_LABEL).toEqual({ NOT_STARTED: 'Chưa làm', ATTEMPTED: 'Đang làm', PASSED: 'Đã đạt' });
    expect(actionLabel('NOT_STARTED')).toBe('Làm bài');
    expect(actionLabel('ATTEMPTED')).toBe('Làm tiếp');
    expect(actionLabel('PASSED')).toBe('Làm lại');
  });

  it('đường dẫn theo loại bài, slug được mã hoá', () => {
    expect(exercisePath('SQL_LAB', 'sql-1')).toBe('/da-labs/sql-1');
    expect(exercisePath('DA_INSIGHT', 'ins')).toBe('/da-labs/ins');
    expect(exercisePath('AI_LAB', 'ai-1')).toBe('/ai-labs/ai-1');
    expect(exercisePath('CODE_TEXT', 'py-1')).toBe('/playground?slug=py-1');
    expect(exercisePath(null, 'a b&c')).toBe('/playground?slug=a%20b%26c');
    expect(exercisePath('QUIZ', 'q')).toBe('/quiz');
    expect(exercisePath('CODE_BLOCK', 'b')).toBe('/block-puzzle');
  });

  it('phần trăm đạt không chia cho 0', () => {
    expect(passedPercent(1, 4)).toBe(25);
    expect(passedPercent(0, 0)).toBe(0);
    expect(passedPercent(2, 3)).toBe(67);
  });

  it('bài chưa đạt lên trước, giữ thứ tự trong nhóm, không đổi mảng gốc', () => {
    const list = [ex('a', 'PASSED'), ex('b', 'NOT_STARTED'), ex('c', 'ATTEMPTED'), ex('d', 'NOT_STARTED')];
    expect(sortAssignments(list).map((e) => e.slug)).toEqual(['c', 'b', 'd', 'a']);
    expect(list.map((e) => e.slug)).toEqual(['a', 'b', 'c', 'd']);
  });
});
