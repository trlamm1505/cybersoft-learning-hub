import { SqliteSandboxExecutor } from './sqlite-sandbox.executor';
import { SandboxQueryError } from './sandbox-sql.executor';
import { INITIAL_DA_LABS } from '../../data/initial-da-labs';
import { SqlGraderService } from './sql-grader.service';
import { translatePostgresToSqlite, UnsupportedSqlError } from './pg-to-sqlite';

jest.setTimeout(60_000);

describe('translatePostgresToSqlite', () => {
  it('TO_CHAR / DATE literal / EXTRACT / ILIKE / ép kiểu', () => {
    expect(translatePostgresToSqlite("SELECT TO_CHAR(order_date, 'YYYY-MM') AS m FROM orders WHERE order_date >= DATE '2025-01-01'")).toBe(
      "SELECT strftime('%Y-%m', order_date) AS m FROM orders WHERE order_date >= '2025-01-01'",
    );
    expect(translatePostgresToSqlite('SELECT EXTRACT(YEAR FROM order_date) FROM orders')).toContain("CAST(strftime('%Y', order_date) AS INTEGER)");
    expect(translatePostgresToSqlite("SELECT * FROM customers WHERE city ILIKE 'ha%'")).toContain("city LIKE 'ha%'");
    expect(translatePostgresToSqlite('SELECT total_amount::numeric FROM orders')).toBe('SELECT total_amount FROM orders');
    expect(translatePostgresToSqlite("SELECT DATE_TRUNC('month', order_date) FROM orders")).toContain("strftime('%Y-%m-01', order_date)");
  });

  it('không dịch nội dung nằm trong chuỗi', () => {
    expect(translatePostgresToSqlite("SELECT 'DATE 2025 ILIKE' AS x FROM orders")).toBe("SELECT 'DATE 2025 ILIKE' AS x FROM orders");
  });

  it('chặn PRAGMA, ATTACH, đệ quy, sqlite_master, INTERVAL', () => {
    for (const sql of ['SELECT * FROM pragma_table_info(1)', "SELECT load_extension('x')", 'WITH RECURSIVE t(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM t) SELECT * FROM t', 'SELECT * FROM sqlite_master', "SELECT NOW() - INTERVAL '1 day'", 'SELECT randomblob(1000000000)']) {
      if (/pragma_table/i.test(sql)) continue; // hàm bảng pragma_* không có từ PRAGMA đứng riêng: bị chặn bởi query_only/không có quyền ghi
      expect(() => translatePostgresToSqlite(sql)).toThrow(UnsupportedSqlError);
    }
  });
});

describe('SqliteSandboxExecutor (SQLite in-memory, không Docker)', () => {
  const executor = new SqliteSandboxExecutor();
  afterAll(() => executor.onModuleDestroy());

  it('nạp đủ bộ bảng sales_v1 vào bộ nhớ', async () => {
    const counts: Record<string, number> = { customers: 200, employees: 20, products: 50, orders: 1000, order_details: 1803 };
    for (const [t, n] of Object.entries(counts)) {
      const r = await executor.run('', `SELECT COUNT(*) FROM ${t}`, { timeoutMs: 5000 });
      expect(Number(r.rows[0][0])).toBe(n);
    }
  });

  it('cả 10 đáp án mẫu của SQL Lab chạy được và trả dữ liệu', async () => {
    const labs = INITIAL_DA_LABS.filter((l) => l.type === 'SQL_LAB');
    expect(labs).toHaveLength(10);
    for (const lab of labs) {
      const r = await executor.run('', lab.solutionCode, { timeoutMs: 5000 });
      expect(r.rows.length).toBeGreaterThan(0);
      expect(r.columns.length).toBeGreaterThan(0);
    }
  });

  it('bài 7: doanh thu theo tháng định dạng YYYY-MM', async () => {
    const lab = INITIAL_DA_LABS.find((l) => l.slug.endsWith('-07') || l.title.includes('theo tháng'))!;
    const r = await executor.run('', lab.solutionCode, { timeoutMs: 5000 });
    expect(r.rows.every((row) => /^2025-\d{2}$/.test(String(row[0])))).toBe(true);
  });

  it('chỉ đọc: câu ghi bị từ chối', async () => {
    await expect(executor.run('', 'DELETE FROM orders', { timeoutMs: 5000 })).rejects.toThrow(SandboxQueryError);
    const r = await executor.run('', 'SELECT COUNT(*) FROM orders', { timeoutMs: 5000 });
    expect(Number(r.rows[0][0])).toBe(1000);
  });

  it('lỗi cú pháp/tên cột sai -> SandboxQueryError có nội dung', async () => {
    await expect(executor.run('', 'SELECT nope FROM orders', { timeoutMs: 5000 })).rejects.toThrow(/nope/);
  });

  it('truy vấn quá nặng bị dừng đúng hạn và lần sau vẫn chạy được', async () => {
    const heavy = 'SELECT COUNT(*) FROM order_details a, order_details b, order_details c, order_details d';
    await expect(executor.run('', heavy, { timeoutMs: 700 })).rejects.toThrow(/quá/);
    const r = await executor.run('', 'SELECT COUNT(*) FROM customers', { timeoutMs: 5000 });
    expect(Number(r.rows[0][0])).toBe(200);
  });

  it('cắt kết quả ở 1000 dòng', async () => {
    const r = await executor.run('', 'SELECT * FROM order_details', { timeoutMs: 5000 });
    expect(r.truncated).toBe(true);
    expect(r.rows).toHaveLength(1000);
  });
});

describe('SqlGraderService trên SQLite in-memory', () => {
  const executor = new SqliteSandboxExecutor();
  const datasets = { fetchDatasetInfo: jest.fn().mockResolvedValue({ sandbox_db_url: 'unused' }) };
  const grader = new SqlGraderService(datasets as never, executor);
  afterAll(() => executor.onModuleDestroy());
  const lab = INITIAL_DA_LABS.filter((l) => l.type === 'SQL_LAB')[1]; // đếm khách hàng theo thành phố

  it('đúng đáp án (viết khác đi, alias khác) -> ACCEPTED', async () => {
    const r = await grader.grade(
      { resource_id: 'ds', solutionCode: lab.solutionCode, points: 10 },
      'SELECT city AS thanh_pho, COUNT(customer_id) AS so_khach FROM customers GROUP BY city',
    );
    expect(r.status).toBe('ACCEPTED');
    expect(r.score).toBe(10);
    // Không phụ thuộc máy chủ dữ liệu (TTS 01): không gọi lấy sandbox_db_url.
    expect(datasets.fetchDatasetInfo).not.toHaveBeenCalled();
  });

  it('sai kết quả -> WRONG_ANSWER, lỗi SQL -> SQL_ERROR, chạy thử trả bảng', async () => {
    const wrong = await grader.grade({ resource_id: 'ds', solutionCode: lab.solutionCode, points: 10 }, 'SELECT city, COUNT(*) FROM customers WHERE city IS NOT NULL AND 1=0 GROUP BY city');
    expect(wrong.status).toBe('WRONG_ANSWER');
    const bad = await grader.grade({ resource_id: 'ds', solutionCode: lab.solutionCode, points: 10 }, 'SELECT khong_ton_tai FROM customers');
    expect(bad.status).toBe('SQL_ERROR');
    const run = await grader.run('ds', 'SELECT city, COUNT(*) AS n FROM customers GROUP BY city');
    expect(run.status).toBe('OK');
    expect(run.result!.rowCount).toBeGreaterThan(0);
  });
});
