import type { ResultSet } from './sandbox-sql.executor';

/**
 * Chấm bài SQL bằng cách so sánh DỮ LIỆU trả về, không so sánh chuỗi code.
 * Hai câu viết khác nhau (JOIN hay subquery, alias khác tên) vẫn đúng nếu
 * trả ra cùng một tập dữ liệu.
 *
 * Quy tắc:
 * - Tên cột không chấm (học viên được đặt alias tùy ý), chỉ chấm số cột và
 *   giá trị theo đúng vị trí cột.
 * - Thứ tự dòng chỉ chấm khi câu tham chiếu có ORDER BY ở cấp ngoài cùng;
 *   ngược lại so sánh như hai đa tập (multiset), vì SQL không đảm bảo thứ tự.
 * - Số được chuẩn hóa về 6 chữ số thập phân để `2565000`, `'2565000.00'`
 *   (Postgres trả NUMERIC dạng chuỗi) và `2565000.0` là một.
 */

export interface CompareResult {
  match: boolean;
  feedback: string;
}

const NUMERIC_STRING = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i;

export function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'invalid-date' : value.toISOString();
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return Number(value).toFixed(6);
  }
  if (typeof value === 'string' && NUMERIC_STRING.test(value.trim())) {
    return Number(value).toFixed(6);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return `s:${String(value)}`;
}

const rowKey = (row: unknown[]) => JSON.stringify(row.map(normalizeValue));

/** ORDER BY không nằm trong ngoặc nào phía sau, tức là ORDER BY của câu ngoài cùng. */
export function hasTopLevelOrderBy(sql: string): boolean {
  const cleaned = sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  const idx = cleaned.toUpperCase().lastIndexOf('ORDER BY');
  if (idx === -1) return false;
  let depth = 0;
  for (const ch of cleaned.slice(idx)) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return true;
}

export function compareResultSets(
  expected: ResultSet,
  actual: ResultSet,
  orderSensitive: boolean,
): CompareResult {
  if (actual.truncated) {
    return {
      match: false,
      feedback:
        'Kết quả quá nhiều dòng (bị cắt). Kiểm tra lại điều kiện JOIN/WHERE.',
    };
  }
  if (expected.columns.length !== actual.columns.length) {
    return {
      match: false,
      feedback: `Số cột chưa đúng: kết quả của bạn có ${actual.columns.length} cột, đề yêu cầu ${expected.columns.length} cột.`,
    };
  }
  if (expected.rows.length !== actual.rows.length) {
    return {
      match: false,
      feedback: `Số dòng chưa đúng: kết quả của bạn có ${actual.rows.length} dòng, đề yêu cầu ${expected.rows.length} dòng.`,
    };
  }

  if (orderSensitive) {
    for (let i = 0; i < expected.rows.length; i++) {
      if (rowKey(expected.rows[i]) !== rowKey(actual.rows[i])) {
        return {
          match: false,
          feedback: `Dữ liệu hoặc thứ tự sắp xếp khác từ dòng ${i + 1}.`,
        };
      }
    }
    return { match: true, feedback: 'Kết quả khớp dữ liệu và thứ tự sắp xếp.' };
  }

  const counts = new Map<string, number>();
  for (const row of expected.rows) {
    const key = rowKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let mismatched = 0;
  for (const row of actual.rows) {
    const key = rowKey(row);
    const left = counts.get(key) ?? 0;
    if (left === 0) mismatched++;
    else counts.set(key, left - 1);
  }
  if (mismatched > 0) {
    return {
      match: false,
      feedback: `Có ${mismatched}/${actual.rows.length} dòng không khớp dữ liệu mong đợi.`,
    };
  }
  return { match: true, feedback: 'Kết quả khớp dữ liệu mong đợi.' };
}
