/**
 * Kiểm tra dữ liệu người dùng tự cập nhật hồ sơ (PUT /auth/profile). Email KHÔNG đổi được: nếu client gửi
 * kèm email khác email hiện tại thì từ chối thay vì lặng lẽ bỏ qua, để không ai tưởng đã đổi được.
 */
export const MAX_NAME = 100;
export const MAX_BIO = 300;
const PHONE = /^\+?[0-9][0-9 .\-()]{6,18}[0-9]$/;

export interface ProfileUpdate {
  fullName?: string;
  phone?: string;
  bio?: string;
}

export type ProfileCheck =
  { ok: true; value: ProfileUpdate } | { ok: false; message: string };

/** Bỏ ký tự điều khiển (kể cả xuống dòng với trường một dòng) và khoảng trắng thừa. */
const clean = (s: string, multiline = false) =>
  // eslint-disable-next-line no-control-regex
  s
    .replace(
      multiline
        ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
        : /[\u0000-\u001f\u007f]/g,
      ' ',
    )
    .trim();

export function checkProfileInput(
  raw: unknown,
  currentEmail: string,
): ProfileCheck {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, message: 'Dữ liệu không hợp lệ.' };
  }
  const body = raw as Record<string, unknown>;

  if (body.email !== undefined) {
    const sent =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
    if (sent !== currentEmail.trim().toLowerCase()) {
      return { ok: false, message: 'Không thể thay đổi email của tài khoản.' };
    }
  }

  const value: ProfileUpdate = {};

  if (body.fullName !== undefined) {
    if (typeof body.fullName !== 'string')
      return { ok: false, message: 'Họ và tên không hợp lệ.' };
    const name = clean(body.fullName).replace(/\s+/g, ' ');
    if (!name || name.length > MAX_NAME) {
      return {
        ok: false,
        message: `Họ và tên bắt buộc, tối đa ${MAX_NAME} ký tự.`,
      };
    }
    value.fullName = name;
  }

  if (body.phone !== undefined && body.phone !== null) {
    if (typeof body.phone !== 'string')
      return { ok: false, message: 'Số điện thoại không hợp lệ.' };
    const phone = clean(body.phone);
    if (phone && !PHONE.test(phone)) {
      return {
        ok: false,
        message:
          'Số điện thoại không hợp lệ (chỉ số, dấu +, khoảng trắng, ngoặc, gạch nối).',
      };
    }
    value.phone = phone; // rỗng nghĩa là xóa
  } else if (body.phone === null) {
    value.phone = '';
  }

  if (body.bio !== undefined && body.bio !== null) {
    if (typeof body.bio !== 'string')
      return { ok: false, message: 'Giới thiệu không hợp lệ.' };
    const bio = clean(body.bio, true);
    if (bio.length > MAX_BIO)
      return { ok: false, message: `Giới thiệu tối đa ${MAX_BIO} ký tự.` };
    value.bio = bio;
  } else if (body.bio === null) {
    value.bio = '';
  }

  if (Object.keys(value).length === 0) {
    return { ok: false, message: 'Không có thông tin nào để cập nhật.' };
  }
  return { ok: true, value };
}
