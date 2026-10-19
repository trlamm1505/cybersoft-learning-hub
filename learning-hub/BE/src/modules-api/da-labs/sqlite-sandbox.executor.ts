import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { MAX_RESULT_ROWS, SandboxQueryError, SandboxUnavailableError } from './sandbox-sql.executor';
import type { ResultSet, SandboxSqlExecutor, SqlRunOptions } from './sandbox-sql.executor';
import { translatePostgresToSqlite, UnsupportedSqlError } from './pg-to-sqlite';
import { SALES_V1_ROWS, SALES_V1_TABLES } from '../../data/sandbox/sales-v1.fixture';

/** Kiểu cột SQLite cho từng cột của sales_v1 (ngày lưu chuỗi ISO nên so sánh/strftime hoạt động đúng). */
const COLUMN_TYPES: Record<string, string> = {
  cost_price: 'REAL',
  selling_price: 'REAL',
  total_amount: 'REAL',
  unit_price: 'REAL',
  discount: 'REAL',
  line_total: 'REAL',
  stock_quantity: 'INTEGER',
  quantity: 'INTEGER',
};

/**
 * Mã chạy trong worker thread: nạp sql.js (bản asm thuần JS, không cần file .wasm nên chạy được trên serverless),
 * dựng DB in-memory từ dữ liệu mẫu, rồi chạy từng câu SELECT ở chế độ chỉ đọc. Chạy trong worker để câu truy vấn quá
 * nặng có thể bị terminate đúng hạn (sql.js chạy đồng bộ, không tự ngắt được).
 */
const WORKER_SOURCE = `
const { parentPort, workerData } = require('worker_threads');
const initSqlJs = require(workerData.sqlJsPath);
(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.exec('BEGIN');
  for (const [table, cols] of Object.entries(workerData.tables)) {
    db.exec('CREATE TABLE ' + table + ' (' + cols.map((c) => c + ' ' + (workerData.types[c] || 'TEXT')).join(', ') + ')');
    const stmt = db.prepare('INSERT INTO ' + table + ' VALUES (' + cols.map(() => '?').join(',') + ')');
    for (const row of workerData.rows[table]) { stmt.run(row); }
    stmt.free();
  }
  db.exec('COMMIT');
  db.exec('PRAGMA query_only = ON');
  parentPort.on('message', ({ id, sql, limit }) => {
    // Mỗi câu chạy trong một giao dịch rồi LUÔN rollback (kèm query_only=ON): không tác vụ ghi nào được giữ lại.
    try {
      db.exec('BEGIN');
      const stmt = db.prepare('SELECT * FROM (' + sql + ') AS lab_result LIMIT ' + (limit + 1));
      const columns = stmt.getColumnNames();
      const rows = [];
      while (stmt.step()) rows.push(stmt.get());
      stmt.free();
      parentPort.postMessage({ id, ok: true, columns, rows });
    } catch (err) {
      parentPort.postMessage({ id, ok: false, message: String(err && err.message || err) });
    } finally {
      try { db.exec('ROLLBACK'); } catch (e) { /* chưa mở giao dịch */ }
    }
  });
  parentPort.postMessage({ ready: true });
})().catch((err) => parentPort.postMessage({ fatal: String(err && err.message || err) }));
`;

interface Pending {
  resolve: (v: { columns: string[]; rows: unknown[][] }) => void;
  reject: (e: Error) => void;
  timer: NodeJS.Timeout;
}

/**
 * Chạy câu SELECT trên SQLite in-memory (sql.js) trong tiến trình Node, KHÔNG cần Docker/Postgres:
 * bộ bảng sales_v1 được nạp một lần vào bộ nhớ tạm. Câu SQL kiểu PostgreSQL được dịch sang SQLite
 * (xem pg-to-sqlite.ts) rồi chạy chỉ đọc, kết quả bị cắt ở MAX_RESULT_ROWS, quá `timeoutMs` thì worker bị dừng và dựng lại.
 */
@Injectable()
export class SqliteSandboxExecutor implements SandboxSqlExecutor, OnModuleDestroy {
  readonly usesDatasetUrl = false;
  private readonly logger = new Logger(SqliteSandboxExecutor.name);
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private seq = 0;
  private readonly pending = new Map<number, Pending>();

  private start(): Promise<void> {
    if (this.ready && this.worker) return this.ready;
    const worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: {
        sqlJsPath: require.resolve('sql.js/dist/sql-asm.js'),
        tables: SALES_V1_TABLES,
        rows: SALES_V1_ROWS,
        types: COLUMN_TYPES,
      },
    });
    this.worker = worker;
    this.ready = new Promise<void>((resolve, reject) => {
      worker.on('message', (msg: any) => {
        if (msg.ready) return resolve();
        if (msg.fatal) return reject(new SandboxUnavailableError(`SQLite in-memory không khởi động được: ${msg.fatal}`));
        const p = this.pending.get(msg.id);
        if (!p) return;
        clearTimeout(p.timer);
        this.pending.delete(msg.id);
        if (msg.ok) p.resolve({ columns: msg.columns, rows: msg.rows });
        else p.reject(new SandboxQueryError(String(msg.message).replace(/^Error:\s*/, '')));
      });
      worker.on('error', (err) => {
        this.drop(new SandboxUnavailableError(err.message));
        reject(new SandboxUnavailableError(err.message));
      });
      worker.on('exit', () => {
        if (this.worker === worker) this.drop(new SandboxUnavailableError('Worker SQLite đã dừng.'));
      });
    });
    return this.ready;
  }

  /** Bỏ worker hiện tại và từ chối mọi yêu cầu đang chờ. */
  private drop(reason: Error) {
    const w = this.worker;
    this.worker = null;
    this.ready = null;
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(reason);
      this.pending.delete(id);
    }
    if (w) void w.terminate().catch(() => undefined);
  }

  async run(_dbUrl: string, sql: string, { timeoutMs }: SqlRunOptions): Promise<ResultSet> {
    let translated: string;
    try {
      translated = translatePostgresToSqlite(sql);
    } catch (err) {
      if (err instanceof UnsupportedSqlError) throw new SandboxQueryError(err.message);
      throw err;
    }
    await this.start();
    const worker = this.worker;
    if (!worker) throw new SandboxUnavailableError('Worker SQLite không sẵn sàng.');

    const id = ++this.seq;
    const result = await new Promise<{ columns: string[]; rows: unknown[][] }>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.logger.warn(`Câu SQL vượt ${timeoutMs}ms, dừng worker SQLite.`);
        this.drop(new SandboxUnavailableError('worker bị dừng do timeout'));
        reject(new SandboxQueryError(`Câu truy vấn chạy quá ${Math.round(timeoutMs / 1000)} giây nên bị dừng. Hãy kiểm tra lại JOIN/điều kiện.`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, sql: translated, limit: MAX_RESULT_ROWS });
    });

    const truncated = result.rows.length > MAX_RESULT_ROWS;
    return {
      columns: result.columns,
      rows: truncated ? result.rows.slice(0, MAX_RESULT_ROWS) : result.rows,
      truncated,
    };
  }

  async onModuleDestroy() {
    this.drop(new SandboxUnavailableError('Ứng dụng đang tắt.'));
  }
}
