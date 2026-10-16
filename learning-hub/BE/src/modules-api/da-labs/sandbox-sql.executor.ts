import { Injectable } from '@nestjs/common';
import { Client, types } from 'pg';

// DATE/TIMESTAMP giữ nguyên chuỗi Postgres trả về. Mặc định pg đổi sang Date
// theo múi giờ máy chủ, làm `2025-04-09` hiển thị thành `2025-04-08T17:00Z`.
const RAW_TEXT_OIDS = new Set([1082, 1114, 1184]);
const typeParsers = {
  getTypeParser: ((oid: number, format?: 'text' | 'binary') =>
    RAW_TEXT_OIDS.has(oid)
      ? (value: string) => value
      : types.getTypeParser(oid, format)) as typeof types.getTypeParser,
};

export interface ResultSet {
  columns: string[];
  rows: unknown[][];
  /** true khi kết quả bị cắt ở MAX_RESULT_ROWS. */
  truncated: boolean;
}

export interface SqlRunOptions {
  timeoutMs: number;
}

/** Lỗi do câu SQL (cú pháp, sai tên cột, quá thời gian...), không phải lỗi hạ tầng. */
export class SandboxQueryError extends Error {}

/** Không kết nối được sandbox DB của TTS 01. */
export class SandboxUnavailableError extends Error {}

export interface SandboxSqlExecutor {
  run(dbUrl: string, sql: string, options: SqlRunOptions): Promise<ResultSet>;
}

export const SANDBOX_SQL_EXECUTOR = Symbol('SANDBOX_SQL_EXECUTOR');

export const MAX_RESULT_ROWS = 1_000;
const CONNECT_TIMEOUT_MS = 5_000;

/**
 * Chạy một câu SELECT trên sandbox Postgres do TTS 01 cấp phát.
 *
 * Mỗi lần chạy mở một kết nối riêng và đóng ngay sau đó, trong một giao dịch
 * `READ ONLY` với `statement_timeout` cục bộ, rồi luôn ROLLBACK. Câu của học
 * viên được bọc làm subquery có LIMIT để một phép JOIN chéo không kéo hàng
 * triệu dòng vào RAM của backend.
 */
@Injectable()
export class PgSandboxExecutor implements SandboxSqlExecutor {
  async run(
    dbUrl: string,
    sql: string,
    { timeoutMs }: SqlRunOptions,
  ): Promise<ResultSet> {
    const client = new Client({
      connectionString: dbUrl,
      connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
      // Chặn ở phía client phòng khi server bỏ qua statement_timeout.
      query_timeout: timeoutMs + 2_000,
      application_name: 'learning-hub-sql-grader',
      types: typeParsers,
    });

    try {
      await client.connect();
    } catch (err) {
      throw new SandboxUnavailableError((err as Error).message);
    }

    try {
      await client.query('BEGIN TRANSACTION READ ONLY');
      await client.query(
        `SET LOCAL statement_timeout = ${Math.floor(timeoutMs)}`,
      );
      await client.query(`SET LOCAL idle_in_transaction_session_timeout = ${Math.floor(timeoutMs) * 2}`);

      const wrapped = `SELECT * FROM (\n${sql}\n) AS lab_result LIMIT ${MAX_RESULT_ROWS + 1}`;
      const res = await client.query({ text: wrapped, rowMode: 'array' });
      const rows = res.rows as unknown[][];
      return {
        columns: res.fields.map((f) => f.name),
        rows: rows.slice(0, MAX_RESULT_ROWS),
        truncated: rows.length > MAX_RESULT_ROWS,
      };
    } catch (err) {
      throw new SandboxQueryError((err as Error).message);
    } finally {
      await client.query('ROLLBACK').catch(() => undefined);
      await client.end().catch(() => undefined);
    }
  }
}
