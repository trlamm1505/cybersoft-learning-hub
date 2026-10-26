/**
 * Quy tắc email/mật khẩu của form Đăng ký (và Đặt lại mật khẩu). Giữ đồng bộ với
 * BE/src/modules-api/auth/auth-validation.ts: BE vẫn kiểm tra lại, FE chỉ báo lỗi sớm.
 * Form Đăng nhập chỉ kiểm tra định dạng email (không áp chính sách mật khẩu) để tài khoản cũ còn đăng nhập được.
 */
export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 32;
const SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>]/;

export const normalizeEmail = (raw: string): string => raw.trim();

/** Thông báo lỗi email, hoặc undefined nếu hợp lệ (đã trim). */
export function emailError(raw: string): string | undefined {
  const email = normalizeEmail(raw);
  if (!email) return 'Vui lòng nhập email.';
  if (!EMAIL_RE.test(email)) return 'Email không đúng định dạng (ví dụ: ban@example.com).';
  return undefined;
}

export interface PasswordRule {
  id: string;
  label: string;
  test: (p: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: 'length', label: `Dài từ ${PASSWORD_MIN} đến ${PASSWORD_MAX} ký tự`, test: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX },
  { id: 'upper', label: 'Có ít nhất 1 chữ hoa', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Có ít nhất 1 chữ thường', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Có ít nhất 1 chữ số', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Có ít nhất 1 ký tự đặc biệt (!@#$%^&*(),.?":{}|<>)', test: (p) => SPECIAL_RE.test(p) },
];

/** Các điều kiện mật khẩu CHƯA đạt (rỗng = hợp lệ). */
export const unmetPasswordRules = (p: string): PasswordRule[] => PASSWORD_RULES.filter((r) => !r.test(p));

/** Một câu báo lỗi mật khẩu, hoặc undefined nếu hợp lệ. */
export function passwordError(p: string): string | undefined {
  if (!p) return 'Vui lòng nhập mật khẩu.';
  const unmet = unmetPasswordRules(p);
  return unmet.length ? `Mật khẩu chưa đủ mạnh: ${unmet.map((r) => r.label.toLowerCase()).join('; ')}.` : undefined;
}

export const fullNameError = (raw: string): string | undefined => {
  const name = raw.trim();
  if (!name) return 'Vui lòng nhập họ và tên.';
  if (name.length > 100) return 'Họ và tên tối đa 100 ký tự.';
  return undefined;
};
