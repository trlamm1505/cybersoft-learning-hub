import { Client } from 'pg';
import {
  MAX_RESULT_ROWS,
  PgSandboxExecutor,
  SandboxQueryError,
  SandboxUnavailableError,
} from './sandbox-sql.executor';

jest.mock('pg', () => ({ Client: jest.fn() }));

describe('PgSandboxExecutor', () => {
  let queries: string[];
  let client: {
    connect: jest.Mock;
    query: jest.Mock;
    end: jest.Mock;
  };

  beforeEach(() => {
    queries = [];
    client = {
      connect: jest.fn().mockResolvedValue(undefined),
      end: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(async (q: string | { text: string }) => {
        const text = typeof q === 'string' ? q : q.text;
        queries.push(text);
        if (text.includes('lab_result')) {
          return { fields: [{ name: 'n' }], rows: [[1], [2]] };
        }
        return {};
      }),
    };
    (Client as unknown as jest.Mock).mockImplementation(() => client);
  });

  it('chạy trong giao dịch READ ONLY có statement_timeout rồi luôn ROLLBACK', async () => {
    const res = await new PgSandboxExecutor().run('postgresql://x', 'SELECT 1 AS n', {
      timeoutMs: 3000,
    });

    expect(queries[0]).toBe('BEGIN TRANSACTION READ ONLY');
    expect(queries[1]).toBe('SET LOCAL statement_timeout = 3000');
    expect(queries[queries.length - 1]).toBe('ROLLBACK');
    expect(client.end).toHaveBeenCalled();
    expect(res).toEqual({ columns: ['n'], rows: [[1], [2]], truncated: false });
  });

  it('bọc câu của học viên làm subquery có LIMIT để không kéo quá nhiều dòng', async () => {
    await new PgSandboxExecutor().run('postgresql://x', 'SELECT 1 AS n', {
      timeoutMs: 3000,
    });

    const wrapped = queries.find((q) => q.includes('lab_result'));
    expect(wrapped).toContain(`LIMIT ${MAX_RESULT_ROWS + 1}`);
  });

  it('lỗi từ câu SQL thành SandboxQueryError và vẫn ROLLBACK, đóng kết nối', async () => {
    client.query.mockImplementation(async (q: string | { text: string }) => {
      const text = typeof q === 'string' ? q : q.text;
      queries.push(text);
      if (text.includes('lab_result')) {
        throw new Error('canceling statement due to statement timeout');
      }
      return {};
    });

    await expect(
      new PgSandboxExecutor().run('postgresql://x', 'SELECT 1', { timeoutMs: 3000 }),
    ).rejects.toBeInstanceOf(SandboxQueryError);
    expect(queries[queries.length - 1]).toBe('ROLLBACK');
    expect(client.end).toHaveBeenCalled();
  });

  it('không kết nối được thì báo SandboxUnavailableError', async () => {
    client.connect.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      new PgSandboxExecutor().run('postgresql://x', 'SELECT 1', { timeoutMs: 3000 }),
    ).rejects.toBeInstanceOf(SandboxUnavailableError);
  });
});
