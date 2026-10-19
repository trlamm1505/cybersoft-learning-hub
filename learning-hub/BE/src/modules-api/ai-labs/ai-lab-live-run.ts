import { Logger } from '@nestjs/common';
import { GeminiClientCache } from '../../common/gemini-client-cache';
import type { GeminiKeySource } from '../../common/gemini-client-cache';
import type { EvaluationItem } from '../../integration/dataset-contract.types';

export const AI_LAB_LIVE_LLM = 'AI_LAB_LIVE_LLM';
/** Giới hạn token đầu ra mỗi câu để tiết kiệm chi phí (bài lab chỉ cần câu trả lời ngắn). */
export const LIVE_MAX_OUTPUT_TOKENS = 250;
/** Mỗi lần nộp chỉ chạy thật tối đa số câu này (mỗi loại câu một câu) để giữ chi phí và độ trễ thấp. */
export const LIVE_MAX_ITEMS = 3;
export const LIVE_TIMEOUT_MS = 15_000;

export interface AiLabLiveLlm {
  /** Gửi prompt của học viên làm system instruction và câu hỏi làm nội dung người dùng; trả về câu trả lời, lỗi thì ném. */
  generate(systemPrompt: string, question: string): Promise<string>;
}

export class GeminiAiLabLiveLlm implements AiLabLiveLlm {
  private readonly logger = new Logger(GeminiAiLabLiveLlm.name);
  private readonly gemini: GeminiClientCache;
  readonly model = 'gemini-flash-lite-latest';

  constructor(apiKey: GeminiKeySource) {
    this.gemini = new GeminiClientCache(apiKey);
  }

  async generate(systemPrompt: string, question: string): Promise<string> {
    const res = await this.gemini.get().models.generateContent({
      model: this.model,
      contents: question,
      config: { systemInstruction: systemPrompt, temperature: 0.2, maxOutputTokens: LIVE_MAX_OUTPUT_TOKENS },
    });
    return (res.text ?? '').trim();
  }
}

export interface LiveItemResult {
  questionId: string;
  category: string;
  question: string;
  output: string;
  passed: boolean;
  checks: {
    /** Chỉ có khi bài yêu cầu JSON. */
    jsonValid?: boolean;
    /** true khi độ phủ từ khóa thấp (chỉ cảnh báo tham khảo, không làm trượt). */
    keywordsInformational?: boolean;
    /** ANSWER: tỷ lệ từ khóa/số liệu chuẩn có trong câu trả lời (0-1), chỉ để tham khảo. */
    keywordCoverage?: number;
    matchedKeywords?: string[];
    missingKeywords?: string[];
    /** ABSTAIN: câu trả lời có từ chối đúng cách không. */
    refused?: boolean;
  };
}

export interface LiveRunResult {
  source: 'gemini' | 'skipped' | 'unavailable';
  model?: string;
  reason?: string;
  items: LiveItemResult[];
  /** Tỷ lệ câu đạt (0-1). */
  passRate: number;
}

const STOP_WORDS = new Set(
  'những các của và là có không được trong cho với một này đó khi nên cần theo như các từ đến tại về sẽ đã bạn chúng tôi thì mà hoặc nếu vì nhưng cũng rất hơn nhiều'.split(' '),
);
const REFUSAL = /(từ chối|không thể (trả lời|cung cấp|hỗ trợ)|không có thông tin|không nằm trong|ngoài phạm vi|xin lỗi|chưa có thông tin|không được hỗ trợ|không tìm thấy|không đủ thông tin|i (can't|cannot)|sorry)/i;
const MAX_KEYWORDS = 6;
export const KEYWORD_PASS_RATIO = 0.5;

const normalize = (s: string) => s.toLowerCase().normalize('NFC');

/** Từ khóa chuẩn của một câu: số liệu (phí, tỷ lệ, thời hạn) rồi các từ đặc trưng dài, tối đa MAX_KEYWORDS. */
export function extractKeywords(groundTruth: string): string[] {
  const text = normalize(groundTruth);
  const numbers = [...text.matchAll(/\d[\d.,]*/g)].map((m) => m[0].replace(/[.,]$/, ''));
  const words = (text.match(/[\p{L}]{5,}/gu) ?? []).filter((w) => !STOP_WORDS.has(w));
  const uniq: string[] = [];
  for (const k of [...numbers, ...words]) if (!uniq.includes(k)) uniq.push(k);
  return uniq.slice(0, MAX_KEYWORDS);
}

/** Bỏ rào ```json ... ``` rồi parse; trả true nếu là JSON hợp lệ. */
export function isValidJson(output: string): boolean {
  const body = output.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!body || !/^[[{]/.test(body)) return false;
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

/** Bài/prompt yêu cầu đầu ra JSON thì câu trả lời phải là JSON hợp lệ. */
export function requiresJson(prompt: string, description = ''): boolean {
  return /\bjson\b/i.test(prompt) || /\bjson\b/i.test(description);
}

/** Chấm một câu trả lời thật của Gemini theo tiêu chí có sẵn của bài (cú pháp JSON, từ khóa, từ chối đúng). */
export function evaluateLiveOutput(item: EvaluationItem, output: string, jsonRequired: boolean): LiveItemResult {
  const checks: LiveItemResult['checks'] = {};
  let passed = output.trim().length > 0;

  if (jsonRequired) {
    checks.jsonValid = isValidJson(output);
    if (!checks.jsonValid) passed = false;
  }

  if (item.expected_behavior === 'ABSTAIN') {
    checks.refused = REFUSAL.test(output);
    if (!checks.refused) passed = false;
  } else {
    const keywords = extractKeywords((item.ground_truths ?? [])[0] ?? '');
    const out = normalize(output);
    const matched = keywords.filter((k) => out.includes(k));
    checks.matchedKeywords = matched;
    checks.missingKeywords = keywords.filter((k) => !matched.includes(k));
    checks.keywordCoverage = keywords.length ? Math.round((matched.length / keywords.length) * 100) / 100 : 1;
    // Bài prompt thường không đính kèm tài liệu nên mô hình không thể biết số liệu của quy chế: độ phủ từ khóa chỉ để
    // THAM KHẢO (hiện cho học viên), không quyết định đạt/trượt. Đạt/trượt dựa trên cú pháp (JSON) và hành vi (từ chối đúng).
    checks.keywordsInformational = checks.keywordCoverage < KEYWORD_PASS_RATIO;
  }

  return { questionId: item.question_id, category: item.category, question: item.query, output: output.slice(0, 600), passed, checks };
}

/** Mỗi loại câu một câu (theo thứ tự xuất hiện), tối đa LIVE_MAX_ITEMS, ổn định giữa các lần chạy. */
export function pickLiveItems(items: EvaluationItem[]): EvaluationItem[] {
  const seen = new Set<string>();
  const picked: EvaluationItem[] = [];
  for (const it of items) {
    if (seen.has(it.category)) continue;
    seen.add(it.category);
    picked.push(it);
    if (picked.length >= LIVE_MAX_ITEMS) break;
  }
  return picked;
}

const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Gemini phản hồi quá lâu')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });

/**
 * Chạy prompt của học viên thật trên Gemini với vài câu hỏi của evaluation set rồi tự chấm theo tiêu chí của bài.
 * Không bao giờ ném lỗi: Gemini lỗi/chưa cấu hình thì trả `unavailable`, kết quả chấm chính của bài không bị ảnh hưởng.
 */
export async function runLiveCheck(
  llm: AiLabLiveLlm | null | undefined,
  args: { prompt: string; description?: string; rag: boolean; items: EvaluationItem[]; model?: string },
): Promise<LiveRunResult> {
  if (args.rag) {
    return { source: 'skipped', reason: 'Bài RAG cần ngữ cảnh truy xuất nên chỉ chấm bằng bộ mô phỏng.', items: [], passRate: 0 };
  }
  if (!llm) {
    return { source: 'unavailable', reason: 'Chưa cấu hình GEMINI_API_KEY.', items: [], passRate: 0 };
  }
  const jsonRequired = requiresJson(args.prompt, args.description);
  const picked = pickLiveItems(args.items);
  try {
    const items = await Promise.all(
      picked.map(async (item) => {
        const output = await withTimeout(llm.generate(args.prompt, item.query), LIVE_TIMEOUT_MS);
        return evaluateLiveOutput(item, output, jsonRequired);
      }),
    );
    const passRate = items.length ? Math.round((items.filter((i) => i.passed).length / items.length) * 100) / 100 : 0;
    return { source: 'gemini', model: args.model, items, passRate };
  } catch (err) {
    new Logger('AiLabLiveRun').warn(`Chạy thật trên Gemini thất bại: ${(err as Error).message}`);
    return { source: 'unavailable', reason: 'Gemini đang bận hoặc hết hạn mức, thử lại sau ít phút.', items: [], passRate: 0 };
  }
}
