// eslint-disable-next-line no-control-regex
const CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Làm sạch nhận xét/feedback do người dùng gõ trước khi lưu: bỏ thẻ HTML (kể cả nội dung script/style), bỏ scheme
 * `javascript:` và ký tự điều khiển. Giao diện React vẫn escape khi hiển thị; đây là lớp bảo vệ thứ hai cho mọi nơi khác đọc dữ liệu.
 */
export function sanitizeFeedback(input: unknown, maxLength: number): string {
  if (typeof input !== 'string') return '';
  let s = input.replace(CONTROL, '');
  s = s.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  s = s.replace(/<[^>]*>?/g, '');
  s = s.replace(/javascript\s*:/gi, '');
  return s.trim().slice(0, maxLength);
}
