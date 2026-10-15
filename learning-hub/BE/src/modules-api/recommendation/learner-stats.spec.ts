import { computeLearnerStats } from './learner-stats';

describe('computeLearnerStats', () => {
  const exercises = [
    { id: 'e1', tags: ['loop', 'lop6-9'] },
    { id: 'e2', tags: ['loop', 'list'] },
    { id: 'e3', tags: ['list'] },
    { id: 'e4', tags: [] },
  ];

  it('đếm lượt nộp theo kết quả và tính tỷ lệ AC trên các lượt đã chấm (bỏ FAILED)', () => {
    const s = computeLearnerStats(
      [
        { exerciseId: 'e1', status: 'WA' },
        { exerciseId: 'e1', status: 'AC' },
        { exerciseId: 'e2', status: 'TLE' },
        { exerciseId: 'e2', status: 'RE' },
        { exerciseId: 'e3', status: 'FAILED' },
      ],
      exercises,
    );
    expect(s.submissions).toEqual({ total: 5, ac: 1, wa: 1, tle: 1, re: 1, ce: 0 });
    expect(s.acRate).toBe(25); // 1 / 4 lượt đã chấm
  });

  it('bài đã giải = số bài khác nhau có AC; tổng bài lấy theo danh sách bài của khối', () => {
    const s = computeLearnerStats(
      [
        { exerciseId: 'e1', status: 'AC' },
        { exerciseId: 'e1', status: 'AC' },
      ],
      exercises,
    );
    expect(s.solvedExercises).toBe(1);
    expect(s.totalExercises).toBe(4);
  });

  it('tỷ lệ hoàn thành theo chủ đề, bỏ tag khối lớp, sắp theo số bài giảm dần', () => {
    const s = computeLearnerStats([{ exerciseId: 'e2', status: 'AC' }], exercises);
    expect(s.topics).toEqual([
      { tag: 'list', solved: 1, total: 2, percent: 50 },
      { tag: 'loop', solved: 1, total: 2, percent: 50 },
    ]);
    expect(s.topics.some((t) => t.tag === 'lop6-9')).toBe(false);
  });

  it('chưa nộp gì: mọi số bằng 0, không chia cho 0', () => {
    const s = computeLearnerStats([], exercises);
    expect(s.acRate).toBe(0);
    expect(s.solvedExercises).toBe(0);
    expect(s.submissions.total).toBe(0);
  });
});
