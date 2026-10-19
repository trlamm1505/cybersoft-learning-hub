/**
 * Mật khẩu khởi tạo của các tài khoản mẫu (admin/teacher/student@gmail.com). Day 29 (SEC-15, H6): KHÔNG hard-code trong
 * mã nguồn; đọc từ biến môi trường DEFAULT_SEED_PASSWORD (BE/.env). Thiếu hoặc quá ngắn thì không tạo tài khoản mẫu.
 */
export const MIN_SEED_PASSWORD = 6;

export function seedPassword(value: string | undefined = process.env.DEFAULT_SEED_PASSWORD): string | undefined {
  const p = (value ?? '').trim();
  return p.length >= MIN_SEED_PASSWORD ? p : undefined;
}
