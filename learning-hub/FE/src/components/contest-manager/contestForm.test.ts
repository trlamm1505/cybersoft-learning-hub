import { describe, expect, it } from 'vitest';
import {
  addProblem,
  buildPayload,
  changeDuration,
  changeStart,
  contestPhase,
  formFromContest,
  isStructureLocked,
  makeBankProblem,
  moveProblem,
  newContestForm,
  removeProblem,
  setProblemPoints,
  summarizeProblems,
  toLocalInput,
  validateForm,
  windowMinutes,
  type ContestForm,
} from './contestForm';
import type { ContestItem, ContestProblem } from '../../types/contest';

const p = (slug: string, type: 'coding' | 'quiz' = 'coding', points = 10): ContestProblem => ({
  slug,
  title: slug.toUpperCase(),
  type,
  points,
  source: type === 'quiz' ? 'bank' : 'exercise',
});

const base = (over: Partial<ContestForm> = {}): ContestForm => ({
  title: 'Cuộc thi',
  description: '',
  startTime: '2026-10-05T09:00',
  endTime: '2026-10-05T10:30',
  durationMinutes: 90,
  integrityEnabled: true,
  problems: [p('a')],
  ...over,
});

describe('biểu mẫu cuộc thi — thời gian', () => {
  it('cuộc thi mới: bắt đầu sau ~1 giờ, kết thúc = bắt đầu + 90 phút, giám sát bật', () => {
    const f = newContestForm(new Date('2026-10-05T08:02:00'));
    expect(f.startTime).toBe('2026-10-05T09:05');
    expect(windowMinutes(f.startTime, f.endTime)).toBe(90);
    expect(f.durationMinutes).toBe(90);
    expect(f.integrityEnabled).toBe(true);
  });

  it('đổi giờ bắt đầu thì giờ kết thúc đi theo, giữ nguyên độ dài khung giờ', () => {
    const f = changeStart(base(), '2026-10-06T14:00');
    expect(f.endTime).toBe('2026-10-06T15:30');
  });

  it('chọn thời lượng dài hơn khung giờ thì kéo giờ kết thúc ra; ngắn hơn thì giữ khung giờ', () => {
    expect(changeDuration(base(), 120).endTime).toBe('2026-10-05T11:00');
    const shorter = changeDuration(base(), 30);
    expect(shorter.durationMinutes).toBe(30);
    expect(shorter.endTime).toBe('2026-10-05T10:30');
  });

  it('toLocalInput khớp định dạng datetime-local theo giờ máy', () => {
    expect(toLocalInput(new Date(2026, 9, 5, 7, 5))).toBe('2026-10-05T07:05');
  });
});

describe('biểu mẫu cuộc thi — danh sách đề', () => {
  it('thêm đề không trùng, đánh lại số thứ tự', () => {
    let list: ContestProblem[] = [];
    list = addProblem(list, p('a'));
    list = addProblem(list, p('b', 'quiz'));
    list = addProblem(list, p('a'));
    expect(list.map((x) => [x.slug, x.order])).toEqual([['a', 1], ['b', 2]]);
  });

  it('xóa và đổi vị trí đề giữ số thứ tự liên tục; không đổi mảng gốc', () => {
    const list = [p('a'), p('b'), p('c')].map((x, i) => ({ ...x, order: i + 1 }));
    expect(moveProblem(list, 2, -1).map((x) => x.slug)).toEqual(['a', 'c', 'b']);
    expect(moveProblem(list, 0, -1)).toBe(list);
    expect(moveProblem(list, 2, 1)).toBe(list);
    expect(removeProblem(list, 'b').map((x) => [x.slug, x.order])).toEqual([['a', 1], ['c', 2]]);
    expect(list.map((x) => x.slug)).toEqual(['a', 'b', 'c']);
  });

  it('sửa điểm một đề và thống kê loại đề/tổng điểm', () => {
    const list = setProblemPoints([p('a', 'coding', 10), p('q', 'quiz', 20)], 'a', 50);
    expect(summarizeProblems(list)).toEqual({ total: 2, coding: 1, quiz: 1, totalPoints: 70 });
  });
});

describe('makeBankProblem', () => {
  it('đặt slug từ tên (bỏ dấu), thêm hậu tố khi trùng, tên trống thì đặt tên mặc định', () => {
    const first = makeBankProblem('Phần trắc nghiệm Python', ['q1'], 20, []);
    expect(first).toMatchObject({ source: 'bank', type: 'quiz', slug: 'phan-trac-nghiem-python', points: 20, questionIds: ['q1'] });
    const second = makeBankProblem('Phần trắc nghiệm Python', ['q2'], 10, [first]);
    expect(second.slug).toBe('phan-trac-nghiem-python-2');
    expect(makeBankProblem('  ', ['q3'], 5, [first]).title).toBe('Phần trắc nghiệm 2');
  });
});

describe('validateForm', () => {
  it('hợp lệ thì không có lỗi', () => {
    expect(validateForm(base(), true)).toEqual([]);
  });

  it('báo thiếu tên, giờ sai thứ tự, thời lượng dài hơn khung giờ', () => {
    expect(validateForm(base({ title: '  ' }), false)).toContain('Nhập tên cuộc thi.');
    expect(validateForm(base({ endTime: '2026-10-05T08:00' }), false)).toContain('Giờ kết thúc phải sau giờ bắt đầu.');
    expect(validateForm(base({ durationMinutes: 200 }), false)).toContain(
      'Thời gian làm bài của mỗi thí sinh không được dài hơn khung giờ thi.',
    );
    expect(validateForm(base({ startTime: '' }), false)).toContain('Chọn giờ bắt đầu và giờ kết thúc.');
  });

  it('xuất bản cần ít nhất một đề; lưu nháp thì không', () => {
    expect(validateForm(base({ problems: [] }), true)).toContain('Thêm ít nhất một đề trước khi xuất bản.');
    expect(validateForm(base({ problems: [] }), false)).toEqual([]);
  });

  it('điểm mỗi đề phải từ 1 đến 1000', () => {
    expect(validateForm(base({ problems: [p('a', 'coding', 0)] }), false)[0]).toMatch(/phải từ 1 đến 1000/);
    expect(validateForm(base({ problems: [p('a', 'coding', 1001)] }), false)[0]).toMatch(/phải từ 1 đến 1000/);
  });
});

describe('buildPayload / formFromContest', () => {
  it('payload dùng ISO, cắt khoảng trắng, đánh số đề, mang trạng thái và cờ giám sát', () => {
    const payload = buildPayload(base({ title: '  Thi thử  ', integrityEnabled: false }), 'draft');
    expect(payload.title).toBe('Thi thử');
    expect(payload.status).toBe('draft');
    expect(payload.integrityEnabled).toBe(false);
    expect(payload.startTime).toBe(new Date('2026-10-05T09:00').toISOString());
    expect(payload.problems?.[0].order).toBe(1);
  });

  it('dựng lại biểu mẫu từ cuộc thi cũ: sắp xếp đề theo order, mặc định bật giám sát', () => {
    const c = {
      title: 'Cũ',
      slug: 'cu',
      startTime: new Date(2026, 9, 5, 9, 0).toISOString(),
      endTime: new Date(2026, 9, 5, 10, 30).toISOString(),
      problems: [{ ...p('b'), order: 2 }, { ...p('a'), order: 1 }],
    } as ContestItem;
    const f = formFromContest(c);
    expect(f.problems.map((x) => x.slug)).toEqual(['a', 'b']);
    expect(f.integrityEnabled).toBe(true);
    expect(f.startTime).toBe('2026-10-05T09:00');
  });
});

describe('giai đoạn cuộc thi', () => {
  const now = new Date('2026-10-05T10:00:00');
  const c = (status: 'draft' | 'published', s: string, e: string) => ({ status, startTime: s, endTime: e });

  it('nháp / sắp diễn ra / đang diễn ra / đã kết thúc', () => {
    expect(contestPhase(c('draft', '2026-10-05T09:00:00', '2026-10-05T11:00:00'), now)).toBe('DRAFT');
    expect(contestPhase(c('published', '2026-10-05T11:00:00', '2026-10-05T12:00:00'), now)).toBe('UPCOMING');
    expect(contestPhase(c('published', '2026-10-05T09:00:00', '2026-10-05T11:00:00'), now)).toBe('ONGOING');
    expect(contestPhase(c('published', '2026-10-05T07:00:00', '2026-10-05T09:00:00'), now)).toBe('ENDED');
  });

  it('đã bắt đầu thì khóa giờ bắt đầu và danh sách đề', () => {
    expect(isStructureLocked({ startTime: '2026-10-05T09:00:00' }, now)).toBe(true);
    expect(isStructureLocked({ startTime: '2026-10-05T11:00:00' }, now)).toBe(false);
    expect(isStructureLocked(null, now)).toBe(false);
  });
});
