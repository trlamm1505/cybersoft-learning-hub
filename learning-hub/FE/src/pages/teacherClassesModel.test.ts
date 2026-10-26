import { describe, expect, it } from 'vitest';
import { ageGroupLabel, resolveClassId, totalPending, totalStudents } from './teacherClassesModel';

describe('teacherClassesModel', () => {
  const list = [
    { id: 'a', pendingSubmissions: 2, studentCount: 10 },
    { id: 'b', pendingSubmissions: 0, studentCount: 5 },
  ];
  it('giữ classId hợp lệ trên URL', () => expect(resolveClassId(list, 'b')).toBe('b'));
  it('classId lạ (lớp của GV khác) về lớp đầu tiên', () => expect(resolveClassId(list, 'zzz')).toBe('a'));
  it('không có classId thì chọn lớp đầu', () => expect(resolveClassId(list, null)).toBe('a'));
  it('chưa có lớp thì rỗng', () => expect(resolveClassId([], 'a')).toBe(''));
  it('cộng dồn bài chờ chấm và học viên', () => {
    expect(totalPending(list)).toBe(2);
    expect(totalStudents(list)).toBe(15);
  });
  it('nhãn khối', () => {
    expect(ageGroupLabel('3-5')).toBe('Khối 3-5');
    expect(ageGroupLabel(null)).toBe('Chưa phân khối');
  });
});

import { classKind, honorRoll, kidLevel, kidStars, percentLabel } from './teacherClassesModel';

describe('giao diện theo nhóm đào tạo', () => {
  it('phân loại theo ageGroup', () => {
    expect(classKind('3-5')).toBe('KID');
    expect(classKind('6-9')).toBe('SCHOOL');
    expect(classKind('10-12')).toBe('SCHOOL');
    expect(classKind('CAREER_ADULT')).toBe('CAREER');
    expect(classKind(null)).toBe('SCHOOL');
  });
  it('sao và cấp ải', () => {
    expect(kidStars(4)).toBe(4);
    expect(kidLevel(0)).toBe(1);
    expect(kidLevel(3)).toBe(2);
    expect(kidLevel(7)).toBe(3);
  });
  it('bảng vinh danh lấy tối đa 3 bé nhiều sao nhất', () => {
    const rows = [
      { name: 'B', passedExercises: 2 },
      { name: 'A', passedExercises: 5 },
      { name: 'C', passedExercises: 0 },
      { name: 'D', passedExercises: 2 },
      { name: 'E', passedExercises: 1 },
    ];
    expect(honorRoll(rows).map((r) => r.name)).toEqual(['A', 'B', 'D']);
  });
  it('tỷ lệ phần trăm', () => {
    expect(percentLabel(0.756)).toBe('76%');
    expect(percentLabel(null)).toBe('—');
  });
});

import { assignmentWindow, outTabSeverity, submissionStatus } from './teacherClassesModel';

describe('trạng thái nộp bài & out-tab', () => {
  it('Passed / Wrong Answer / Chưa nộp', () => {
    expect(submissionStatus({ attemptedExercises: 2, passedExercises: 2, bestScorePercent: 100 }, 2)).toEqual({ state: 'PASSED', label: 'Passed 100/100' });
    expect(submissionStatus({ attemptedExercises: 2, passedExercises: 0, bestScorePercent: 60 }, 2)).toEqual({ state: 'WRONG_ANSWER', label: 'Wrong Answer 60/100' });
    expect(submissionStatus({ attemptedExercises: 0, passedExercises: 0, bestScorePercent: null }, 2).state).toBe('NOT_SUBMITTED');
    expect(submissionStatus(undefined, 2).state).toBe('NOT_SUBMITTED');
    expect(submissionStatus(undefined, 0).state).toBe('NO_EXERCISE');
  });
  it('mức cảnh báo out-tab', () => {
    expect(outTabSeverity(3)).toBe('RED');
    expect(outTabSeverity(2)).toBe('AMBER');
  });
  it('cửa sổ thời gian của bài giao', () => {
    const now = new Date('2026-10-16T00:00:00Z').getTime();
    expect(assignmentWindow('2026-10-17T00:00:00Z', '2026-10-20T00:00:00Z', now)).toBe('UPCOMING');
    expect(assignmentWindow('2026-10-10T00:00:00Z', '2026-10-20T00:00:00Z', now)).toBe('OPEN');
    expect(assignmentWindow('2026-10-10T00:00:00Z', '2026-10-14T00:00:00Z', now)).toBe('EXPIRED');
  });
});

import { classGroupIcon, finalGradeBadge, kidHonorRoll, sortKidsForTeacher } from './teacherClassesModel';

describe('Teacher Studio: sidebar lớp, điểm tổng kết, tiến độ ải', () => {
  it('biểu tượng theo khối', () => {
    expect(['3-5', '6-9', '10-12', 'CAREER_ADULT'].map((g) => classGroupIcon(g as never))).toEqual(['🎒', '📘', '🚀', '💼']);
  });
  it('nhãn điểm tổng kết', () => {
    expect(finalGradeBadge({ locked: true, provisional: false, pending: 0, letter: 'F' })).toMatchObject({ kind: 'LOCKED', label: 'Khóa kết quả - Điểm F', tooltip: 'Bỏ nộp > 30% số bài tập' });
    expect(finalGradeBadge({ locked: false, provisional: true, pending: 1, letter: 'C' }).label).toBe('Tạm thời (1 bài chờ chấm)');
    expect(finalGradeBadge({ locked: false, provisional: false, pending: 0, letter: 'B' }).label).toBe('Hạng B');
  });
  it('bé bị kẹt đứng đầu; vinh danh theo sao', () => {
    const rows = [
      { fullName: 'Gia Hân', starsEarned: 12, stuckAlert: { active: false } },
      { fullName: 'Minh Khang', starsEarned: 9, stuckAlert: { active: true } },
      { fullName: 'Bảo An', starsEarned: 15, stuckAlert: { active: false } },
    ];
    expect(sortKidsForTeacher(rows).map((r) => r.fullName)).toEqual(['Minh Khang', 'Bảo An', 'Gia Hân']);
    expect(kidHonorRoll(rows).map((r) => r.fullName)).toEqual(['Bảo An', 'Gia Hân', 'Minh Khang']);
  });
});

import { isTesterSummary } from './teacherClassesModel';

describe('lớp Tester QA', () => {
  it('nhận diện theo courseKey hoặc mã lớp', () => {
    expect(isTesterSummary({ courseKey: 'tester-qa' })).toBe(true);
    expect(isTesterSummary({ code: 'CL-CAREER-TESTER' })).toBe(true);
    expect(isTesterSummary({ courseKey: 'data-sql', code: 'CL-CAREER-DATA' })).toBe(false);
    expect(isTesterSummary(null)).toBe(false);
  });
});
