import { Logger } from '@nestjs/common';
import { GeminiClientCache } from '../../common/gemini-client-cache';
import type { GeminiKeySource } from '../../common/gemini-client-cache';
import { ADVISOR_SYSTEM_INSTRUCTION } from './learner-advice';

export const LEARNER_ADVISOR = 'LEARNER_ADVISOR';

export interface LearnerAdvisor {
  /** Trả về văn bản JSON của model; lỗi API (hết quota, mất mạng) thì trả null. */
  advise(prompt: string): Promise<string | null>;
}

/** Gọi Gemini thật để cố vấn bài tập kế tiếp từ lịch sử làm bài. */
export class GeminiLearnerAdvisor implements LearnerAdvisor {
  private readonly logger = new Logger(GeminiLearnerAdvisor.name);
  private readonly gemini: GeminiClientCache;
  private readonly model = 'gemini-flash-lite-latest';

  constructor(apiKey: GeminiKeySource) {
    this.gemini = new GeminiClientCache(apiKey);
  }

  async advise(prompt: string): Promise<string | null> {
    try {
      const res = await this.gemini.get().models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
          temperature: 0.3,
          maxOutputTokens: 400,
          responseMimeType: 'application/json',
        },
      });
      const text = (res.text ?? '').trim();
      return text || null;
    } catch (err) {
      this.logger.warn(`Gemini gợi ý bài tập thất bại: ${(err as Error).message}`);
      return null;
    }
  }
}
