import { assignmentState, isOpenForWork, rankMembers, scoreCoding, scoreQuiz, vnDayKey } from './class-scoring';

const t = (min: number) => new Date(Date.UTC(2026, 9, 14, 0, min));
const sub = (status: string, min: number) => ({ status, createdAt: t(min) });

describe('scoreCoding (mỗi lần nộp sai trừ 1 điểm)', () => {
  it('AC ngay lần đầu: đủ điểm', () => {
    expect(scoreCoding([sub('AC', 1)], 10)).toMatchObject({ done: true, score: 10, wrongCount: 0, completedAt: t(1) });
  });

  it('sai 3 lần rồi AC: 10 - 3 = 7 điểm, hoàn thành vào lần AC', () => {
    const r = scoreCoding([sub('WA', 1), sub('TLE', 2), sub('RE', 3), sub('AC', 4)], 10);
    expect(r).toMatchObject({ done: true, wrongCount: 3, score: 7, attempts: 4, completedAt: t(4) });
  });

  it('không xuống dưới 0 điểm', () => {
    const subs = Array.from({ length: 15 }, (_, i) => sub('WA', i)).concat([sub('AC', 20)]);
    expect(scoreCoding(subs, 10).score).toBe(0);
    expect(scoreCoding(subs, 10).done).toBe(true);
  });

  it('CE và FAILED không bị trừ điểm; hàng đợi/đang chạy bị bỏ qua', () => {
    const r = scoreCoding([sub('CE', 1), sub('FAILED', 2), sub('QUEUED', 3), sub('RUNNING', 4), sub('AC', 5)], 10);
    expect(r).toMatchObject({ done: true, wrongCount: 0, score: 10, attempts: 3 });
  });

  it('chỉ lần sai TRƯỚC AC bị trừ; sai sau khi đã AC không ảnh hưởng', () => {
    const r = scoreCoding([sub('WA', 1), sub('AC', 2), sub('WA', 3), sub('WA', 4)], 10);
    expect(r).toMatchObject({ score: 9, wrongCount: 1, completedAt: t(2) });
  });

  it('chưa AC: chưa có điểm nhưng cho biết điểm tiềm năng', () => {
    const r = scoreCoding([sub('WA', 1), sub('WA', 2)], 10);
    expect(r).toMatchObject({ done: false, score: 0, wrongCount: 2, potentialScore: 8 });
  });

  it('không có bài nộp nào (chỉ bấm Run): không bị trừ', () => {
    expect(scoreCoding([], 10)).toMatchObject({ done: false, wrongCount: 0, potentialScore: 10, attempts: 0 });
  });

  it('sắp theo thời gian dù dữ liệu đưa vào lộn xộn', () => {
    expect(scoreCoding([sub('AC', 5), sub('WA', 1)], 10)).toMatchObject({ score: 9 });
  });
});

describe('scoreQuiz', () => {
  it('9/10 điểm', () => {
    expect(scoreQuiz({ score: 90, maxScore: 100, submittedAt: t(5) }, 10)).toEqual({ done: true, score: 9, completedAt: t(5) });
  });
  it('làm tròn 1 chữ số thập phân; chưa nộp thì chưa có điểm', () => {
    expect(scoreQuiz({ score: 70, maxScore: 90, submittedAt: t(1) }, 10).score).toBe(7.8);
    expect(scoreQuiz(null, 10)).toEqual({ done: false, score: 0 });
    expect(scoreQuiz({ score: 10, maxScore: 10 }, 10).done).toBe(false);
  });
});

describe('assignmentState / hạn chót', () => {
  const a = { startAt: t(10), dueAt: t(100) };
  it('đã xong luôn là DONE, kể cả khi quá hạn', () => {
    expect(assignmentState(a, { done: true, attempts: 2 }, t(500))).toBe('DONE');
  });
  it('quá hạn mà chưa xong là EXPIRED (khóa)', () => {
    expect(assignmentState(a, { done: false, attempts: 3 }, t(101))).toBe('EXPIRED');
    expect(isOpenForWork('EXPIRED')).toBe(false);
  });
  it('chưa tới giờ mở là NOT_OPEN; trong hạn thì NOT_STARTED/IN_PROGRESS', () => {
    expect(assignmentState(a, { done: false, attempts: 0 }, t(5))).toBe('NOT_OPEN');
    expect(assignmentState(a, { done: false, attempts: 0 }, t(50))).toBe('NOT_STARTED');
    expect(assignmentState(a, { done: false, attempts: 1 }, t(50))).toBe('IN_PROGRESS');
    expect(isOpenForWork('NOT_OPEN')).toBe(false);
    expect(isOpenForWork('IN_PROGRESS')).toBe(true);
  });
  it('đúng hạn chót vẫn nộp được (so sánh nghiêm ngặt)', () => {
    expect(assignmentState(a, { done: false, attempts: 0 }, t(100))).toBe('NOT_STARTED');
  });
});

describe('rankMembers', () => {
  const m = (userId: string, points: number, min?: number) => ({ userId, name: userId, points, doneCount: 1, lastScoredAt: min === undefined ? null : t(min) });
  it('điểm giảm dần; bằng điểm thì ai nộp sớm hơn xếp trước', () => {
    const r = rankMembers([m('c', 10, 30), m('a', 20, 50), m('b', 10, 20)]);
    expect(r.map((x) => [x.userId, x.rank])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]);
  });
  it('chưa hoàn thành bài nào (0 điểm, không có mốc) xếp cuối', () => {
    const r = rankMembers([m('z', 0), m('y', 0, 5), m('x', 3, 9)]);
    expect(r.map((x) => x.userId)).toEqual(['x', 'y', 'z']);
  });
});

describe('vnDayKey', () => {
  it('nhóm ngày theo giờ Việt Nam (UTC+7)', () => {
    expect(vnDayKey(new Date('2026-03-22T18:00:00Z'))).toBe('2026-03-23');
    expect(vnDayKey(new Date('2026-03-23T16:59:00Z'))).toBe('2026-03-23');
    expect(vnDayKey(new Date('2026-03-23T17:00:00Z'))).toBe('2026-03-24');
  });
});
