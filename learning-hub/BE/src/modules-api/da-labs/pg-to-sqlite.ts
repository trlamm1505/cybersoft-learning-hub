/**
 * Lớp tương thích PostgreSQL -> SQLite cho Data Lab chạy bằng SQLite in-memory.
 *
 * Đề và đáp án mẫu viết theo cú pháp PostgreSQL (TO_CHAR, DATE '...', ILIKE...), học viên cũng viết theo đề, nên
 * câu SQL được dịch sang SQLite trước khi chạy. Chỉ dịch các cấu trúc thông dụng trong bài lab; cấu trúc ngoài danh sách
 * sẽ báo lỗi SQL rõ ràng từ SQLite. Cả đáp án mẫu lẫn bài làm đều đi qua CÙNG bộ dịch nên so sánh kết quả vẫn công bằng.
 */

export class UnsupportedSqlError extends Error {}

/** Từ khóa/hàm không được phép trên SQLite in-memory (đọc/ghi file, nạp extension, tạo blob lớn, đệ quy vô hạn). */
const BLOCKED = /\b(PRAGMA|ATTACH|DETACH|LOAD_EXTENSION|RANDOMBLOB|ZEROBLOB|RECURSIVE|SQLITE_MASTER|SQLITE_SCHEMA|SQLITE_TEMP_MASTER)\b/i;

/** Che nội dung chuỗi/comment để tìm từ khóa mà không bị nhiễu bởi dữ liệu trong chuỗi. */
function maskLiterals(sql: string): string {
  return sql
    .replace(/'(?:[^']|'')*'/g, (m) => `'${'x'.repeat(m.length - 2)}'`)
    .replace(/--[^\n]*/g, (m) => ' '.repeat(m.length))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
}

/** Áp dụng `fn` chỉ lên phần NGOÀI chuỗi ký tự (giữ nguyên nội dung trong dấu nháy đơn). */
function outsideLiterals(sql: string, fn: (segment: string) => string): string {
  let out = '';
  let last = 0;
  for (const m of sql.matchAll(/'(?:[^']|'')*'/g)) {
    out += fn(sql.slice(last, m.index)) + m[0];
    last = (m.index ?? 0) + m[0].length;
  }
  return out + fn(sql.slice(last));
}

/** Vị trí dấu `)` đóng tương ứng với `(` ở `open`; -1 nếu không khớp. Bỏ qua dấu ngoặc trong chuỗi. */
function matchParen(masked: string, open: number): number {
  let depth = 0;
  for (let i = open; i < masked.length; i++) {
    if (masked[i] === '(') depth++;
    else if (masked[i] === ')' && --depth === 0) return i;
  }
  return -1;
}

/** Tách đối số cấp cao nhất theo dấu phẩy (dùng bản đã che chuỗi để tìm vị trí, cắt trên bản gốc). */
function splitArgs(original: string, masked: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < masked.length; i++) {
    const ch = masked[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(original.slice(last, i).trim());
      last = i + 1;
    }
  }
  out.push(original.slice(last).trim());
  return out;
}

const TO_CHAR_TOKENS: Array<[RegExp, string]> = [
  [/YYYY/gi, '%Y'],
  [/YY/gi, '%y'],
  [/MM/g, '%m'],
  [/DD/gi, '%d'],
  [/HH24/gi, '%H'],
  [/HH12|HH/gi, '%I'],
  [/MI/g, '%M'],
  [/SS/gi, '%S'],
];

const toStrftimeFormat = (fmt: string): string => {
  let out = fmt;
  for (const [re, rep] of TO_CHAR_TOKENS) out = out.replace(re, rep);
  return out;
};

/** Thay mọi lời gọi `NAME(args)` bằng kết quả của `build(args)`; xử lý từ ngoài vào trong cho các lời gọi lồng nhau. */
function rewriteCalls(sql: string, name: string, build: (args: string[]) => string): string {
  const re = new RegExp(`\\b${name}\\s*\\(`, 'i');
  let guard = 0;
  let current = sql;
  for (;;) {
    const masked = maskLiterals(current);
    const m = re.exec(masked);
    if (!m || guard++ > 50) return current;
    const open = m.index + m[0].length - 1;
    const close = matchParen(masked, open);
    if (close < 0) return current;
    const inner = current.slice(open + 1, close);
    const args = splitArgs(inner, masked.slice(open + 1, close)).map((a) => translateExpression(a));
    current = `${current.slice(0, m.index)}${build(args)}${current.slice(close + 1)}`;
  }
}

function translateExpression(sql: string): string {
  let out = sql;
  out = rewriteCalls(out, 'TO_CHAR', (a) => {
    const fmt = /^'(.*)'$/s.exec(a[1] ?? '');
    if (!fmt) throw new UnsupportedSqlError('TO_CHAR chỉ hỗ trợ chuỗi định dạng cố định, ví dụ TO_CHAR(order_date, \'YYYY-MM\').');
    return `strftime('${toStrftimeFormat(fmt[1])}', ${a[0]})`;
  });
  out = rewriteCalls(out, 'DATE_TRUNC', (a) => {
    const unit = /^'(\w+)'$/.exec(a[0] ?? '')?.[1]?.toLowerCase();
    const fmt = unit === 'year' ? '%Y-01-01' : unit === 'month' ? '%Y-%m-01' : unit === 'day' ? '%Y-%m-%d' : null;
    if (!fmt) throw new UnsupportedSqlError("DATE_TRUNC chỉ hỗ trợ 'year', 'month', 'day'.");
    return `strftime('${fmt}', ${a[1]})`;
  });
  return out;
}

/**
 * Dịch câu SELECT kiểu PostgreSQL sang SQLite. Ném UnsupportedSqlError nếu có cấu trúc bị chặn
 * (PRAGMA, ATTACH, đệ quy...) để học viên nhận thông báo rõ ràng thay vì lỗi cú pháp khó hiểu.
 */
export function translatePostgresToSqlite(sql: string): string {
  const masked = maskLiterals(sql);
  const blocked = BLOCKED.exec(masked);
  if (blocked) {
    throw new UnsupportedSqlError(`Từ khóa "${blocked[1].toUpperCase()}" không được dùng trong Data Lab.`);
  }
  if (/\bINTERVAL\b/i.test(masked)) {
    throw new UnsupportedSqlError('Data Lab chưa hỗ trợ INTERVAL; hãy so sánh ngày bằng toán tử >=, < với DATE.');
  }

  let out = sql;
  // DATE '2025-01-01' / TIMESTAMP '...' -> chuỗi ISO (ngày lưu dạng chuỗi ISO nên so sánh đúng).
  out = out.replace(/\b(?:DATE|TIMESTAMP(?:TZ)?)\s+('(?:[^']|'')*')/gi, '$1');
  // ILIKE -> LIKE (LIKE của SQLite không phân biệt hoa thường với ASCII).
  out = outsideLiterals(out, (s) => s.replace(/\bILIKE\b/gi, 'LIKE').replace(/\bNOW\s*\(\s*\)/gi, "datetime('now')"));
  // EXTRACT(YEAR FROM x) -> số nguyên.
  out = out.replace(/\bEXTRACT\s*\(\s*(YEAR|MONTH|DAY)\s+FROM\s+([^()]+(?:\([^()]*\)[^()]*)*)\)/gi, (_m, unit: string, expr: string) => {
    const f = { YEAR: '%Y', MONTH: '%m', DAY: '%d' }[unit.toUpperCase() as 'YEAR' | 'MONTH' | 'DAY'];
    return `CAST(strftime('${f}', ${expr.trim()}) AS INTEGER)`;
  });
  // Ép kiểu kiểu Postgres: x::numeric, x::date, x::int...
  out = out.replace(/::\s*(?:numeric|decimal|float8?|double\s+precision|real|int(?:eger)?|bigint|text|varchar(?:\(\d+\))?|date|timestamp)\b(?:\(\d+(?:,\s*\d+)?\))?/gi, '');
  out = translateExpression(out);
  return out;
}
