import * as fs from 'fs';
import * as path from 'path';
import { SANDBOX_DEFAULTS, buildSandboxDbUrl } from './sandbox-env';

const ROOT = path.resolve(__dirname, '../../../..');

describe('sandbox-env: một nguồn cấu hình cho Postgres Sandbox', () => {
  it('mặc định local khi chưa đặt biến', () => {
    expect(buildSandboxDbUrl({})).toBe(
      'postgresql://lab_reader:lab_reader_pw@localhost:55432/sales_v1',
    );
  });

  it('nội suy LAB_READER_PASSWORD và SANDBOX_DB_PORT từ biến môi trường', () => {
    expect(
      buildSandboxDbUrl({
        LAB_READER_PASSWORD: 'MatKhauMoi',
        SANDBOX_DB_PORT: '6543',
      }),
    ).toBe('postgresql://lab_reader:MatKhauMoi@localhost:6543/sales_v1');
  });

  it('mã hóa ký tự đặc biệt trong mật khẩu để không làm hỏng URL', () => {
    const url = buildSandboxDbUrl({ LAB_READER_PASSWORD: 'p@ss:/#?' });
    expect(url).toBe(
      'postgresql://lab_reader:p%40ss%3A%2F%23%3F@localhost:55432/sales_v1',
    );
    expect(decodeURIComponent(new URL(url).password)).toBe('p@ss:/#?');
  });

  it('MOCK_SANDBOX_DB_URL vẫn ghi đè toàn bộ khi cần', () => {
    expect(
      buildSandboxDbUrl({
        MOCK_SANDBOX_DB_URL: 'postgresql://x:y@h:1/d',
        LAB_READER_PASSWORD: 'z',
      }),
    ).toBe('postgresql://x:y@h:1/d');
  });

  describe('không lệch giữa các nơi khai báo', () => {
    const compose = fs.readFileSync(
      path.join(ROOT, 'docker-compose.yml'),
      'utf8',
    );
    const envExample = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');

    it('mặc định trong docker-compose.yml khớp SANDBOX_DEFAULTS', () => {
      expect(compose).toContain(
        `\${LAB_READER_PASSWORD:-${SANDBOX_DEFAULTS.labReaderPassword}}`,
      );
      expect(compose).toContain(
        `\${SANDBOX_DB_PORT:-${SANDBOX_DEFAULTS.port}}`,
      );
      expect(compose).toContain(`POSTGRES_DB: ${SANDBOX_DEFAULTS.database}`);
    });

    it('.env.example khai báo đúng biến và đúng giá trị mặc định', () => {
      expect(envExample).toMatch(
        new RegExp(
          `^LAB_READER_PASSWORD=${SANDBOX_DEFAULTS.labReaderPassword}$`,
          'm',
        ),
      );
      expect(envExample).toMatch(
        new RegExp(`^SANDBOX_DB_PORT=${SANDBOX_DEFAULTS.port}$`, 'm'),
      );
    });

    it('mock data-service không còn viết cứng mật khẩu', () => {
      const server = fs.readFileSync(
        path.join(ROOT, 'BE/mock-data-service/server.ts'),
        'utf8',
      );
      expect(server).not.toContain(SANDBOX_DEFAULTS.labReaderPassword);
      expect(server).toContain('buildSandboxDbUrl()');
    });
  });
});
