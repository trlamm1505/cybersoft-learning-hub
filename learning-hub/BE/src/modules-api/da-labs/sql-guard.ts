/**
 * Kiểm tra tĩnh câu SQL của học viên TRƯỚC khi mở kết nối tới sandbox.
 *
 * Đây là lớp phòng thủ thứ nhất, để từ chối sớm và trả thông báo dễ hiểu.
 * Lớp chặn thật sự nằm ở DB: giao dịch `READ ONLY`, `statement_timeout` và
 * tài khoản `lab_reader` chỉ có quyền SELECT (xem PgSandboxExecutor), nên dù
 * một câu lọt qua đây cũng không ghi hay xóa được dữ liệu.
 */

export const MAX_SQL_LENGTH = 5_000;

const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'MERGE',
  'UPSERT',
  'DROP',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'COPY',
  'CALL',
  'DO',
  'EXECUTE',
  'PREPARE',
  'DEALLOCATE',
  'SET',
  'RESET',
  'VACUUM',
  'ANALYZE',
  'CLUSTER',
  'REINDEX',
  'LOCK',
  'LISTEN',
  'NOTIFY',
  'COMMENT',
  'REFRESH',
  'DISCARD',
  'CHECKPOINT',
  'SECURITY',
  'BEGIN',
  'COMMIT',
  'ROLLBACK',
  'SAVEPOINT',
  // `SELECT ... INTO new_table` tạo bảng mới.
  'INTO',
];

// Hàm hệ thống có thể đọc file, gọi ra ngoài hoặc làm treo kết nối.
const FORBIDDEN_FUNCTIONS = [
  'pg_sleep',
  'pg_read_file',
  'pg_read_binary_file',
  'pg_ls_dir',
  'pg_stat_file',
  'pg_terminate_backend',
  'pg_cancel_backend',
  'pg_reload_conf',
  'set_config',
  'lo_import',
  'lo_export',
  'dblink',
  'query_to_xml',
];

export type SqlGuardResult = { ok: true; sql: string } | { ok: false; reason: string };

/** Bỏ chuỗi literal, định danh trong ngoặc kép và comment để quét từ khóa không bị nhiễu. */
export function stripLiteralsAndComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""')
    .replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, "''");
}

export function checkStudentSql(input: string): SqlGuardResult {
  const sql = (input ?? '').trim();
  if (!sql) return { ok: false, reason: 'Câu SQL đang trống.' };
  if (sql.length > MAX_SQL_LENGTH) {
    return {
      ok: false,
      reason: `Câu SQL dài quá ${MAX_SQL_LENGTH} ký tự.`,
    };
  }

  const scanned = stripLiteralsAndComments(sql).trim();
  // Chỉ cho phép đúng một câu lệnh; dấu `;` ở cuối được bỏ qua.
  const body = scanned.replace(/;\s*$/, '');
  if (body.includes(';')) {
    return { ok: false, reason: 'Chỉ được chạy một câu lệnh SQL mỗi lần.' };
  }
  if (!/^(SELECT|WITH)\b/i.test(body) && !/^\(\s*SELECT\b/i.test(body)) {
    return {
      ok: false,
      reason: 'Lab chỉ cho phép câu truy vấn đọc dữ liệu (SELECT hoặc WITH ... SELECT).',
    };
  }

  const upper = body.toUpperCase();
  for (const kw of FORBIDDEN_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`).test(upper)) {
      return {
        ok: false,
        reason: `Câu lệnh chứa từ khóa không được phép trong sandbox: ${kw}.`,
      };
    }
  }
  if (/\bFOR\s+(UPDATE|SHARE|NO\s+KEY\s+UPDATE|KEY\s+SHARE)\b/.test(upper)) {
    return { ok: false, reason: 'Không được khóa dòng (FOR UPDATE/SHARE).' };
  }
  const lower = body.toLowerCase();
  for (const fn of FORBIDDEN_FUNCTIONS) {
    if (new RegExp(`\\b${fn}\\s*\\(`).test(lower)) {
      return { ok: false, reason: `Không được gọi hàm hệ thống ${fn}().` };
    }
  }

  // Bỏ `;` và comment dòng ở cuối để câu có thể bọc làm subquery.
  return { ok: true, sql: sql.replace(/(?:;|\s|--[^\n]*)+$/, '') };
}
