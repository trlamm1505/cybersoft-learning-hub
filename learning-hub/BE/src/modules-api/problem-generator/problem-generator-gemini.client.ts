import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { slugify } from '../../common/utils/slug.util';
import { buildProblemPrompt } from './problem-prompt-builder';
import { ProblemDraft, ProblemSpec } from './problem-generator.types';
import { ProblemGeneratorLlmClient } from './problem-generator-llm.client';

// Schema ép Gemini trả JSON đúng shape cần thiết (Structured Output), tránh
// phải tự parse markdown/code fence khỏi text response.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    starterCode: { type: Type.STRING },
    solutionCode: { type: Type.STRING },
    testCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          input: { type: Type.STRING },
          expectedOutput: { type: Type.STRING },
          isHidden: { type: Type.BOOLEAN },
        },
        required: ['input', 'expectedOutput', 'isHidden'],
      },
    },
  },
  required: ['title', 'description', 'starterCode', 'solutionCode', 'testCases'],
};

interface GeminiProblemResponse {
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
}

// Các mã lỗi mạng Node.js phổ biến khi gọi API ngoài — timeout, reset kết nối,
// DNS không phân giải được, hoặc lớp fetch-based client (undici/node-fetch)
// ném ra tên lỗi "FetchError"/"AbortError". Tất cả đều là lỗi TẠM THỜI phía
// hạ tầng mạng, không phải lỗi request, nên đều đáng để retry.
const RETRYABLE_NETWORK_ERROR_CODES = [
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
];
const RETRYABLE_ERROR_NAMES = ['FetchError', 'AbortError'];

/**
 * Quyết định một lỗi gọi Gemini có đáng retry hay không. Trước đây CHỈ bắt
 * đúng chuỗi `"code": 503` / `"code": 429` xuất hiện trong message JSON lỗi
 * Google trả về — bỏ sót toàn bộ lỗi tầng mạng (mất kết nối, DNS, timeout)
 * và các mã HTTP 5xx khác (500, 502, 504) cũng là lỗi tạm thời phía server.
 * Export riêng để unit test được logic này mà không cần gọi Gemini thật.
 */
export function isRetryableNetworkError(err: Error): boolean {
  const message = err.message || '';

  if (/"code":\s*(429|5\d\d)/.test(message)) return true;
  if (/\bHTTP\s*(429|5\d\d)\b/.test(message)) return true;
  if (/\bstatus(Code)?["\s:]+(429|5\d\d)\b/i.test(message)) return true;

  const code = (err as NodeJS.ErrnoException).code;
  if (code && RETRYABLE_NETWORK_ERROR_CODES.includes(code)) return true;
  if (RETRYABLE_NETWORK_ERROR_CODES.some((c) => message.includes(c))) return true;

  if (RETRYABLE_ERROR_NAMES.includes(err.name)) return true;
  if (RETRYABLE_ERROR_NAMES.some((n) => message.includes(n))) return true;

  return false;
}

// JSON bị cắt cụt đuôi (chạm trần maxOutputTokens giữa chừng) luôn parse lỗi
// theo một trong hai kiểu SyntaxError đặc trưng này — phân biệt với JSON sai
// cấu trúc thật sự (Gemini trả nhầm shape) để chỉ retry đúng trường hợp có
// thể tự khắc phục bằng cách xin model tóm gọn hơn.
export function looksLikeTruncatedJson(raw: string, parseErrorMessage: string): boolean {
  const trimmed = raw.trim();
  const endsCleanly = trimmed.endsWith('}') || trimmed.endsWith(']');
  if (endsCleanly) return false;

  return (
    /Unexpected end of JSON input/i.test(parseErrorMessage) ||
    /Unterminated string/i.test(parseErrorMessage)
  );
}

/**
 * Gọi Gemini thật (model text, không stream) để sinh bài tập từ prompt build
 * bởi buildProblemPrompt(). Đây là implementation "thật" thay cho
 * StubProblemGeneratorClient — cùng interface ProblemGeneratorLlmClient nên
 * problem-validator.ts và run-pipeline.ts không cần sửa gì khi đổi qua lại
 * giữa 2 client này.
 *
 * KHÔNG tự fallback về stub khi gọi lỗi (hết quota, mất mạng, key sai) —
 * ném lỗi thẳng để pipeline dừng lại và báo rõ ràng, tránh trường hợp một
 * bài "trông như do Gemini sinh" nhưng thực chất là template giả mà không
 * ai biết.
 */
@Injectable()
export class GeminiProblemGeneratorClient implements ProblemGeneratorLlmClient {
  private readonly logger = new Logger(GeminiProblemGeneratorClient.name);
  private readonly client: GoogleGenAI;
  // Flash-Lite: model nhẹ nhất dòng Gemini hiện tại, quota free tier cao
  // nhất và ít bị nghẽn "high demand" hơn các model Flash/Pro đầy đủ — phù
  // hợp để chạy pipeline 10 spec nhiều lần khi đang thử nghiệm.
  private readonly model = 'gemini-flash-lite-latest';
  // Bài có nhiều test case + solutionCode dài có thể vượt 2048 token giữa
  // chừng, khiến JSON bị cắt cụt đuôi (xem looksLikeTruncatedJson) — nâng
  // trần lên 8192 để còn đủ chỗ cho toàn bộ description/testCases/solution
  // trong một lượt sinh, thay vì phải luôn retry vì hết token.
  private readonly maxOutputTokens = 8192;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY chưa được cấu hình — không thể khởi tạo GeminiProblemGeneratorClient.',
      );
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  // Số lần thử lại khi gặp lỗi mạng/HTTP 5xx/429 (xem isRetryableNetworkError)
  // — tất cả đều là lỗi tạm thời phía hạ tầng, không phải lỗi request. Không
  // retry các lỗi khác (400 sai key, 404 sai model...) vì thử lại cũng vô ích.
  private readonly maxRetries = 3;
  // Exponential backoff: 3s, 6s, 12s... thay vì delay cố định — giãn cách xa
  // dần để không dội thêm request vào một dịch vụ đang quá tải/rate-limit.
  private readonly baseRetryDelayMs = 3000;
  // Số lần cho phép model tự sinh lại khi JSON bị cắt cụt do chạm trần token
  // — tách riêng khỏi maxRetries (lỗi mạng) vì đây là lỗi output, retry bằng
  // cách nhắc model súc tích hơn chứ không phải chờ rồi gọi y hệt.
  private readonly maxTruncationRetries = 2;

  async generate(spec: ProblemSpec): Promise<ProblemDraft> {
    const basePrompt = buildProblemPrompt(spec);

    let raw = '';
    let lastParseError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxTruncationRetries; attempt++) {
      const prompt =
        attempt === 0
          ? basePrompt
          : `${basePrompt}\n\nLƯU Ý: Phản hồi trước đã bị cắt cụt vì quá dài. ` +
            `Hãy viết description ngắn gọn hơn, solutionCode tối giản, và giảm ` +
            `số lượng testCases nếu cần, để toàn bộ JSON nằm trong giới hạn token.`;

      raw = await this.callWithRetry(spec, prompt);

      if (!raw.trim()) {
        throw new Error(`Gemini trả về response rỗng cho spec ${spec.id}.`);
      }

      try {
        const parsed = JSON.parse(raw) as GeminiProblemResponse;
        return this.toDraft(spec, parsed);
      } catch (err) {
        lastParseError = err as Error;
        if (
          attempt < this.maxTruncationRetries &&
          looksLikeTruncatedJson(raw, lastParseError.message)
        ) {
          this.logger.warn(
            `JSON Gemini bị cắt cụt cho spec ${spec.id} (lần thử ${attempt + 1}/${this.maxTruncationRetries + 1}), sinh lại với prompt yêu cầu súc tích hơn.`,
          );
          continue;
        }
        throw new Error(
          `Không parse được JSON Gemini trả về cho spec ${spec.id}: ${lastParseError.message}. Raw: ${raw.slice(0, 500)}`,
        );
      }
    }

    // Không bao giờ tới được đây (vòng lặp luôn return hoặc throw ở nhánh
    // catch cuối cùng), nhưng TypeScript cần một nhánh kết thúc tường minh.
    throw (
      lastParseError ??
      new Error(`Không parse được JSON Gemini trả về cho spec ${spec.id}.`)
    );
  }

  private toDraft(spec: ProblemSpec, parsed: GeminiProblemResponse): ProblemDraft {
    if (!parsed.title || !parsed.solutionCode || !Array.isArray(parsed.testCases)) {
      throw new Error(
        `Response Gemini thiếu field bắt buộc cho spec ${spec.id}: ${JSON.stringify(parsed).slice(0, 500)}`,
      );
    }

    this.logger.debug(`Gemini generated draft for spec ${spec.id}: ${parsed.title}`);

    return {
      specId: spec.id,
      slug: `${slugify(parsed.title)}-${spec.id}`,
      title: parsed.title,
      description: parsed.description,
      difficulty: spec.level,
      tags: spec.tags,
      starterCode: parsed.starterCode,
      solutionCode: parsed.solutionCode,
      testCases: parsed.testCases,
    };
  }

  private async callWithRetry(spec: ProblemSpec, prompt: string): Promise<string> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.7,
            maxOutputTokens: this.maxOutputTokens,
          },
        });
        return result.text ?? '';
      } catch (err) {
        lastError = err as Error;
        const isRetryable = isRetryableNetworkError(lastError);

        if (!isRetryable || attempt === this.maxRetries) {
          throw new Error(
            `Gọi Gemini API thất bại cho spec ${spec.id} (lần thử ${attempt}/${this.maxRetries}): ${lastError.message}`,
          );
        }

        const delayMs = this.baseRetryDelayMs * 2 ** (attempt - 1);
        this.logger.warn(
          `Lỗi mạng/quá tải gọi Gemini cho spec ${spec.id}, thử lại lần ${attempt + 1}/${this.maxRetries} sau ${delayMs}ms.`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Không bao giờ tới được đây (vòng lặp luôn return hoặc throw), nhưng
    // TypeScript cần một nhánh trả về/ném lỗi tường minh ở cuối hàm.
    throw lastError ?? new Error(`Gọi Gemini API thất bại cho spec ${spec.id}.`);
  }
}
