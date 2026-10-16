import type { BankTestCase, QuestionBankDetail, QuestionBankRow, QuestionBankUpdate } from '../types/questionBank';

export const BANK_DELETE_BLOCKED = 'Không thể xóa bài tập đang được sử dụng trong Lớp học hoặc Cuộc thi';

export const BAND_LABEL = { '6-9': 'Khối 6–9', '10-12': 'Khối 10–12' } as const;
export const bandLabel = (b: QuestionBankRow['band']): string => (b ? BAND_LABEL[b] : 'Chưa phân loại');

export const sourceLabel = (s: QuestionBankRow['source']): string => (s === 'BANK' ? 'Ngân hàng' : 'Playground (cố định)');

/** "Đang dùng: 2 lớp, 1 cuộc thi" hoặc rỗng khi chưa dùng ở đâu. */
export const usageLabel = (u: QuestionBankRow['usage']): string => {
  const parts = [u.classes > 0 ? `${u.classes} lớp` : '', u.contests > 0 ? `${u.contests} cuộc thi` : ''].filter(Boolean);
  return parts.length ? `Đang dùng: ${parts.join(', ')}` : '';
};

export interface EditForm {
  title: string;
  description: string;
  band: '6-9' | '10-12';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  testCases: BankTestCase[];
}

export const formFromDetail = (d: QuestionBankDetail): EditForm => ({
  title: d.title,
  description: d.description,
  band: d.band ?? '6-9',
  difficulty: d.difficulty ?? 'EASY',
  testCases: d.testCases.map((t) => ({ ...t })),
});

/** Lỗi nhập liệu (tiếng Việt) trước khi gửi; null nếu hợp lệ. Khớp quy tắc của backend. */
export function validateEditForm(f: EditForm): string | null {
  if (!f.title.trim()) return 'Tiêu đề không được để trống.';
  if (f.title.trim().length > 200) return 'Tiêu đề tối đa 200 ký tự.';
  if (!f.description.trim()) return 'Mô tả đề bài không được để trống.';
  if (f.testCases.length < 2) return 'Cần ít nhất 2 test case.';
  if (f.testCases.length > 50) return 'Tối đa 50 test case.';
  if (!f.testCases.some((t) => !t.isHidden)) return 'Cần ít nhất một test case hiện cho học viên xem.';
  return null;
}

/** Chỉ gửi các trường thật sự thay đổi. */
export function diffUpdate(original: QuestionBankDetail, f: EditForm): QuestionBankUpdate {
  const out: QuestionBankUpdate = {};
  if (f.title.trim() !== original.title) out.title = f.title.trim();
  if (f.description.trim() !== original.description) out.description = f.description.trim();
  if (f.band !== original.band) out.band = f.band;
  if (f.difficulty !== original.difficulty) out.difficulty = f.difficulty;
  if (JSON.stringify(f.testCases) !== JSON.stringify(original.testCases)) out.testCases = f.testCases;
  return out;
}

/** Thông báo lỗi từ API (409 đang dùng, 403...) hoặc câu dự phòng. */
export const apiMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
