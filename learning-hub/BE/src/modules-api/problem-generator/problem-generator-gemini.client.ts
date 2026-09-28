import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { buildProblemPrompt } from './problem-prompt-builder';
import { ProblemDraft, ProblemSpec } from './problem-generator.types';
import { ProblemGeneratorLlmClient } from './problem-generator-llm.client';

function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
  private readonly maxOutputTokens = 2048;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY chưa được cấu hình — không thể khởi tạo GeminiProblemGeneratorClient.',
      );
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  // Số lần thử lại khi Gemini trả lỗi 503 (quá tải)/429 (rate limit) — cả
  // hai đều là lỗi tạm thời phía Google, không phải lỗi request. Không retry
  // các lỗi khác (400 sai key, 404 sai model...) vì thử lại cũng vô ích.
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 5000;

  async generate(spec: ProblemSpec): Promise<ProblemDraft> {
    const prompt = buildProblemPrompt(spec);
    const raw = await this.callWithRetry(spec, prompt);

    if (!raw.trim()) {
      throw new Error(`Gemini trả về response rỗng cho spec ${spec.id}.`);
    }

    let parsed: GeminiProblemResponse;
    try {
      parsed = JSON.parse(raw) as GeminiProblemResponse;
    } catch (err) {
      throw new Error(
        `Không parse được JSON Gemini trả về cho spec ${spec.id}: ${(err as Error).message}. Raw: ${raw.slice(0, 500)}`,
      );
    }

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
        const isRetryable = /"code":\s*(503|429)/.test(lastError.message);

        if (!isRetryable || attempt === this.maxRetries) {
          throw new Error(
            `Gọi Gemini API thất bại cho spec ${spec.id} (lần thử ${attempt}/${this.maxRetries}): ${lastError.message}`,
          );
        }

        this.logger.warn(
          `Gemini quá tải/rate-limit cho spec ${spec.id}, thử lại lần ${attempt + 1}/${this.maxRetries} sau ${this.retryDelayMs}ms.`,
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
      }
    }

    // Không bao giờ tới được đây (vòng lặp luôn return hoặc throw), nhưng
    // TypeScript cần một nhánh trả về/ném lỗi tường minh ở cuối hàm.
    throw lastError ?? new Error(`Gọi Gemini API thất bại cho spec ${spec.id}.`);
  }
}
