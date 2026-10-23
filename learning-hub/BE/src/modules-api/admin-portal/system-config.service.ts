import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { GoogleGenAI } from '@google/genai';
import { Model } from 'mongoose';
import {
  SystemConfig,
  SystemConfigDocument,
} from '../../modules-system/database/schemas/admin-portal.schemas';
import type { PromptKey, PromptProvider } from '../../common/prompt-provider';
import { SYSTEM_PROMPT } from '../coach/coach.service';
import { DEBUG_SYSTEM_INSTRUCTION } from '../coach/coach-debug-explainer';
import { INSIGHT_SYSTEM_INSTRUCTION } from '../da-labs/insight-llm.client';
import { decryptSecret, encryptSecret, maskSecret, ConfigEncryptionUnavailableError } from './config-crypto';

export const GEMINI_KEY = 'GEMINI_API_KEY';
/** Thời gian giữ prompt/khóa trong bộ nhớ trước khi đọc lại CSDL (Admin sửa thì được làm mới ngay). */
export const CONFIG_CACHE_TTL_MS = 60_000;
export const GEMINI_PING_TIMEOUT_MS = 3_000;
export const REJECTED_REASON = 'Gemini từ chối API key.';
export const MIN_PROMPT_CHARS = 20;
export const MAX_PROMPT_CHARS = 8_000;

export const PROMPT_DEFS: Array<{ key: PromptKey; configKey: string; title: string; description: string; fallback: string }> = [
  { key: 'coach', configKey: 'prompt.coach', title: 'AI Tutor gợi ý', description: 'Chỉ dẫn hệ thống của AI Coach khi học viên hỏi gợi ý trong lúc làm bài.', fallback: SYSTEM_PROMPT },
  { key: 'debug', configKey: 'prompt.debug', title: 'Phân tích lỗi', description: 'Chỉ dẫn cho AI khi phân tích lỗi bài nộp (Debug Loop).', fallback: DEBUG_SYSTEM_INSTRUCTION },
  { key: 'ailab', configKey: 'prompt.ailab', title: 'AI Lab Evaluator', description: 'Chỉ dẫn cho AI giám khảo khi chấm bài lab theo rubric.', fallback: INSIGHT_SYSTEM_INSTRUCTION },
];

export interface GeminiPingResult {
  valid: boolean;
  latencyMs: number;
  /** Lý do khi không hợp lệ (không bao giờ chứa khóa). */
  reason?: string;
}

/**
 * Cấu hình hệ thống do Admin quản lý: API key Gemini (mã hóa AES-256-GCM khi lưu, chỉ trả dạng che) và 3 system prompt của AI.
 * Prompt được giữ trong bộ nhớ TTL 60 giây; Admin sửa thì làm mới ngay để request AI kế tiếp dùng cấu hình mới mà không phải
 * truy vấn MongoDB liên tục. Khóa không bao giờ được ghi log hay trả về dạng rõ.
 */
@Injectable()
export class SystemConfigService implements PromptProvider, OnModuleInit {
  private readonly logger = new Logger(SystemConfigService.name);
  private readonly promptCache = new Map<string, { value: string | null; expiresAt: number }>();
  private keyCache: { value: string | undefined; expiresAt: number } | null = null;
  private refreshing = false;

  constructor(
    @InjectModel(SystemConfig.name) private readonly configs: Model<SystemConfigDocument>,
    private readonly env: ConfigService,
  ) {}

  private loading: Promise<void> | null = null;

  /** Nạp khóa Gemini từ CSDL một lần (các provider AI chờ bước này trước khi quyết định có bật Gemini hay không). */
  ensureLoaded(): Promise<void> {
    if (this.keyCache) return Promise.resolve();
    return (this.loading ??= this.refreshKey().catch(() => undefined).then(() => undefined));
  }

  async onModuleInit() {
    await this.refreshKey().catch((e) => this.logger.warn(`Chưa nạp được khóa Gemini từ CSDL: ${(e as Error).message}`));
  }

  private secret(): string | undefined {
    return this.env.get<string>('CONFIG_ENCRYPTION_KEY');
  }

  get encryptionReady(): boolean {
    return (this.secret() ?? '').trim().length >= 16;
  }

  // ------------------------------- API key -------------------------------

  private async refreshKey() {
    const doc = await this.configs.findOne({ key: GEMINI_KEY }).lean<{ value: string }>();
    let value: string | undefined;
    if (doc?.value) {
      try {
        value = decryptSecret(doc.value, this.secret());
      } catch (err) {
        // Sai CONFIG_ENCRYPTION_KEY hoặc dữ liệu hỏng: không dùng khóa này, rơi về biến môi trường.
        this.logger.error(`Không giải mã được khóa Gemini đã lưu (${(err as Error).message}); dùng biến môi trường.`);
      }
    }
    this.keyCache = { value, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  }

  /**
   * Khóa Gemini hiện hành cho các dịch vụ AI: khóa Admin đã lưu (nếu có), không thì GEMINI_API_KEY trong .env. Đồng bộ để dùng
   * làm nguồn khóa của client; hết TTL thì làm mới ngầm ở lần gọi sau.
   */
  currentGeminiKey = (): string | undefined => {
    if (!this.keyCache || this.keyCache.expiresAt < Date.now()) {
      if (!this.refreshing) {
        this.refreshing = true;
        this.refreshKey()
          .catch(() => undefined)
          .finally(() => (this.refreshing = false));
      }
    }
    return this.keyCache?.value || this.env.get<string>('GEMINI_API_KEY') || undefined;
  };

  async keyInfo() {
    const doc = await this.configs.findOne({ key: GEMINI_KEY }).lean<{ value: string; updatedAt?: Date; updatedBy?: string }>();
    let stored: string | undefined;
    if (doc?.value) {
      try {
        stored = decryptSecret(doc.value, this.secret());
      } catch {
        stored = undefined;
      }
    }
    const envKey = this.env.get<string>('GEMINI_API_KEY') || undefined;
    const effective = stored || envKey;
    return {
      configured: !!effective,
      source: stored ? ('database' as const) : envKey ? ('env' as const) : ('none' as const),
      masked: maskSecret(effective),
      updatedAt: stored ? doc?.updatedAt ?? null : null,
      updatedBy: stored ? doc?.updatedBy ?? null : null,
    };
  }

  async setGeminiKey(plain: unknown, adminId: string, verify = true) {
    // Khoảng trắng/xuống dòng ở đầu cuối (dán từ trình soạn thảo) được cắt sạch trước khi kiểm tra và mã hóa.
    const key = typeof plain === 'string' ? plain.trim() : '';
    if (key.length < 20 || key.length > 200 || /\s/.test(key)) {
      throw new BadRequestException('API key không hợp lệ (20-200 ký tự, không có khoảng trắng).');
    }
    // Key giả/sai: hỏi Gemini trước khi lưu. Chỉ chặn khi Gemini TỪ CHỐI key; lỗi mạng/timeout/hết hạn mức vẫn cho lưu (không đổ lỗi cho key).
    if (verify) {
      const ping = await this.pingGemini(key);
      if (!ping.valid && ping.reason === REJECTED_REASON) throw new BadRequestException('API key bị Gemini từ chối (key giả hoặc đã bị thu hồi). Chưa lưu gì.');
    }
    let encrypted: string;
    try {
      encrypted = encryptSecret(key, this.secret());
    } catch (err) {
      if (err instanceof ConfigEncryptionUnavailableError) throw new BadRequestException(err.message);
      throw err;
    }
    const before = (await this.keyInfo()).masked;
    await this.configs.updateOne(
      { key: GEMINI_KEY },
      { $set: { value: encrypted, category: 'AI_KEY', encrypted: true, updatedBy: adminId, updatedAt: new Date() } },
      { upsert: true },
    );
    this.keyCache = { value: key, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
    return { before, after: maskSecret(key) };
  }

  /** Gọi thử một lệnh rất ngắn sang Gemini với timeout 3 giây. Không bao giờ ném lỗi, không đưa khóa vào thông báo. */
  async pingGemini(candidate?: string): Promise<GeminiPingResult> {
    const key = (candidate ?? '').trim() || this.currentGeminiKey();
    if (!key) return { valid: false, latencyMs: 0, reason: 'Chưa cấu hình API key.' };
    const started = Date.now();
    let timer: NodeJS.Timeout | undefined;
    try {
      const client = new GoogleGenAI({ apiKey: key });
      const call = client.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: 'ping',
        config: { maxOutputTokens: 1, temperature: 0 },
      });
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('TIMEOUT')), GEMINI_PING_TIMEOUT_MS);
      });
      await Promise.race([call, timeout]);
      return { valid: true, latencyMs: Date.now() - started };
    } catch (err) {
      const msg = String((err as Error)?.message ?? '');
      const latencyMs = Date.now() - started;
      if (msg === 'TIMEOUT') return { valid: false, latencyMs, reason: 'Gemini phản hồi quá 3 giây.' };
      if (/API key|API_KEY|invalid|401|403|PERMISSION/i.test(msg)) return { valid: false, latencyMs, reason: REJECTED_REASON };
      if (/429|quota|RESOURCE_EXHAUSTED/i.test(msg)) return { valid: true, latencyMs, reason: 'Key hợp lệ nhưng đang hết hạn mức (quota).' };
      return { valid: false, latencyMs, reason: 'Không gọi được Gemini.' };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // ------------------------------- Prompts -------------------------------

  async get(key: PromptKey, fallback: string): Promise<string> {
    const def = PROMPT_DEFS.find((d) => d.key === key);
    if (!def) return fallback;
    const hit = this.promptCache.get(def.configKey);
    if (hit && hit.expiresAt > Date.now()) return hit.value ?? fallback;
    let value: string | null = null;
    try {
      const doc = await this.configs.findOne({ key: def.configKey }).lean<{ value: string }>();
      value = doc?.value?.trim() ? doc.value : null;
    } catch (err) {
      this.logger.warn(`Không đọc được prompt "${def.configKey}" từ CSDL, dùng bản trong bộ nhớ/mặc định: ${(err as Error).message}`);
      return hit?.value ?? fallback;
    }
    this.promptCache.set(def.configKey, { value, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS });
    return value ?? fallback;
  }

  /** Lưu prompt mới (hoặc về mặc định nếu để trống) và làm mới cache ngay. */
  async setPrompt(configKey: string, raw: unknown, adminId: string) {
    const def = PROMPT_DEFS.find((d) => d.configKey === configKey);
    if (!def) throw new BadRequestException('Khóa cấu hình không hợp lệ.');
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value && (value.length < MIN_PROMPT_CHARS || value.length > MAX_PROMPT_CHARS)) {
      throw new BadRequestException(`System prompt từ ${MIN_PROMPT_CHARS} đến ${MAX_PROMPT_CHARS} ký tự (để trống để về mặc định).`);
    }
    const prev = await this.configs.findOne({ key: configKey }).lean<{ value: string }>();
    const before = prev?.value ?? def.fallback;
    if (!value) {
      await this.configs.deleteOne({ key: configKey });
    } else {
      await this.configs.updateOne(
        { key: configKey },
        { $set: { value, category: 'AI_PROMPT', encrypted: false, updatedBy: adminId, updatedAt: new Date() } },
        { upsert: true },
      );
    }
    // Làm mới ngay: request AI kế tiếp đọc bản mới, không phải chờ hết TTL.
    this.promptCache.delete(configKey);
    return { before, after: value || def.fallback };
  }

  async list() {
    const docs = await this.configs.find({ key: { $in: PROMPT_DEFS.map((d) => d.configKey) } }).lean<Array<{ key: string; value: string; updatedAt?: Date; updatedBy?: string }>>();
    const byKey = new Map(docs.map((d) => [d.key, d]));
    return {
      encryptionReady: this.encryptionReady,
      gemini: await this.keyInfo(),
      prompts: PROMPT_DEFS.map((d) => {
        const doc = byKey.get(d.configKey);
        return {
          configKey: d.configKey,
          key: d.key,
          title: d.title,
          description: d.description,
          value: doc?.value ?? d.fallback,
          isDefault: !doc,
          updatedAt: doc?.updatedAt ?? null,
          updatedBy: doc?.updatedBy ?? null,
          maxChars: MAX_PROMPT_CHARS,
        };
      }),
    };
  }
}
