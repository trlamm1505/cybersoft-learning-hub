/**
 * Kiểm tra ảnh đại diện. Chấp nhận:
 * - URL ảnh http(s) tối đa 500 ký tự;
 * - data URL png/jpeg/webp (ảnh đã thu nhỏ ở trình duyệt), tối đa MAX_AVATAR_DATA_URL_LENGTH ký tự.
 * Cố ý KHÔNG nhận svg (có thể chứa script) và giới hạn dung lượng nằm dưới mức mặc định
 * 100kb của body JSON nên không cần nới giới hạn toàn hệ thống.
 */
export const MAX_AVATAR_URL_LENGTH = 500;
export const MAX_AVATAR_DATA_URL_LENGTH = 90_000;

const DATA_URL_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export type AvatarCheck =
  | { ok: true; value: string | null }
  | { ok: false; message: string };

export function checkAvatar(input: unknown): AvatarCheck {
  if (input === null || input === undefined) return { ok: true, value: null };
  if (typeof input !== 'string') {
    return { ok: false, message: 'Ảnh đại diện phải là chuỗi URL hoặc dữ liệu ảnh.' };
  }
  const value = input.trim();
  if (value === '') return { ok: true, value: null };

  if (value.startsWith('data:')) {
    if (value.length > MAX_AVATAR_DATA_URL_LENGTH) {
      return { ok: false, message: 'Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn.' };
    }
    return DATA_URL_RE.test(value)
      ? { ok: true, value }
      : { ok: false, message: 'Chỉ nhận ảnh PNG, JPEG hoặc WebP.' };
  }

  if (value.length > MAX_AVATAR_URL_LENGTH) {
    return { ok: false, message: 'Đường dẫn ảnh quá dài.' };
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol');
    return { ok: true, value };
  } catch {
    return { ok: false, message: 'Đường dẫn ảnh không hợp lệ (cần bắt đầu bằng http:// hoặc https://).' };
  }
}
