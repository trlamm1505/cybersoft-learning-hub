// Giới hạn độ dài áp dụng cho input tự do do giáo viên gõ trước khi đưa vào
// prompt Gemini — một learningOutcome/constraint quá dài vừa tốn token vừa
// mở đường cho prompt injection kiểu "nhồi văn bản dài để đè lên system
// prompt". Không cần giới hạn khắt khe như tên định danh, chỉ chặn lạm dụng.
export const MAX_FREEFORM_TEXT_LENGTH = 500;
export const MAX_TAG_LENGTH = 50;
export const MAX_ARRAY_ITEMS = 20;

// Ký tự điều khiển ASSCII (0x00-0x08, 0x0B-0x0C, 0x0E-0x1F, 0x7F) — không
// phải xuống dòng/tab thông thường, mà là các byte có thể dùng để chèn ký
// tự ẩn/escape sequence vào prompt hoặc vào dữ liệu lưu DB. Giữ lại \n \t vì
// constraints hợp lệ có thể xuống dòng.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_EXCEPT_NEWLINE_TAB = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Làm sạch MỘT chuỗi input tự do (learningOutcome, một dòng constraint...)
 * trước khi đưa vào prompt LLM hoặc lưu DB: trim khoảng trắng thừa, loại bỏ
 * ký tự điều khiển ẩn, và cắt bớt nếu vượt quá độ dài an toàn.
 */
export function sanitizeFreeformText(
  input: unknown,
  maxLength: number = MAX_FREEFORM_TEXT_LENGTH,
): string {
  if (typeof input !== 'string') return '';
  const cleaned = input.replace(CONTROL_CHARS_EXCEPT_NEWLINE_TAB, '').trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * Chỉ loại bỏ ký tự điều khiển ẩn, KHÔNG cắt độ dài — dùng cho các field văn
 * bản dài của Lesson/Exercise (description, content, solutionCode...) mà
 * sanitizeFreeformText (giới hạn 500 ký tự) không phù hợp. Trả về input
 * nguyên trạng (không trim, giữ format code/markdown) nếu không phải string.
 */
export function stripControlChars(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(CONTROL_CHARS_EXCEPT_NEWLINE_TAB, '');
}

/**
 * Làm sạch một mảng input tự do (constraints, tags...): loại bỏ phần tử
 * không phải string hoặc rỗng sau khi trim, giới hạn số lượng phần tử và độ
 * dài từng phần tử — chặn payload kiểu gửi mảng khổng lồ hoặc lồng object để
 * phình prompt/DB. KHÔNG throw khi input sai kiểu, chỉ trả mảng rỗng/lọc bớt
 * (giữ đúng phong cách "sanitize im lặng" hiện có của repo, validate lỗi
 * required riêng ở tầng gọi).
 */
export function sanitizeFreeformTextArray(
  input: unknown,
  options: { maxItems?: number; maxItemLength?: number } = {},
): string[] {
  if (!Array.isArray(input)) return [];
  const maxItems = options.maxItems ?? MAX_ARRAY_ITEMS;
  const maxItemLength = options.maxItemLength ?? MAX_TAG_LENGTH;

  return input
    .slice(0, maxItems)
    .map((item) => sanitizeFreeformText(item, maxItemLength))
    .filter((item) => item.length > 0);
}
