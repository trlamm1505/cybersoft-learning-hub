import * as path from 'path';

/**
 * Cấu hình Postgres Sandbox dùng chung, MỘT nguồn: biến môi trường (đặt trong
 * learning-hub/.env, xem .env.example). Docker Compose (tạo role lab_reader) và
 * mock data-service (cấp sandbox_db_url cho backend) đều đọc cùng
 * LAB_READER_PASSWORD / SANDBOX_DB_PORT, nên đổi một chỗ không làm lệch kết nối.
 *
 * Giá trị mặc định CHỈ dùng cho máy local/test; production bắt buộc đặt biến
 * (docker-compose.prod.yml dừng nếu thiếu).
 */
export const SANDBOX_DEFAULTS = {
  labReaderPassword: 'lab_reader_pw',
  port: 55432,
  host: 'localhost',
  database: 'sales_v1',
} as const;

type Env = Record<string, string | undefined>;

/** Chuỗi kết nối tài khoản chỉ đọc lab_reader, nội suy mật khẩu từ biến môi trường. */
export function buildSandboxDbUrl(env: Env = process.env): string {
  // Ghi đè toàn bộ URL (vd sandbox nằm ở máy khác) vẫn được ưu tiên.
  if (env.MOCK_SANDBOX_DB_URL) return env.MOCK_SANDBOX_DB_URL;
  const password =
    env.LAB_READER_PASSWORD || SANDBOX_DEFAULTS.labReaderPassword;
  const port = env.SANDBOX_DB_PORT || String(SANDBOX_DEFAULTS.port);
  const host = env.SANDBOX_DB_HOST || SANDBOX_DEFAULTS.host;
  return `postgresql://lab_reader:${encodeURIComponent(password)}@${host}:${port}/${SANDBOX_DEFAULTS.database}`;
}

/**
 * Nạp learning-hub/.env (nguồn chung) rồi BE/.env cho tiến trình không dùng
 * ConfigModule (mock data-service). Biến đã có trong môi trường không bị ghi đè.
 */
export function loadSharedEnvFiles(beRoot: string): void {
  for (const file of [
    path.resolve(beRoot, '..', '.env'),
    path.resolve(beRoot, '.env'),
  ]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // Không có file: dùng biến môi trường sẵn có / giá trị mặc định.
    }
  }
}
