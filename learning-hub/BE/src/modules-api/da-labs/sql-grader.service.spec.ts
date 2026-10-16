import { ServiceUnavailableException } from '@nestjs/common';
import { Client, types } from 'pg';
import { SqlGraderService, SQL_TIMEOUT_MS } from './sql-grader.service';
import {
  PgSandboxExecutor,
  SandboxQueryError,
  SandboxUnavailableError,
} from './sandbox-sql.executor';
import type {
  ResultSet,
  SandboxSqlExecutor,
  SqlRunOptions,
} from './sandbox-sql.executor';
import type { DatasetIntegrationService } from '../../integration/dataset-integration.service';
import type { DatasetContract } from '../../integration/dataset-contract.types';

// Chỉ khối test múi giờ ở cuối file dùng Client giả; các khối khác mock executor.
jest.mock('pg', () => ({ ...jest.requireActual('pg'), Client: jest.fn() }));

/**
 * fetchDatasetInfo được mock để trả về một "DB giả định" của TTS 01; executor
 * được mock thành một DB trong bộ nhớ: mỗi câu SQL (đã chuẩn hóa khoảng
 * trắng) ứng với một tập kết quả. Nhờ vậy test chứng minh được grader so
 * sánh DỮ LIỆU: hai câu khác chữ nhưng cùng dữ liệu thì đúng, hai câu gần
 * giống chữ nhưng khác dữ liệu thì sai.
 */
const SANDBOX_URL = 'postgresql://lab_reader:pw@sandbox.test:5432/sales_v1';

const FAKE_CONTRACT: DatasetContract = {
  resource_id: 'ds-retail-ecommerce-sales-v1',
  dataset_name: 'Sales Performance',
  version: 'v1.0',
  sandbox_db_url: SANDBOX_URL,
  data_dictionary: {
    tables: [
      {
        name: 'orders',
        columns: [
          { name: 'order_id', type: 'VARCHAR(10)', nullable: false, description: '' },
          { name: 'total_amount', type: 'NUMERIC(14,2)', nullable: false, description: '' },
        ],
      },
    ],
  },
};

const rs = (columns: string[], rows: unknown[][]): ResultSet => ({
  columns,
  rows,
  truncated: false,
});

const REFERENCE =
  "SELECT order_id, total_amount FROM orders WHERE order_status = 'Completed' AND total_amount > 20000000";
const REFERENCE_ORDERED = `${REFERENCE} ORDER BY total_amount DESC`;

// "DB giả định": câu SQL -> tập kết quả.
const FAKE_DB: Record<string, ResultSet> = {
  [REFERENCE]: rs(
    ['order_id', 'total_amount'],
    [
      ['ORD_001', '26625000.00'],
      ['ORD_004', '51671000.00'],
    ],
  ),
  [REFERENCE_ORDERED]: rs(
    ['order_id', 'total_amount'],
    [
      ['ORD_004', '51671000.00'],
      ['ORD_001', '26625000.00'],
    ],
  ),
  // Viết khác hoàn toàn (alias, subquery) nhưng cùng dữ liệu, số dạng number.
  'SELECT x.order_id AS ma_don, x.total_amount AS tong FROM (SELECT * FROM orders WHERE total_amount > 20000000) x WHERE x.order_status = \'Completed\'':
    rs(
      ['ma_don', 'tong'],
      [
        ['ORD_004', 51671000],
        ['ORD_001', 26625000],
      ],
    ),
  // Gần như trùng chữ với câu tham chiếu (>= thay vì >) nhưng dữ liệu khác.
  "SELECT order_id, total_amount FROM orders WHERE order_status = 'Completed' AND total_amount >= 2000000":
    rs(
      ['order_id', 'total_amount'],
      [
        ['ORD_001', '26625000.00'],
        ['ORD_004', '51671000.00'],
        ['ORD_002', '4701000.00'],
      ],
    ),
  "SELECT 'DROP TABLE orders' AS note": rs(['note'], [['DROP TABLE orders']]),
};

const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('SqlGraderService', () => {
  let executor: jest.Mocked<SandboxSqlExecutor>;
  let datasets: { fetchDatasetInfo: jest.Mock };
  let service: SqlGraderService;

  beforeEach(() => {
    datasets = { fetchDatasetInfo: jest.fn().mockResolvedValue(FAKE_CONTRACT) };
    executor = {
      run: jest.fn(async (_url: string, sql: string, _opts: SqlRunOptions) => {
        const hit = Object.entries(FAKE_DB).find(
          ([key]) => normalize(key) === normalize(sql),
        );
        if (!hit) throw new SandboxQueryError(`relation "khong_ton_tai" does not exist`);
        return hit[1];
      }),
    };
    service = new SqlGraderService(
      datasets as unknown as DatasetIntegrationService,
      executor,
    );
  });

  const exercise = (solutionCode = REFERENCE) => ({
    resource_id: 'ds-retail-ecommerce-sales-v1',
    solutionCode,
    points: 10,
  });

  describe('chấm đúng khi cùng dữ liệu đầu ra', () => {
    it('câu viết khác chữ hoàn toàn nhưng cùng ResultSet thì ACCEPTED', async () => {
      const student =
        "SELECT x.order_id AS ma_don, x.total_amount AS tong FROM (SELECT * FROM orders WHERE total_amount > 20000000) x WHERE x.order_status = 'Completed'";
      expect(student).not.toEqual(REFERENCE);

      const result = await service.grade(exercise(), student);

      expect(result.status).toBe('ACCEPTED');
      expect(result.score).toBe(10);
    });

    it('lấy sandbox_db_url từ fetchDatasetInfo theo resource_id của bài', async () => {
      await service.grade(exercise(), REFERENCE);

      expect(datasets.fetchDatasetInfo).toHaveBeenCalledWith(
        'ds-retail-ecommerce-sales-v1',
      );
      expect(executor.run).toHaveBeenCalledWith(SANDBOX_URL, REFERENCE, {
        timeoutMs: SQL_TIMEOUT_MS,
      });
    });

    it('câu tham chiếu có ORDER BY thì thứ tự dòng sai bị WRONG_ANSWER', async () => {
      const result = await service.grade(exercise(REFERENCE_ORDERED), REFERENCE);

      expect(result.status).toBe('WRONG_ANSWER');
      expect(result.feedback).toContain('thứ tự');
    });

    it('câu gần trùng chữ với đáp án nhưng khác dữ liệu thì WRONG_ANSWER', async () => {
      const result = await service.grade(
        exercise(),
        "SELECT order_id, total_amount FROM orders WHERE order_status = 'Completed' AND total_amount >= 2000000",
      );

      expect(result.status).toBe('WRONG_ANSWER');
      expect(result.score).toBe(0);
      expect(result.feedback).toContain('3 dòng');
    });

    it('lỗi cú pháp/sai tên bảng trả SQL_ERROR kèm thông báo của DB', async () => {
      const result = await service.grade(exercise(), 'SELECT * FROM khong_ton_tai');

      expect(result.status).toBe('SQL_ERROR');
      expect(result.feedback).toContain('does not exist');
    });
  });

  describe('bảo vệ DB cô lập', () => {
    it.each([
      'DROP TABLE orders',
      'drop table orders;',
      "SELECT * FROM orders; DROP TABLE orders",
      "SELECT 1; DROP TABLE orders; --",
      'WITH x AS (DELETE FROM orders RETURNING *) SELECT * FROM x',
      'SELECT * INTO orders_copy FROM orders',
      'SELECT pg_sleep(60)',
      'TRUNCATE orders',
    ])('chặn "%s" trước khi chạm tới sandbox', async (sql) => {
      const result = await service.grade(exercise(), sql);

      expect(result.status).toBe('REJECTED');
      expect(result.score).toBe(0);
      expect(executor.run).not.toHaveBeenCalled();
      expect(datasets.fetchDatasetInfo).not.toHaveBeenCalled();
    });

    it('chữ "DROP TABLE" nằm trong chuỗi literal thì không bị chặn nhầm', async () => {
      const result = await service.run(
        'ds-retail-ecommerce-sales-v1',
        "SELECT 'DROP TABLE orders' AS note",
      );

      expect(result.status).toBe('OK');
    });

    it('sandbox không kết nối được thì báo 503, không trả điểm 0', async () => {
      executor.run.mockRejectedValueOnce(new SandboxUnavailableError('ECONNREFUSED'));

      await expect(service.grade(exercise(), REFERENCE)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});

describe('SqlGraderService + PgSandboxExecutor — ngày tháng không bị lệch múi giờ', () => {
  // OID kiểu dữ liệu của Postgres: DATE, TIMESTAMP, TIMESTAMPTZ.
  const DATE_OID = 1082;
  const TIMESTAMP_OID = 1114;
  const TIMESTAMPTZ_OID = 1184;

  /**
   * Client giả parse giá trị thô giống driver `pg` thật: lấy parser từ
   * `config.types` mà executor truyền vào (nếu có), ngược lại dùng parser mặc
   * định của pg, vốn đổi DATE thành Date theo múi giờ máy và gây lệch ngày.
   */
  function mockPgReturning(raw: Array<{ name: string; oid: number; value: string }>) {
    (Client as unknown as jest.Mock).mockImplementation((config: { types?: typeof types }) => {
      const parserFor = (oid: number) =>
        (config.types ?? types).getTypeParser(oid, 'text') as (v: string) => unknown;
      return {
        connect: jest.fn().mockResolvedValue(undefined),
        end: jest.fn().mockResolvedValue(undefined),
        query: jest.fn(async (q: string | { text: string }) => {
          const text = typeof q === 'string' ? q : q.text;
          if (!text.includes('lab_result')) return {};
          return {
            fields: raw.map((c) => ({ name: c.name, dataTypeID: c.oid })),
            rows: [raw.map((c) => parserFor(c.oid)(c.value))],
          };
        }),
      };
    });
  }

  it('DATE 2025-04-09 xuất ra đúng chuỗi 2025-04-09, không lùi về 2025-04-08', async () => {
    mockPgReturning([
      { name: 'order_id', oid: 25, value: 'ORD_004' },
      { name: 'order_date', oid: DATE_OID, value: '2025-04-09' },
    ]);
    const datasets = { fetchDatasetInfo: jest.fn().mockResolvedValue(FAKE_CONTRACT) };
    const service = new SqlGraderService(
      datasets as unknown as DatasetIntegrationService,
      new PgSandboxExecutor(),
    );

    const result = await service.run(
      'ds-retail-ecommerce-sales-v1',
      "SELECT order_id, order_date FROM orders WHERE order_id = 'ORD_004'",
    );

    expect(result.status).toBe('OK');
    const [row] = result.result!.rows;
    expect(row[1]).toBe('2025-04-09');
    // Đi qua JSON như khi trả về trình duyệt vẫn giữ nguyên ngày.
    expect(JSON.parse(JSON.stringify(row))[1]).toBe('2025-04-09');
    expect(JSON.stringify(row)).not.toContain('2025-04-08');
  });

  it('TIMESTAMP và TIMESTAMPTZ giữ nguyên chuỗi Postgres trả về, không đổi sang UTC', async () => {
    mockPgReturning([
      { name: 'created_at', oid: TIMESTAMP_OID, value: '2025-04-09 00:00:00' },
      { name: 'paid_at', oid: TIMESTAMPTZ_OID, value: '2025-04-09 00:30:00+07' },
    ]);
    const service = new SqlGraderService(
      { fetchDatasetInfo: jest.fn().mockResolvedValue(FAKE_CONTRACT) } as unknown as DatasetIntegrationService,
      new PgSandboxExecutor(),
    );

    const result = await service.run(
      'ds-retail-ecommerce-sales-v1',
      'SELECT created_at, paid_at FROM orders',
    );

    expect(result.result!.rows[0]).toEqual(['2025-04-09 00:00:00', '2025-04-09 00:30:00+07']);
  });

  it('chấm đúng khi học viên và câu tham chiếu cùng trả cột DATE', async () => {
    mockPgReturning([{ name: 'order_date', oid: DATE_OID, value: '2025-04-09' }]);
    const service = new SqlGraderService(
      { fetchDatasetInfo: jest.fn().mockResolvedValue(FAKE_CONTRACT) } as unknown as DatasetIntegrationService,
      new PgSandboxExecutor(),
    );

    const result = await service.grade(
      {
        resource_id: 'ds-retail-ecommerce-sales-v1',
        solutionCode: 'SELECT order_date FROM orders',
        points: 10,
      },
      'SELECT o.order_date AS ngay FROM orders o',
    );

    expect(result.status).toBe('ACCEPTED');
    expect(result.result!.rows[0][0]).toBe('2025-04-09');
  });
});
