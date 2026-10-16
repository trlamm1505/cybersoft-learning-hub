import type { ContestItem, ContestProblem } from '../../types/contest';

/** Biểu mẫu tạo/sửa cuộc thi: thời gian ở dạng chuỗi của <input type="datetime-local">. */
export interface ContestForm {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  integrityEnabled: boolean;
  problems: ContestProblem[];
}

export const DURATION_PRESETS = [30, 60, 90, 120, 180];
export const MAX_POINTS = 1000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → "YYYY-MM-DDTHH:mm" theo giờ máy người dùng (đúng định dạng datetime-local). */
export const toLocalInput = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const parseLocalInput = (value: string): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const windowMinutes = (startTime: string, endTime: string): number => {
  const s = parseLocalInput(startTime);
  const e = parseLocalInput(endTime);
  if (!s || !e) return 0;
  return Math.round((e.getTime() - s.getTime()) / 60000);
};

/** Cuộc thi mới: bắt đầu sau 1 giờ (làm tròn 5 phút), thời lượng 90 phút, kết thúc = bắt đầu + thời lượng. */
export const newContestForm = (now: Date = new Date()): ContestForm => {
  const start = new Date(now.getTime() + 60 * 60000);
  start.setMinutes(Math.ceil(start.getMinutes() / 5) * 5, 0, 0);
  const duration = 90;
  return {
    title: '',
    description: '',
    startTime: toLocalInput(start),
    endTime: toLocalInput(new Date(start.getTime() + duration * 60000)),
    durationMinutes: duration,
    integrityEnabled: true,
    problems: [],
  };
};

export const formFromContest = (c: ContestItem): ContestForm => ({
  title: c.title,
  description: c.description ?? '',
  startTime: toLocalInput(new Date(c.startTime)),
  endTime: toLocalInput(new Date(c.endTime)),
  durationMinutes: c.durationMinutes ?? 90,
  integrityEnabled: c.integrityEnabled !== false,
  problems: [...(c.problems ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
});

/** Đổi giờ bắt đầu: giữ nguyên độ dài khung giờ thi (kéo giờ kết thúc đi theo). */
export const changeStart = (form: ContestForm, startTime: string): ContestForm => {
  const oldWindow = windowMinutes(form.startTime, form.endTime);
  const s = parseLocalInput(startTime);
  if (!s || oldWindow <= 0) return { ...form, startTime };
  return { ...form, startTime, endTime: toLocalInput(new Date(s.getTime() + oldWindow * 60000)) };
};

/** Chọn thời lượng làm bài: nếu khung giờ ngắn hơn thì kéo giờ kết thúc dài ra cho vừa. */
export const changeDuration = (form: ContestForm, minutes: number): ContestForm => {
  const safe = Math.max(1, Math.floor(minutes) || 1);
  const s = parseLocalInput(form.startTime);
  if (s && windowMinutes(form.startTime, form.endTime) < safe) {
    return { ...form, durationMinutes: safe, endTime: toLocalInput(new Date(s.getTime() + safe * 60000)) };
  }
  return { ...form, durationMinutes: safe };
};

const renumber = (list: ContestProblem[]): ContestProblem[] => list.map((p, i) => ({ ...p, order: i + 1 }));

export const addProblem = (problems: ContestProblem[], problem: ContestProblem): ContestProblem[] =>
  problems.some((p) => p.slug === problem.slug) ? problems : renumber([...problems, problem]);

export const removeProblem = (problems: ContestProblem[], slug: string): ContestProblem[] =>
  renumber(problems.filter((p) => p.slug !== slug));

export const moveProblem = (problems: ContestProblem[], index: number, direction: -1 | 1): ContestProblem[] => {
  const target = index + direction;
  if (index < 0 || index >= problems.length || target < 0 || target >= problems.length) return problems;
  const next = [...problems];
  [next[index], next[target]] = [next[target], next[index]];
  return renumber(next);
};

export const setProblemPoints = (problems: ContestProblem[], slug: string, points: number): ContestProblem[] =>
  problems.map((p) => (p.slug === slug ? { ...p, points } : p));

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Đề trắc nghiệm ghép từ ngân hàng: dựng đề mới với slug không trùng đề nào đang có. */
export const makeBankProblem = (
  title: string,
  questionIds: string[],
  points: number,
  existing: ContestProblem[],
): ContestProblem => {
  const name = title.trim() || `Phần trắc nghiệm ${existing.filter((p) => p.source === 'bank').length + 1}`;
  const base = slugify(name) || 'trac-nghiem';
  let slug = base;
  for (let i = 2; existing.some((p) => p.slug === slug); i++) slug = `${base}-${i}`;
  return { source: 'bank', title: name, slug, type: 'quiz', points, questionIds };
};

export const summarizeProblems = (problems: ContestProblem[]) => ({
  total: problems.length,
  coding: problems.filter((p) => p.type !== 'quiz').length,
  quiz: problems.filter((p) => p.type === 'quiz').length,
  totalPoints: problems.reduce((sum, p) => sum + (p.points ?? 0), 0),
});

/** Danh sách lỗi (tiếng Việt) chặn việc lưu; rỗng là hợp lệ. `publish` yêu cầu thêm ít nhất một đề. */
export const validateForm = (form: ContestForm, publish: boolean): string[] => {
  const errors: string[] = [];
  if (!form.title.trim()) errors.push('Nhập tên cuộc thi.');
  const s = parseLocalInput(form.startTime);
  const e = parseLocalInput(form.endTime);
  if (!s || !e) {
    errors.push('Chọn giờ bắt đầu và giờ kết thúc.');
  } else if (s >= e) {
    errors.push('Giờ kết thúc phải sau giờ bắt đầu.');
  } else if (form.durationMinutes > windowMinutes(form.startTime, form.endTime)) {
    errors.push('Thời gian làm bài của mỗi thí sinh không được dài hơn khung giờ thi.');
  }
  if (!(form.durationMinutes >= 1)) errors.push('Thời gian làm bài phải từ 1 phút.');
  for (const p of form.problems) {
    if (!Number.isFinite(p.points) || (p.points ?? 0) < 1 || (p.points ?? 0) > MAX_POINTS) {
      errors.push(`Điểm của "${p.title}" phải từ 1 đến ${MAX_POINTS}.`);
    }
  }
  if (publish && form.problems.length === 0) errors.push('Thêm ít nhất một đề trước khi xuất bản.');
  return errors;
};

/** Payload gửi lên BE; thời gian đổi sang ISO (UTC) để không lệch múi giờ. */
export const buildPayload = (form: ContestForm, status: 'draft' | 'published'): Partial<ContestItem> => ({
  title: form.title.trim(),
  description: form.description.trim(),
  startTime: parseLocalInput(form.startTime)!.toISOString(),
  endTime: parseLocalInput(form.endTime)!.toISOString(),
  durationMinutes: form.durationMinutes,
  integrityEnabled: form.integrityEnabled,
  status,
  problems: renumber(form.problems),
});

export type ContestPhase = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'ENDED';

export const contestPhase = (c: Pick<ContestItem, 'status' | 'startTime' | 'endTime'>, now: Date = new Date()): ContestPhase => {
  if (c.status === 'draft') return 'DRAFT';
  if (now < new Date(c.startTime)) return 'UPCOMING';
  if (now > new Date(c.endTime)) return 'ENDED';
  return 'ONGOING';
};

export const PHASE_LABEL: Record<ContestPhase, string> = {
  DRAFT: 'Bản nháp',
  UPCOMING: 'Sắp diễn ra',
  ONGOING: 'Đang diễn ra',
  ENDED: 'Đã kết thúc',
};

/** Cuộc thi đã bắt đầu thì không đổi giờ bắt đầu và danh sách đề (BE chặn). */
export const isStructureLocked = (c: Pick<ContestItem, 'startTime'> | null, now: Date = new Date()): boolean =>
  !!c && now >= new Date(c.startTime);
