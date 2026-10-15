/**
 * Quy tắc email/mật khẩu cho ĐĂNG KÝ và ĐẶT LẠI MẬT KHẨU (FE dùng cùng quy tắc: FE/src/common/authValidation.ts).
 * Đăng nhập KHÔNG áp chính sách mật khẩu: tài khoản cũ có thể đặt mật khẩu theo quy tắc cũ và vẫn phải đăng nhập được.
 */
export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 32;
const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;

/** Trả về thông báo lỗi tiếng Việt, hoặc undefined nếu email hợp lệ (đã trim). */
export function emailError(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return 'Email không hợp lệ.';
  const email = raw.trim();
  if (!email) return 'Vui lòng nhập email.';
  if (!EMAIL_RE.test(email)) return 'Email không đúng định dạng (ví dụ: ban@example.com).';
  return undefined;
}

/** Danh sách điều kiện chưa đạt của mật khẩu (rỗng = hợp lệ). */
export function passwordProblems(raw: unknown): string[] {
  if (typeof raw !== 'string') return ['Mật khẩu không hợp lệ.'];
  const p: string[] = [];
  if (raw.length < PASSWORD_MIN || raw.length > PASSWORD_MAX) {
    p.push(`dài từ ${PASSWORD_MIN} đến ${PASSWORD_MAX} ký tự`);
  }
  if (!/[A-Z]/.test(raw)) p.push('ít nhất 1 chữ hoa');
  if (!/[a-z]/.test(raw)) p.push('ít nhất 1 chữ thường');
  if (!/\d/.test(raw)) p.push('ít nhất 1 chữ số');
  if (!SPECIAL_RE.test(raw)) p.push('ít nhất 1 ký tự đặc biệt (!@#$%^&*(),.?":{}|<>)');
  return p;
}

/** Thông báo lỗi mật khẩu dạng một câu, hoặc undefined nếu hợp lệ. */
export function passwordError(raw: unknown): string | undefined {
  const p = passwordProblems(raw);
  return p.length ? `Mật khẩu cần: ${p.join('; ')}.` : undefined;
}
