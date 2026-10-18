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

  // Day 30 bỏ Docker và learning-hub/.env(.example): BE/.env.example là nơi khai báo DUY NHẤT; để trống = SANDBOX_DEFAULTS.
  describe('không lệch giữa các nơi khai báo', () => {
    const envExample = fs.readFileSync(
      path.join(ROOT, 'BE/.env.example'),
      'utf8',
    );

    it('chỉ còn một nguồn cấu hình: không còn docker-compose.yml và .env.example ở learning-hub/', () => {
      expect(fs.existsSync(path.join(ROOT, 'docker-compose.yml'))).toBe(false);
      expect(fs.existsSync(path.join(ROOT, '.env.example'))).toBe(false);
    });

    it('BE/.env.example khai báo biến sandbox; để trống thì dùng đúng SANDBOX_DEFAULTS', () => {
      for (const key of ['SANDBOX_DB_HOST', 'SANDBOX_DB_PORT', 'LAB_READER_PASSWORD']) {
        expect(envExample).toMatch(new RegExp(`^${key}=$`, 'm'));
      }
      expect(
        buildSandboxDbUrl({ SANDBOX_DB_HOST: '', SANDBOX_DB_PORT: '', LAB_READER_PASSWORD: '' }),
      ).toBe(buildSandboxDbUrl({}));
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
