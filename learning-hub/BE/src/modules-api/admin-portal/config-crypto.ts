import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Mã hóa API key lưu trong CSDL bằng AES-256-GCM (có xác thực: sửa một bit của bản mã là giải mã thất bại).
 * Khóa 32 byte lấy từ CONFIG_ENCRYPTION_KEY: chuỗi hex 64 ký tự dùng trực tiếp, chuỗi khác được băm SHA-256 ra 32 byte.
 * Định dạng lưu: base64url(iv).base64url(authTag).base64url(ciphertext).
 */
const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

export class ConfigEncryptionUnavailableError extends Error {}

export function deriveKey(secret: string | undefined): Buffer {
  const s = (secret ?? '').trim();
  if (s.length < 16) {
    throw new ConfigEncryptionUnavailableError(
      'Chưa cấu hình CONFIG_ENCRYPTION_KEY (tối thiểu 16 ký tự) trong .env nên không thể lưu khóa bí mật.',
    );
  }
  return /^[0-9a-fA-F]{64}$/.test(s) ? Buffer.from(s, 'hex') : createHash('sha256').update(s).digest();
}

export function encryptSecret(plain: string, secret: string | undefined): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64url')).join('.');
}

export function decryptSecret(payload: string, secret: string | undefined): string {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64url'));
  if (!iv || !tag || !enc) throw new Error('Dữ liệu mã hóa không hợp lệ.');
  const decipher = createDecipheriv(ALGO, deriveKey(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

/** Che khóa khi hiển thị: giữ vài ký tự đầu, phần còn lại thành ****. Khóa quá ngắn che hoàn toàn. */
export function maskSecret(value: string | null | undefined): string {
  if (!value) return '';
  if (value.length <= 10) return '••••••••';
  return `${value.slice(0, 6)}...****`;
}
