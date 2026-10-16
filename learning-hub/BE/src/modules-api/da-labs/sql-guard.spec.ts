import { checkStudentSql, DATA_LAB_BLOCKED_MESSAGE, scanSql } from './sql-guard';
import { INITIAL_DA_LABS } from '../../data/initial-da-labs';

describe('sql-guard', () => {
  describe('[M1] không bị vượt bằng literal, comment, định danh', () => {
    it.each([
      [
        'E-string giấu set_config',
        "SELECT E'\\'' , set_config('statement_timeout','0',true) --'",
      ],
      ['E-string giấu pg_sleep', "SELECT E'\\'' , pg_sleep(3) --'"],
      ['e thường', "SELECT e'\\'' , pg_sleep(3) --'"],
      ['định danh trong ngoặc kép', 'SELECT "pg_sleep"(3)'],
      ['schema + ngoặc kép', "SELECT pg_catalog.\"set_config\"('a','b',true)"],
      ['comment chen giữa tên hàm và ngoặc', 'SELECT pg_sleep /* x */ (3)'],
      [
        'comment lồng nhau',
        'SELECT 1 /* a /* b */ ; DROP TABLE orders */ , pg_sleep(1)',
      ],
      ['dollar-quote', 'SELECT $$x$$, pg_sleep(1)'],
    ])('%s', (_name, sql) => {
      expect(checkStudentSql(sql).ok).toBe(false);
    });

    it('chặn Unicode escape U&', () => {
      const r = checkStudentSql('SELECT U&"\\0070g_sleep"(1)');
      expect(r).toMatchObject({
        ok: false,
        reason: expect.stringContaining('Unicode'),
      });
    });

    it('chặn lệnh thứ hai giấu sau E-string', () => {
      const r = checkStudentSql("SELECT E'\\''; DELETE FROM orders --'");
      expect(r.ok).toBe(false);
    });
  });

  describe('[M2] chặn view lộ câu SQL của session khác', () => {
    it.each([
      'SELECT query FROM pg_stat_activity',
      'SELECT * FROM pg_catalog.pg_stat_activity',
      'SELECT * FROM "pg_stat_activity"',
      'SELECT * FROM pg_stat_get_activity(NULL)',
    ])('%s', (sql) => {
      expect(checkStudentSql(sql).ok).toBe(false);
    });
  });

  describe('không chặn nhầm câu hợp lệ', () => {
    it.each(INITIAL_DA_LABS.map((l) => [l.slug, l.solutionCode]))(
      'câu tham chiếu %s vẫn qua',
      (_slug, sql) => {
        expect(checkStudentSql(sql)).toMatchObject({ ok: true });
      },
    );

    it('tên hàm cấm nằm trong chuỗi dữ liệu không bị chặn', () => {
      expect(
        checkStudentSql("SELECT * FROM orders WHERE note = 'pg_sleep(1)'").ok,
      ).toBe(true);
    });

    it('cắt `;` và comment ở cuối nhưng không cắt nhầm trong chuỗi', () => {
      expect(checkStudentSql("SELECT '--x' AS a; -- ghi chú")).toEqual({
        ok: true,
        sql: "SELECT '--x' AS a",
      });
      expect(checkStudentSql('SELECT 1 /* c */ ;')).toEqual({
        ok: true,
        sql: 'SELECT 1',
      });
    });
  });

  it('scanSql giữ nội dung định danh cho lượt quét tên hàm', () => {
    const s = scanSql('SELECT "My Col" FROM t');
    expect(s.code).toBe('SELECT "" FROM t');
    expect(s.codeWithIdentifiers).toContain('My Col');
  });
});

describe('[Data Lab SQLite] rào chắn chỉ-đọc', () => {
  const blocked = (sql: string) => {
    const r = checkStudentSql(sql);
    return !r.ok && r.blocked === true && r.reason === DATA_LAB_BLOCKED_MESSAGE;
  };

  it.each([
    'INSERT INTO orders VALUES (1)',
    'UPDATE orders SET total_amount = 0',
    'DELETE FROM orders',
    'REPLACE INTO orders VALUES (1)',
    'MERGE INTO orders USING x ON 1=1',
    'DROP TABLE orders',
    'CREATE TABLE t (a int)',
    'ALTER TABLE orders ADD c int',
    'TRUNCATE orders',
    'ALTER TABLE orders RENAME TO o2',
    'PRAGMA table_info(orders)',
    "ATTACH DATABASE 'a.db' AS a",
    'DETACH DATABASE a',
    'VACUUM',
    'REINDEX',
    "SELECT load_extension('x')",
    'SELECT name FROM sqlite_master',
    'SELECT * FROM sqlite_temp_master',
    'SELECT * FROM sqlite_sequence',
  ])('chặn (400) "%s"', (sql) => {
    expect(blocked(sql)).toBe(true);
  });

  it('chặn câu thứ hai giấu sau dấu ; hoặc sau comment', () => {
    expect(blocked('SELECT 1; DELETE FROM orders')).toBe(true);
    expect(blocked('SELECT 1 /* x */; DROP TABLE orders -- hết')).toBe(true);
    const multi = checkStudentSql('SELECT 1; SELECT 2');
    expect(multi).toMatchObject({ ok: false });
    expect(!multi.ok && multi.blocked).toBeFalsy();
  });

  it('comment che giấu lệnh ghi/can thiệp bị chặn 400; comment bình thường và từ khóa trong chuỗi dữ liệu thì không', () => {
    expect(blocked('SELECT * FROM orders -- DROP TABLE orders')).toBe(true);
    expect(blocked('SELECT 1 /* DROP TABLE x */ FROM orders')).toBe(true);
    expect(blocked('SELECT * FROM orders -- PRAGMA table_info')).toBe(true);
    // Chuỗi dữ liệu chứa chữ DELETE không phải lệnh; comment vô hại được bỏ đi bình thường.
    expect(checkStudentSql("SELECT 'DELETE' AS a FROM orders").ok).toBe(true);
    expect(checkStudentSql('SELECT * FROM orders -- lấy toàn bộ đơn hàng').ok).toBe(true);
    expect(checkStudentSql('SELECT /* tất cả */ * FROM orders').ok).toBe(true);
  });

  it('chỉ nhận SELECT hoặc WITH; hàm REPLACE() là câu đọc hợp lệ', () => {
    expect(checkStudentSql('WITH t AS (SELECT 1 AS a) SELECT * FROM t').ok).toBe(true);
    expect(checkStudentSql("SELECT REPLACE(city, 'a', 'b') FROM customers").ok).toBe(true);
    expect(blocked('EXPLAIN SELECT 1')).toBe(true);
  });
});
