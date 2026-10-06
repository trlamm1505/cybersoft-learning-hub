/**
 * Hàm thuần của scripts/ingest-sandbox.js (không I/O) để kiểm thử riêng:
 * phân tích CSV, dựng DDL từ data_dictionary của Registry, sắp bảng theo khóa ngoại.
 */
const { createHash } = require('crypto');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Tên bảng/cột đi vào câu DDL nên chỉ nhận định danh an toàn. */
function ident(name) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) throw new Error(`Định danh không hợp lệ: "${name}"`);
  return `"${name}"`;
}

/** Kiểu dữ liệu đi thẳng vào DDL: chỉ nhận dạng `VARCHAR(10)`, `NUMERIC(12,2)`, `TIMESTAMP`... */
function sqlType(type) {
  if (!/^[A-Za-z]+( [A-Za-z]+)?(\(\s*\d+\s*(,\s*\d+\s*)?\))?$/.test(type)) {
    throw new Error(`Kiểu dữ liệu không hợp lệ: "${type}"`);
  }
  // Từ điển của TTS 01 viết DATETIME (kiểu của SQLite/MySQL); Postgres gọi là TIMESTAMP.
  return /^datetime$/i.test(type) ? 'TIMESTAMP' : type;
}

/** CSV RFC 4180 (có dấu nháy kép, dấu phẩy và xuống dòng trong ô). Trả về mảng dòng, mỗi dòng là mảng ô. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

/** Thứ tự tạo bảng: bảng được tham chiếu (FK) đứng trước. */
function orderTables(tables) {
  const byName = new Map(tables.map((t) => [t.table_name, t]));
  const done = new Set();
  const out = [];
  const visit = (t, stack = []) => {
    if (done.has(t.table_name)) return;
    if (stack.includes(t.table_name)) throw new Error(`Vòng khóa ngoại: ${[...stack, t.table_name].join(' -> ')}`);
    for (const c of t.columns) {
      const target = c.foreign_key_target?.split('.')[0];
      if (target && target !== t.table_name && byName.has(target)) visit(byName.get(target), [...stack, t.table_name]);
    }
    done.add(t.table_name);
    out.push(t);
  };
  tables.forEach((t) => visit(t));
  return out;
}

function createTableSql(table, { constraints = true, schema = 'public' } = {}) {
  const cols = table.columns.map((c) => {
    // Bản dirty cố ý chứa giá trị sai kiểu: giữ nguyên dạng chuỗi để kiểm thử làm sạch.
    const parts = [ident(c.name), constraints ? sqlType(c.data_type) : 'TEXT'];
    if (constraints && !c.nullable) parts.push('NOT NULL');
    return parts.join(' ');
  });
  if (constraints) {
    const pks = table.columns.filter((c) => c.is_primary_key).map((c) => ident(c.name));
    if (pks.length) cols.push(`PRIMARY KEY (${pks.join(', ')})`);
    for (const c of table.columns) {
      if (!c.is_foreign_key || !c.foreign_key_target) continue;
      const [t, col] = c.foreign_key_target.split('.');
      cols.push(`FOREIGN KEY (${ident(c.name)}) REFERENCES ${ident(schema)}.${ident(t)} (${ident(col)})`);
    }
  }
  return `CREATE TABLE ${ident(schema)}.${ident(table.table_name)} (\n  ${cols.join(',\n  ')}\n)`;
}

/** Ô CSV rỗng thành NULL, trừ cột chuỗi không cho phép NULL (giữ chuỗi rỗng). */
function coerceRow(table, cells, { raw = false } = {}) {
  if (raw) return table.columns.map((_, i) => cells[i] ?? null);
  return table.columns.map((c, i) => {
    const v = cells[i];
    if (v === undefined) return null;
    if (v === '' && (c.nullable || !/char|text/i.test(c.data_type))) return null;
    return v;
  });
}

module.exports = { sha256, ident, sqlType, parseCsv, orderTables, createTableSql, coerceRow };
