import type { AssignmentWindow, CreateDayAssignment, TeacherDay } from '../types/classDays';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD của một thời điểm theo giờ Việt Nam (khớp BE vnDayKey). */
export const vnDayKey = (d: Date): string => new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);

export const addDays = (key: string, n: number): string => new Date(new Date(`${key}T00:00:00.000Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);

/** 00:00 giờ Việt Nam của ngày `key` (ISO UTC). */
export const startOfDayIso = (key: string): string => new Date(`${key}T00:00:00+07:00`).toISOString();

/** Ngày kế tiếp để "Thêm ngày mới": sau ngày cuối cùng; lớp chưa có ngày nào thì bắt đầu từ hôm nay. */
export function nextDayDate(days: Array<Pick<TeacherDay, 'date'>>, extraDates: string[], now: Date = new Date()): string {
  const all = [...days.map((d) => d.date), ...extraDates].sort();
  return all.length ? addDays(all[all.length - 1], 1) : vnDayKey(now);
}

/** Hạn nộp mặc định: 23:59 giờ Việt Nam, 7 ngày kể từ ngày được giao. Giá trị cho input datetime-local. */
export const defaultDueLocal = (dayKey: string): string => `${addDays(dayKey, 7)}T23:59`;

/** Giá trị datetime-local (hiểu theo giờ Việt Nam) -> ISO UTC; null nếu không hợp lệ. */
export function localVnToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const dayTitle = (day: Pick<TeacherDay, 'dayNumber' | 'date'>): string => {
  const [y, m, d] = day.date.split('-');
  return `Ngày ${day.dayNumber} · ${d}/${m}/${y}`;
};

export const TYPE_BADGE = {
  CODING: { icon: '💻', label: 'Code' },
  QUIZ: { icon: '📝', label: 'Trắc nghiệm' },
} as const;

export const WINDOW_LABEL: Record<AssignmentWindow, string> = { UPCOMING: 'Sắp mở', OPEN: 'Đang mở', EXPIRED: 'Hết hạn' };

export interface AddForm {
  type: 'CODING' | 'QUIZ';
  /** CODING: slug bài đã chọn; QUIZ: các id câu hỏi đã chọn. */
  exerciseSlug: string;
  exerciseTitle: string;
  questionIds: string[];
  title: string;
  maxPoints: number;
  dueLocal: string;
}

/** Kiểm tra form thêm bài vào ngày; trả thông báo lỗi tiếng Việt hoặc null nếu hợp lệ. */
export function validateAddForm(f: AddForm, dayKey: string): string | null {
  if (f.type === 'CODING' && !f.exerciseSlug) return 'Hãy chọn một bài code từ ngân hàng đề.';
  if (f.type === 'QUIZ' && f.questionIds.length === 0) return 'Hãy chọn ít nhất 1 câu trắc nghiệm từ ngân hàng đề.';
  if (f.type === 'QUIZ' && f.questionIds.length > 100) return 'Một bài trắc nghiệm tối đa 100 câu.';
  if (!f.title.trim()) return 'Tiêu đề bài không được để trống.';
  if (!Number.isFinite(f.maxPoints) || f.maxPoints < 1 || f.maxPoints > 100) return 'Tổng điểm phải từ 1 đến 100.';
  const due = localVnToIso(f.dueLocal);
  if (!due) return 'Hạn nộp không hợp lệ.';
  if (new Date(due).getTime() <= new Date(startOfDayIso(dayKey)).getTime()) return 'Hạn nộp phải sau thời điểm bắt đầu của ngày được giao.';
  return null;
}

export function buildPayload(f: AddForm, dayKey: string): CreateDayAssignment {
  const base = { title: f.title.trim(), maxPoints: f.maxPoints, startAt: startOfDayIso(dayKey), dueAt: localVnToIso(f.dueLocal) as string };
  return f.type === 'CODING' ? { type: 'CODING', exerciseSlug: f.exerciseSlug, ...base } : { type: 'QUIZ', questionIds: f.questionIds, ...base };
}

/** Thêm/bớt một id trong tập chọn (giữ thứ tự chọn, không trùng). */
export const toggleId = (ids: string[], id: string): string[] => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

export const pageLabel = (page: number, totalPages: number, total: number): string => `Trang ${page}/${Math.max(1, totalPages)} · ${total} bài`;

export const DIFFICULTY_LABEL: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
