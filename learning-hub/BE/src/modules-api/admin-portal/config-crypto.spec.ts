import { ConfigEncryptionUnavailableError, decryptSecret, deriveKey, encryptSecret, maskSecret } from './config-crypto';

const SECRET = 'a'.repeat(64);
const API_KEY = 'AIzaSyD-example-key-1234567890abcdef';

describe('config-crypto (AES-256-GCM)', () => {
  it('mã hóa rồi giải mã trả đúng bản rõ; bản mã không chứa bản rõ', () => {
    const enc = encryptSecret(API_KEY, SECRET);
    expect(enc).not.toContain(API_KEY);
    expect(enc.split('.')).toHaveLength(3);
    expect(decryptSecret(enc, SECRET)).toBe(API_KEY);
  });

  it('mỗi lần mã hóa dùng IV khác nhau', () => {
    expect(encryptSecret(API_KEY, SECRET)).not.toBe(encryptSecret(API_KEY, SECRET));
  });

  it('sai khóa hoặc bản mã bị sửa thì giải mã thất bại (GCM có xác thực)', () => {
    const enc = encryptSecret(API_KEY, SECRET);
    expect(() => decryptSecret(enc, 'b'.repeat(64))).toThrow();
    const [iv, tag, data] = enc.split('.');
    const flipped = Buffer.from(data, 'base64url');
    flipped[0] ^= 1;
    expect(() => decryptSecret([iv, tag, flipped.toString('base64url')].join('.'), SECRET)).toThrow();
    expect(() => decryptSecret('rac', SECRET)).toThrow();
  });

  it('khóa hex 64 ký tự dùng trực tiếp; chuỗi khác được băm SHA-256 ra 32 byte', () => {
    expect(deriveKey(SECRET)).toHaveLength(32);
    expect(deriveKey('mot-chuoi-bi-mat-dai-du-16').length).toBe(32);
    expect(decryptSecret(encryptSecret('x', 'mot-chuoi-bi-mat-dai-du-16'), 'mot-chuoi-bi-mat-dai-du-16')).toBe('x');
  });

  it('thiếu hoặc quá ngắn CONFIG_ENCRYPTION_KEY thì báo lỗi rõ ràng', () => {
    expect(() => encryptSecret(API_KEY, undefined)).toThrow(ConfigEncryptionUnavailableError);
    expect(() => encryptSecret(API_KEY, 'ngan')).toThrow(ConfigEncryptionUnavailableError);
  });

  it('maskSecret chỉ giữ vài ký tự đầu, không lộ phần còn lại', () => {
    expect(maskSecret(API_KEY)).toBe('AIzaSy...****');
    expect(maskSecret(API_KEY)).not.toContain('abcdef');
    expect(maskSecret('short')).toBe('••••••••');
    expect(maskSecret(undefined)).toBe('');
  });
});
