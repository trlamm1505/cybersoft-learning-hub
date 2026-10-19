import { PgSandboxExecutor } from './sandbox-sql.executor';
import { SqliteSandboxExecutor } from './sqlite-sandbox.executor';
import { compareResultSets, hasTopLevelOrderBy } from './result-set.comparator';
import { INITIAL_DA_LABS } from '../../data/initial-da-labs';
import { buildSandboxDbUrl } from '../../common/config/sandbox-env';

/**
 * Đối soát SQLite in-memory với Postgres Sandbox thật cho cả 10 đáp án mẫu (kết quả phải giống nhau).
 * Chỉ chạy khi có Postgres Sandbox: `SANDBOX_PARITY=1 npx jest sqlite-parity`. Bình thường được bỏ qua.
 */
const maybe = process.env.SANDBOX_PARITY === '1' ? describe : describe.skip;

maybe('SQLite in-memory khớp Postgres Sandbox', () => {
  jest.setTimeout(60_000);
  const sqlite = new SqliteSandboxExecutor();
  const pg = new PgSandboxExecutor();
  afterAll(() => sqlite.onModuleDestroy());

  for (const lab of INITIAL_DA_LABS.filter((l) => l.type === 'SQL_LAB')) {
    it(lab.title, async () => {
      const [a, b] = await Promise.all([
        pg.run(buildSandboxDbUrl(), lab.solutionCode, { timeoutMs: 5000 }),
        sqlite.run('', lab.solutionCode, { timeoutMs: 5000 }),
      ]);
      // Cùng tập dữ liệu (đa tập). Thứ tự các dòng bằng giá trị khóa sắp xếp là tùy engine nên không so ở đây.
      const cmp = compareResultSets(a, b, false);
      if (!cmp.match) throw new Error(cmp.feedback);
      // Còn thứ tự theo khóa ORDER BY thì phải giống: so cột đầu tiên của dòng đầu/cuối khi đề có ORDER BY.
      if (hasTopLevelOrderBy(lab.solutionCode)) {
        expect(String(b.rows[0][0])).toBe(String(a.rows[0][0]));
      }
    });
  }
});
