import type { AddStudentsResult, CatalogExercise } from '../types/teacherAnalytics';

/** Tách ô nhập "email hoặc mã học viên" (phân cách bằng dấu phẩy, chấm phẩy, khoảng trắng hoặc xuống dòng), bỏ trùng. */
export function parseIdentifiers(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    const v = raw.trim();
    const key = v.toLowerCase();
    if (v && !seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

/** Bật/tắt một bài trong danh sách tích chọn, giữ thứ tự chọn. */
export const toggleSlug = (list: string[], slug: string): string[] =>
  list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];

/** Hai danh sách có cùng tập bài không (không phân biệt thứ tự): dùng để biết có cần lưu hay không. */
export const sameSet = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((x) => b.includes(x));

export const TYPE_LABEL: Record<string, string> = {
  CODE_TEXT: 'Code',
  CODE_BLOCK: 'Kéo thả',
  QUIZ: 'Trắc nghiệm',
  SQL_LAB: 'SQL',
  DA_INSIGHT: 'Insight',
  AI_LAB: 'AI Lab',
};

export const typeLabel = (type: string | null | undefined): string => (type && TYPE_LABEL[type]) || 'Khác';

/** Gom bài theo loại, theo thứ tự TYPE_LABEL; loại lạ xuống cuối ("Khác"). */
export function groupByType(list: CatalogExercise[]): Array<{ label: string; items: CatalogExercise[] }> {
  const order = Object.keys(TYPE_LABEL);
  const groups = new Map<string, CatalogExercise[]>();
  for (const e of list) {
    const label = typeLabel(e.type);
    groups.set(label, [...(groups.get(label) ?? []), e]);
  }
  const rank = (label: string) => {
    const i = order.findIndex((k) => TYPE_LABEL[k] === label);
    return i === -1 ? order.length : i;
  };
  return [...groups.entries()].sort((a, b) => rank(a[0]) - rank(b[0])).map(([label, items]) => ({ label, items }));
}

/** Thông báo ngắn sau khi thêm học viên. */
export function describeAddResult(r: AddStudentsResult): string {
  const parts: string[] = [];
  if (r.added.length) parts.push(`Đã thêm ${r.added.length}`);
  if (r.already.length) parts.push(`${r.already.length} đã trong lớp`);
  if (r.notFound.length) parts.push(`không tìm thấy: ${r.notFound.join(', ')}`);
  return parts.length ? `${parts.join('; ')}.` : 'Không có thay đổi.';
}

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const IMPORT_ACCEPT = '.xlsx,.xls,.csv';
const IMPORT_EXT = /\.(xlsx|xls|csv)$/i;

/** Kiểm tra nhanh ở trình duyệt để báo lỗi tức thì; BE vẫn kiểm tra lại đầy đủ (đuôi, chữ ký, 2MB, 500 dòng). */
export function validateImportFile(file: { name: string; size: number } | null | undefined): string | null {
  if (!file) return 'Chưa chọn file.';
  if (!IMPORT_EXT.test(file.name)) return 'Chỉ nhận file .xlsx, .xls hoặc .csv.';
  if (file.size <= 0) return 'File rỗng.';
  if (file.size > MAX_IMPORT_BYTES) return 'File vượt quá 2MB.';
  return null;
}

/** Dòng tóm tắt kết quả import: thêm / đã có / không tồn tại / sai cú pháp / trùng trong file. */
export function summarizeImport(r: {
  added: unknown[];
  already: unknown[];
  notFound: unknown[];
  invalid: unknown[];
  duplicatesInFile: number;
  totalRows: number;
}): string {
  const parts = [`${r.totalRows} dòng`, `thêm ${r.added.length}`];
  if (r.already.length) parts.push(`${r.already.length} đã trong lớp`);
  if (r.notFound.length) parts.push(`${r.notFound.length} không có trong hệ thống`);
  if (r.invalid.length) parts.push(`${r.invalid.length} sai cú pháp`);
  if (r.duplicatesInFile) parts.push(`${r.duplicatesInFile} trùng trong file`);
  return `${parts.join(', ')}.`;
}
