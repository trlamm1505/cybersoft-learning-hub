import { checkStudentSql, scanSql } from './sql-guard';
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
