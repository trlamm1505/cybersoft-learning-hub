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

// Hàm hệ thống có thể đọc file, gọi ra ngoài, đổi cấu hình phiên hoặc làm treo kết nối.
const FORBIDDEN_FUNCTIONS = [
  'pg_sleep',
  'pg_sleep_for',
  'pg_sleep_until',
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
  'pg_stat_get_activity',
  'pg_stat_get_backend_activity',
];

// View hệ thống lộ câu SQL đang chạy của session khác (mọi học viên dùng chung
// role lab_reader). DB đã thu hồi quyền (02-lab-reader.sh); đây là lớp thứ hai.
const FORBIDDEN_RELATIONS = ['pg_stat_activity'];

export type SqlGuardResult =
  { ok: true; sql: string } | { ok: false; reason: string };

export interface ScannedSql {
  /** Câu SQL đã thay literal, định danh trong ngoặc kép và comment bằng khoảng trống: để quét từ khóa. */
  code: string;
  /** Giống `code` nhưng giữ nội dung định danh trong ngoặc kép: để quét tên hàm/bảng (`"pg_sleep"(1)`). */
  codeWithIdentifiers: string;
  /** Vị trí ngay sau ký tự có nghĩa cuối cùng (bỏ khoảng trắng, `;`, comment ở cuối). */
  end: number;
  /** Có chuỗi/định danh dạng Unicode escape `U&...`. */
  hasUnicodeEscape: boolean;
}

const isIdentChar = (ch: string | undefined) =>
  !!ch && /[A-Za-z0-9_$]/.test(ch);

/**
 * Quét câu SQL một lượt theo đúng thứ tự xuất hiện, như lexer của Postgres:
 * comment `--` và `/* *\/` (lồng nhau), chuỗi '...' (escape ''), chuỗi E'...'
 * (escape bằng \), định danh "..." và chuỗi $tag$...$tag$. Cách cũ dùng regex
 * lần lượt (bỏ comment trước rồi mới bỏ literal) nên `E'\'' , set_config(...) --'`
 * giấu được hàm cấm.
 */
export function scanSql(sql: string): ScannedSql {
  let code = '';
  let codeWithIdentifiers = '';
  let end = 0;
  let hasUnicodeEscape = false;
  const n = sql.length;
  let i = 0;

  const emit = (text: string, withIdent = text, significant = true) => {
    code += text;
    codeWithIdentifiers += withIdent;
    if (significant) end = i;
  };

  while (i < n) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === '-' && next === '-') {
      while (i < n && sql[i] !== '\n') i++;
      emit(' ', ' ', false);
      continue;
    }

    if (ch === '/' && next === '*') {
      let depth = 1;
      i += 2;
      while (i < n && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth++;
          i += 2;
        } else if (sql[i] === '*' && sql[i + 1] === '/') {
          depth--;
          i += 2;
        } else {
          i++;
        }
      }
      emit(' ', ' ', false);
      continue;
    }

    if (ch === "'") {
      const prev = sql[i - 1];
      const prefixed =
        (prev === 'e' || prev === 'E') && !isIdentChar(sql[i - 2]);
      if (prev === '&' && (sql[i - 2] === 'u' || sql[i - 2] === 'U'))
        hasUnicodeEscape = true;
      i++;
      while (i < n) {
        if (prefixed && sql[i] === '\\') {
          i += 2;
        } else if (sql[i] === "'") {
          if (sql[i + 1] === "'") i += 2;
          else break;
        } else {
          i++;
        }
      }
      i++;
      emit("''");
      continue;
    }

    if (ch === '"') {
      if (sql[i - 1] === '&' && (sql[i - 2] === 'u' || sql[i - 2] === 'U'))
        hasUnicodeEscape = true;
      let ident = '';
      i++;
      while (i < n) {
        if (sql[i] === '"') {
          if (sql[i + 1] === '"') {
            ident += '"';
            i += 2;
          } else break;
        } else {
          ident += sql[i];
          i++;
        }
      }
      i++;
      emit('""', ` ${ident} `);
      continue;
    }

    if (ch === '$' && !isIdentChar(sql[i - 1])) {
      const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (tag) {
        const close = sql.indexOf(tag[0], i + tag[0].length);
        i = close === -1 ? n : close + tag[0].length;
        emit("''");
        continue;
      }
    }

    i++;
    emit(ch, ch, ch !== ';' && !/\s/.test(ch));
  }

  return { code, codeWithIdentifiers, end, hasUnicodeEscape };
}

/** Giữ để tương thích: câu SQL đã bỏ literal, định danh trong ngoặc kép và comment. */
export function stripLiteralsAndComments(sql: string): string {
  return scanSql(sql).code;
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

  const scanned = scanSql(sql);
  if (scanned.hasUnicodeEscape) {
    return {
      ok: false,
      reason: 'Không hỗ trợ chuỗi hoặc định danh dạng Unicode escape (U&...).',
    };
  }

  // Chỉ cho phép đúng một câu lệnh; dấu `;` ở cuối được bỏ qua.
  const body = scanned.code.trim().replace(/;\s*$/, '');
  if (body.includes(';')) {
    return { ok: false, reason: 'Chỉ được chạy một câu lệnh SQL mỗi lần.' };
  }
  if (!/^(SELECT|WITH)\b/i.test(body) && !/^\(\s*SELECT\b/i.test(body)) {
    return {
      ok: false,
      reason:
        'Lab chỉ cho phép câu truy vấn đọc dữ liệu (SELECT hoặc WITH ... SELECT).',
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
  const lower = scanned.codeWithIdentifiers.toLowerCase();
  for (const fn of FORBIDDEN_FUNCTIONS) {
    if (new RegExp(`\\b${fn}\\s*\\(`).test(lower)) {
      return { ok: false, reason: `Không được gọi hàm hệ thống ${fn}().` };
    }
  }
  for (const rel of FORBIDDEN_RELATIONS) {
    if (new RegExp(`\\b${rel}\\b`).test(lower)) {
      return { ok: false, reason: `Không được truy vấn view hệ thống ${rel}.` };
    }
  }

  // Bỏ khoảng trắng, `;` và comment ở cuối (theo kết quả quét, không cắt nhầm
  // bên trong chuỗi) để câu có thể bọc làm subquery.
  return { ok: true, sql: sql.slice(0, scanned.end) };
}
