/** Xử lý ảnh đại diện phía trình duyệt: kiểm tra đầu vào và thu nhỏ ảnh trước khi gửi lên. */

/** Khớp giới hạn của backend (BE/src/modules-api/auth/avatar.ts). */
export const AVATAR_MAX_DATA_URL_LENGTH = 90_000;
export const AVATAR_MAX_URL_LENGTH = 500;
export const AVATAR_MAX_SOURCE_BYTES = 8 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/** Trả về thông báo lỗi, hoặc null nếu tệp hợp lệ. */
export function validateAvatarFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return 'Chỉ nhận ảnh PNG, JPEG hoặc WebP.';
  if (file.size > AVATAR_MAX_SOURCE_BYTES) return 'Ảnh quá lớn (tối đa 8 MB).';
  return null;
}

/** Trả về thông báo lỗi, hoặc null nếu URL hợp lệ. */
export function validateAvatarUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Hãy nhập đường dẫn ảnh.';
  if (v.length > AVATAR_MAX_URL_LENGTH) return 'Đường dẫn ảnh quá dài.';
  try {
    const url = new URL(v);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol');
    return null;
  } catch {
    return 'Đường dẫn ảnh không hợp lệ (cần bắt đầu bằng http:// hoặc https://).';
  }
}

export const fitsAvatarLimit = (dataUrl: string): boolean => dataUrl.length <= AVATAR_MAX_DATA_URL_LENGTH;

/** Chữ cái đầu của tên (hoặc email) cho avatar mặc định. */
export const avatarInitial = (user: { fullName?: string; email: string }): string =>
  (user.fullName || user.email).trim().charAt(0).toUpperCase();

const SIZES = [256, 192, 128];
const QUALITIES = [0.85, 0.72, 0.6, 0.5];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh này.'));
    };
    img.src = url;
  });
}

/**
 * Cắt vuông ở giữa rồi thu nhỏ thành JPEG; giảm dần kích thước và chất lượng cho tới khi
 * vừa giới hạn dung lượng. Ảnh được vẽ lại bằng canvas nên dữ liệu ẩn (EXIF, vị trí) bị loại bỏ.
 */
export async function resizeToAvatarDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new Error('Ảnh không hợp lệ.');
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;

  for (const size of SIZES) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    ctx.fillStyle = '#ffffff'; // nền cho ảnh PNG trong suốt
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    for (const q of QUALITIES) {
      const dataUrl = canvas.toDataURL('image/jpeg', q);
      if (fitsAvatarLimit(dataUrl)) return dataUrl;
    }
  }
  throw new Error('Không thu nhỏ được ảnh đủ nhỏ, hãy chọn ảnh khác.');
}
