import { INTEGRITY_CONFIG } from './integrity.config';

/**
 * Chuẩn hóa mã Python trước khi so khớp: bỏ chú thích `#`, docstring, dòng
 * trống, khoảng trắng thừa; chuỗi/số được thay bằng placeholder để đổi tên
 * hằng không làm giảm điểm. Giữ nguyên tên biến (đổi tên biến là tín hiệu
 * cho giảng viên tự đánh giá, không phải thứ máy nên đoán).
 */
export function normalizeCode(source: string): string {
  const withoutDocstrings = source
    .replace(/\r\n?/g, '\n')
    .replace(/("""|''')[\s\S]*?\1/g, ' ');
  const lines = withoutDocstrings.split('\n').map((line) => {
    let out = '';
    let quote: string | null = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) {
          quote = null;
          out += '"S"';
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === '#') break;
      out += ch;
    }
    return out.replace(/\s+/g, ' ').trim();
  });
  return lines.filter(Boolean).join('\n');
}

const TOKEN_RE = /[A-Za-z_][A-Za-z_0-9]*|\d+(?:\.\d+)?|"S"|[^\sA-Za-z_0-9]/g;

export function tokenize(normalized: string): string[] {
  return (normalized.match(TOKEN_RE) ?? []).map((t) =>
    /^\d/.test(t) ? '0' : t,
  );
}

/**
 * Loại các dòng thuộc mã khung (starter code) khỏi bài làm: hai bài cùng
 * dùng khung mẫu không được coi là giống nhau chỉ vì phần khung.
 */
export function stripStarter(code: string, starter: string): string {
  const starterLines = new Set(
    normalizeCode(starter ?? '')
      .split('\n')
      .filter(Boolean),
  );
  if (starterLines.size === 0) return normalizeCode(code);
  return normalizeCode(code)
    .split('\n')
    .filter((line) => !starterLines.has(line))
    .join('\n');
}

function shingles(tokens: string[], size: number): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i + size <= tokens.length; i++) {
    set.add(tokens.slice(i, i + size).join(' '));
  }
  return set;
}

export interface SimilarityResult {
  /** Jaccard 0-1 trên n-gram token; 0 nếu một bên quá ngắn để so khớp. */
  score: number;
  comparable: boolean;
}

/** So khớp hai mã đã bỏ khung. Bài quá ngắn: không so khớp (comparable=false). */
export function compareCode(a: string, b: string): SimilarityResult {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const min = INTEGRITY_CONFIG.minTokensForSimilarity;
  if (ta.length < min || tb.length < min) return { score: 0, comparable: false };
  const sa = shingles(ta, INTEGRITY_CONFIG.shingleSize);
  const sb = shingles(tb, INTEGRITY_CONFIG.shingleSize);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = sa.size + sb.size - inter;
  const score = union === 0 ? 0 : inter / union;
  return { score: Math.round(score * 1000) / 1000, comparable: true };
}

export interface SimilarityMatch {
  score: number;
  submissionId?: string;
  userId?: string;
}

/** Tìm bài nộp giống nhất của HỌC VIÊN KHÁC; không bao giờ so với chính mình. */
export function findBestMatch(
  code: string,
  starter: string,
  others: Array<{ id: string; userId?: string; code: string }>,
  selfUserId: string,
): SimilarityMatch {
  const mine = stripStarter(code, starter);
  let best: SimilarityMatch = { score: 0 };
  for (const other of others.slice(0, INTEGRITY_CONFIG.maxComparisons)) {
    if (!other.userId || other.userId === selfUserId) continue;
    const r = compareCode(mine, stripStarter(other.code, starter));
    if (r.comparable && r.score > best.score) {
      best = { score: r.score, submissionId: other.id, userId: other.userId };
    }
  }
  return best;
}
