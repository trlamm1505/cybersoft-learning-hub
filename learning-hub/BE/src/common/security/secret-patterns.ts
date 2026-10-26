/**
 * NGUỒN DUY NHẤT cho việc phát hiện API key trong bài nộp, dùng chung cho BE
 * (NoSecretsPipe, AiLabGraderService) và FE (kiểm tra sớm trước khi gửi).
 * TypeScript thuần, không import gì, để cả hai tsconfig biên dịch được.
 */

export const API_KEY_LEAK_MESSAGE = 'Không được để lộ API Key trong submission';

interface SecretPattern {
  name: string;
  re: RegExp;
  /**
   * Quét cả bản đã bỏ hết khoảng trắng (bắt key bị ngắt dòng / chèn dấu cách).
   * Chỉ bật với mẫu có tiền tố đặc trưng, để không ghép nhầm các từ thường.
   */
  compact: boolean;
}

export const SECRET_PATTERNS: readonly SecretPattern[] = [
  {
    name: 'OpenAI / Anthropic',
    re: /\bsk-(?:proj-|ant-|svcacct-|admin-)?[A-Za-z0-9_-]{8,}/,
    compact: true,
  },
  {
    name: 'Stripe',
    re: /\b[sr]k_(?:live|test)_[A-Za-z0-9]{10,}/,
    compact: true,
  },
  { name: 'Groq', re: /\bgsk_[A-Za-z0-9]{20,}/, compact: true },
  { name: 'xAI', re: /\bxai-[A-Za-z0-9]{20,}/, compact: true },
  { name: 'Slack', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, compact: true },
  { name: 'Google', re: /\bAIza[0-9A-Za-z_-]{20,}/, compact: true },
  {
    name: 'GitHub',
    re: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/,
    compact: true,
  },
  { name: 'Hugging Face', re: /\bhf_[A-Za-z0-9]{20,}/, compact: true },
  { name: 'AWS', re: /\bAKIA[0-9A-Z]{16}\b/, compact: true },
  {
    name: 'JWT',
    re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    compact: true,
  },
  // Azure OpenAI / Cognitive Services: 32 ký tự hex, không có tiền tố.
  { name: 'Azure', re: /\b[0-9a-f]{32}\b/i, compact: false },
  {
    name: 'gán khóa tường minh',
    re: /\b(api[_-]?key|secret|access[_-]?token)\b["']?\s*[:=]\s*["']?[A-Za-z0-9_\-./+]{16,}/i,
    compact: false,
  },
];

// Zero-width space/joiner, word joiner, BOM, soft hyphen: chèn vào giữa key để né regex.
const INVISIBLE_CHARS = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;

/** Bỏ ký tự vô hình, chuẩn hóa NFKC (chữ full-width về ASCII), gộp khoảng trắng thừa. */
export function normalizeForSecretScan(text: string): string {
  return text
    .normalize('NFKC')
    .replace(INVISIBLE_CHARS, '')
    .replace(/\s+/g, ' ');
}

// Đoạn có thể là base64 (chuẩn hoặc URL-safe). Ngưỡng 16 ký tự: key ngắn nhất
// được quét (sk- + 8) mã hóa ra từ 16 ký tự trở lên.
const BASE64_CANDIDATE = /[A-Za-z0-9+/_-]{16,8192}={0,2}/g;
/** Giải mã lồng nhau tối đa 2 lớp (base64 của base64). */
const MAX_BASE64_DEPTH = 2;
/** Tỉ lệ ký tự in được tối thiểu để coi kết quả giải mã là văn bản. */
const MIN_PRINTABLE_RATIO = 0.85;

/**
 * Giải mã một đoạn base64 thành văn bản UTF-8. Trả null nếu không phải base64
 * hợp lệ hoặc giải mã ra dữ liệu nhị phân (chuỗi thường như tên biến dài cũng
 * "giải mã" được nhưng ra rác, nên phải lọc theo tỉ lệ ký tự in được).
 * Dùng atob/TextDecoder: có sẵn ở cả Node và trình duyệt (file dùng chung với FE).
 */
export function decodeBase64Text(candidate: string): string | null {
  const std = candidate
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=+$/, '');
  if (std.length % 4 === 1) return null;
  let binary: string;
  try {
    binary = atob(std + '='.repeat((4 - (std.length % 4)) % 4));
  } catch {
    return null;
  }
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  const text = new TextDecoder('utf-8').decode(bytes);
  if (!text) return null;
  let printable = 0;
  for (const ch of text) {
    if (
      ch === '\n' ||
      ch === '\t' ||
      (ch >= ' ' && ch !== '\u007F' && ch !== '\uFFFD')
    ) {
      printable++;
    }
  }
  return printable / [...text].length >= MIN_PRINTABLE_RATIO ? text : null;
}

export function textContainsSecret(text: string, depth = 0): boolean {
  const normalized = normalizeForSecretScan(text);
  const compact = normalized.replace(/\s+/g, '');
  if (
    SECRET_PATTERNS.some(
      (p) => p.re.test(normalized) || (p.compact && p.re.test(compact)),
    )
  ) {
    return true;
  }
  // Key bị mã hóa base64 để né regex: giải mã từng đoạn rồi quét lại.
  if (depth >= MAX_BASE64_DEPTH) return false;
  for (const candidate of normalized.match(BASE64_CANDIDATE) ?? []) {
    const decoded = decodeBase64Text(candidate);
    if (decoded && textContainsSecret(decoded, depth + 1)) return true;
  }
  return false;
}

/**
 * Quét mọi chuỗi (cả tên khóa) trong payload, không giới hạn độ sâu. Dùng
 * ngăn xếp thay vì đệ quy để JSON lồng rất sâu không làm tràn stack.
 */
export function containsSecret(value: unknown): boolean {
  const stack: unknown[] = [value];
  const seen = new Set<object>();
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current === 'string') {
      if (textContainsSecret(current)) return true;
    } else if (current && typeof current === 'object') {
      if (seen.has(current)) continue;
      seen.add(current);
      if (Array.isArray(current)) {
        stack.push(...current);
      } else {
        for (const [k, v] of Object.entries(current)) stack.push(k, v);
      }
    }
  }
  return false;
}
