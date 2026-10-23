/**
 * Chuyển title tiếng Việt (có dấu) thành slug ASCII an toàn cho URL/DB key.
 * Dùng chung cho cả StubProblemGeneratorClient và GeminiProblemGeneratorClient
 * (trước đây mỗi client tự định nghĩa một bản giống hệt nhau) — tách ra đây
 * để chỉ có một chỗ duy nhất cần sửa nếu quy tắc slug thay đổi.
 */
export function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
