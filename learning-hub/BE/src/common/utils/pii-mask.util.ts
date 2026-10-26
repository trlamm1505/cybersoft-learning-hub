/**
 * Che thông tin cá nhân trong văn bản tự do của học viên trước khi gửi sang AI bên ngoài (Gemini) hoặc lưu lịch sử:
 * email, số điện thoại Việt Nam (0xx / +84 / 84, có thể cách bằng dấu chấm/gạch/khoảng trắng) và số CCCD/CMND.
 * Code Python học viên dán vào (biến, số nhỏ, phép tính) không bị đụng tới vì chỉ khớp đúng các mẫu trên.
 */
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Đầu số di động/cố định VN: 0 hoặc +84/84, rồi 9 chữ số (cho phép phân cách . - khoảng trắng giữa các nhóm).
const PHONE_VN = /(?<![\d])(?:\+?84|0)(?:[\s.-]?\d){9}(?![\d])/g;
// CCCD 12 số / CMND 9 số đứng riêng.
const NATIONAL_ID = /(?<![\d])(?:\d{12}|\d{9})(?![\d])/g;

export const PII_EMAIL_TOKEN = '[email đã ẩn]';
export const PII_PHONE_TOKEN = '[số điện thoại đã ẩn]';
export const PII_ID_TOKEN = '[mã định danh đã ẩn]';

export function maskPii(input: string): string {
  if (!input) return input;
  return input.replace(EMAIL, PII_EMAIL_TOKEN).replace(PHONE_VN, PII_PHONE_TOKEN).replace(NATIONAL_ID, PII_ID_TOKEN);
}
